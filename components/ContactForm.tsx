"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import type { Contacts, Lang } from "@/content";
import { HONEYPOT_FIELD, TURNSTILE_ACTION, TURNSTILE_SCRIPT_URL } from "@/lib/contact/constants";

type Status = "idle" | "sending" | "success" | "error";

/** Tipo mínimo da API global do Turnstile (sem dependência npm, R14). */
interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  language: string;
  theme: "light" | "dark" | "auto";
  size: "normal" | "flexible" | "compact";
  "response-field": boolean;
  "refresh-expired": "auto" | "manual" | "never";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Formulário de contacto. Envia para app/api/contact/route.ts (que
 * reencaminha por email via Resend). Os rótulos, mensagens e o aviso de
 * privacidade vêm de content/site/contacts.json (`contactForm`), editáveis
 * no admin — nada de texto fixo aqui, com duas exceções deliberadas: o
 * rótulo "Não preencher" do honeypot (invisível, SEC-C-08) e o "…" do botão
 * durante o envio.
 *
 * Anti-spam (task-006, architecture.md 4.2): Cloudflare Turnstile em
 * renderização explícita. O script oficial só é carregado aqui e só quando
 * há `siteKey` (R7). O token é de uso único: o widget é reiniciado depois
 * de cada resposta do servidor.
 *
 * `siteKey === null` (fora de produção, sem configuração): o script não é
 * carregado e o formulário aparece desativado com a mensagem de erro.
 */
export function ContactForm({
  form,
  lang,
  siteKey,
}: {
  form: Contacts["contactForm"];
  lang: Lang;
  siteKey: string | null;
}) {
  const formId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);
  // Widget do Turnstile em erro (ex.: site key recusada, rede bloqueada).
  // O widget volta a tentar sozinho; um token novo limpa este estado.
  const [widgetError, setWidgetError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  /**
   * Cria o widget se o script já estiver carregado. Idempotente: nunca cria
   * dois widgets (sai se já houver um `widgetId`). Chamado em dois sítios (CR-T6-01):
   * - `onReady` do next/script: primeiro carregamento do script;
   * - efeito de montagem abaixo: script já carregado (regresso à página por
   *   navegação client-side, Strict Mode em dev, Fast Refresh). O `onReady`
   *   só corre uma vez por instância do <Script> (ref `hasOnReadyEffectCalled`
   *   em next/dist/client/script.js), por isso não basta para recriar um
   *   widget removido no cleanup.
   */
  const renderWidget = useCallback(() => {
    const api = window.turnstile;
    const container = containerRef.current;
    if (!api || !container || !siteKey || widgetIdRef.current !== null) return;
    // O contentor é só do widget (o React renderiza-o vazio). Restos de um
    // widget anterior sem `widgetId` conhecido são limpos antes de criar o
    // novo, para nunca haver dois widgets no mesmo contentor.
    container.replaceChildren();
    widgetIdRef.current =
      api.render(container, {
        sitekey: siteKey,
        action: TURNSTILE_ACTION,
        // `pt` e `en` constam da lista de códigos suportados pela Cloudflare
        // (developers.cloudflare.com/turnstile/reference/supported-languages).
        language: lang === "en" ? "en" : "pt",
        theme: "light",
        size: "flexible",
        "response-field": false,
        "refresh-expired": "auto",
        callback: (value) => {
          setWidgetError(false);
          setToken(value);
        },
        "expired-callback": () => setToken(null),
        "error-callback": () => {
          setToken(null);
          setWidgetError(true);
        },
        "timeout-callback": () => setToken(null),
      }) ?? null;
  }, [siteKey, lang]);

  // Ciclo de vida simétrico: o widget é criado e removido no mesmo efeito.
  useEffect(() => {
    renderWidget();
    return () => {
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId !== null) window.turnstile?.remove(widgetId);
      // O token do widget removido deixa de ser usado: o próximo widget emite outro.
      setToken(null);
      setWidgetError(false);
    };
  }, [renderWidget]);

  const resetWidget = useCallback(() => {
    setToken(null);
    const widgetId = widgetIdRef.current;
    if (widgetId !== null) window.turnstile?.reset(widgetId);
  }, []);

  if (!form.visible) return null;

  const unavailable = siteKey === null || scriptFailed;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Capturar o form antes de qualquer await: o React põe event.currentTarget
    // a null quando o dispatch síncrono termina.
    const formElement = event.currentTarget;
    if (!token || unavailable) return;
    setStatus("sending");

    const data = new FormData(formElement);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
      turnstileToken: token,
      [HONEYPOT_FIELD]: String(data.get(HONEYPOT_FIELD) ?? ""),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("request failed");
    } catch {
      // O servidor já gastou o token: sem reiniciar o widget, a tentativa
      // seguinte falhava sempre.
      resetWidget();
      setStatus("error");
      return;
    }
    // Fora do try: nada depois de um envio bem-sucedido pode passar o estado a "error".
    resetWidget();
    setStatus("success");
    formElement.reset();
  }

  const privacyId = `${formId}-privacy`;

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      {siteKey !== null && (
        <Script
          id="cf-turnstile"
          src={TURNSTILE_SCRIPT_URL}
          strategy="afterInteractive"
          onReady={renderWidget}
          onError={() => setScriptFailed(true)}
        />
      )}

      <h3 className="contact-form-heading">{form.heading[lang]}</h3>

      {/* Honeypot: escondido visualmente (não display:none — alguns bots ignoram
          isso), sem tabindex, aria-hidden — um visitante real nunca o preenche.
          Nome e rótulo sem semântica de autopreenchimento (SEC-C-08). */}
      <div className="contact-form-honeypot" aria-hidden="true">
        <label htmlFor={`${formId}-${HONEYPOT_FIELD}`}>Não preencher</label>
        <input id={`${formId}-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="contact-form-fieldset" disabled={unavailable}>
        <div className="contact-form-row">
          <div className="contact-form-field">
            <label htmlFor={`${formId}-name`}>{form.nameLabel[lang]}</label>
            <input id={`${formId}-name`} name="name" type="text" required maxLength={150} />
          </div>
          <div className="contact-form-field">
            <label htmlFor={`${formId}-email`}>{form.emailLabel[lang]}</label>
            <input id={`${formId}-email`} name="email" type="email" required maxLength={254} />
          </div>
        </div>

        <div className="contact-form-row">
          <div className="contact-form-field">
            <label htmlFor={`${formId}-phone`}>{form.phoneLabel[lang]}</label>
            <input id={`${formId}-phone`} name="phone" type="tel" maxLength={40} />
          </div>
          <div className="contact-form-field">
            <label htmlFor={`${formId}-subject`}>{form.subjectLabel[lang]}</label>
            <input id={`${formId}-subject`} name="subject" type="text" required maxLength={150} />
          </div>
        </div>

        <div className="contact-form-field">
          <label htmlFor={`${formId}-message`}>{form.messageLabel[lang]}</label>
          <textarea id={`${formId}-message`} name="message" required maxLength={5000} rows={5} />
        </div>

        {siteKey !== null && <div ref={containerRef} className="contact-form-turnstile" />}

        {/* Aviso de privacidade (B3): texto simples, nunca HTML/Markdown (R13). */}
        <p className="contact-form-privacy" id={privacyId}>
          {form.privacyNotice[lang]}
        </p>

        <button
          type="submit"
          className="btn-primary"
          disabled={status === "sending" || token === null}
          aria-describedby={privacyId}
        >
          {status === "sending" ? "…" : form.submitLabel[lang]}
        </button>
      </fieldset>

      {status === "success" && (
        <p className="contact-form-status contact-form-status--success" role="status">
          {form.successMessage[lang]}
        </p>
      )}
      {widgetError && !unavailable && status !== "error" && (
        <p className="contact-form-status contact-form-status--error" role="alert">
          {form.verificationErrorMessage[lang]}
        </p>
      )}
      {(status === "error" || unavailable) && (
        <p className="contact-form-status contact-form-status--error" role="alert">
          {form.errorMessage[lang]}
        </p>
      )}
    </form>
  );
}
