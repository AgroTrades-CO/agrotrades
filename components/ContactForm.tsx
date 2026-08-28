"use client";

import { useId, useState } from "react";
import type { Contacts, Lang } from "@/content";

// Tem de bater certo com HONEYPOT_FIELD em app/api/contact/route.ts.
const HONEYPOT_FIELD = "empresa";

type Status = "idle" | "sending" | "success" | "error";

/**
 * Formulário de contacto — primeiro formulário interativo do site. Envia
 * para app/api/contact/route.ts (que reencaminha por email via Resend).
 * Os rótulos/mensagens vêm de content/site/contacts.json (`contactForm`),
 * editáveis no admin — nada de texto fixo aqui.
 */
export function ContactForm({ form, lang }: { form: Contacts["contactForm"]; lang: Lang }) {
  const formId = useId();
  const [status, setStatus] = useState<Status>("idle");

  if (!form.visible) return null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
      [HONEYPOT_FIELD]: String(data.get(HONEYPOT_FIELD) ?? ""),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("request failed");
      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <h3 className="contact-form-heading">{form.heading[lang]}</h3>

      {/* Honeypot: escondido visualmente (não display:none — alguns bots ignoram
          isso), sem tabindex, aria-hidden — um visitante real nunca o preenche. */}
      <div className="contact-form-honeypot" aria-hidden="true">
        <label htmlFor={`${formId}-${HONEYPOT_FIELD}`}>Empresa</label>
        <input id={`${formId}-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

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

      <button type="submit" className="btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "…" : form.submitLabel[lang]}
      </button>

      {status === "success" && (
        <p className="contact-form-status contact-form-status--success" role="status">
          {form.successMessage[lang]}
        </p>
      )}
      {status === "error" && (
        <p className="contact-form-status contact-form-status--error" role="alert">
          {form.errorMessage[lang]}
        </p>
      )}
    </form>
  );
}
