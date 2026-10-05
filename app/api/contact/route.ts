import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readContactConfig, type ContactConfig } from "@/lib/contact/env";
import { verifyTurnstileToken } from "@/lib/contact/turnstile";
import {
  HONEYPOT_FIELD,
  MAX_BODY_BYTES,
  TURNSTILE_ACTION,
  TURNSTILE_TOKEN_MAX_LENGTH,
} from "@/lib/contact/constants";
import { contacts } from "@/content";

/**
 * `/api/contact` — recebe o formulário de contacto de /contactos e
 * /en/contact e envia-o por email via Resend.
 *
 * Sem base de dados: a aplicação não guarda as mensagens. Ficam na caixa
 * de destino (`CONTACT_RECIPIENT_EMAIL`, variável de ambiente só de
 * Production — nunca no CMS) e no registo do Resend.
 *
 * Ordem vinculativa das verificações: as baratas e locais primeiro, depois
 * a Cloudflare (Turnstile), e só depois o Resend. Falha fechada em tudo
 * em qualquer erro. Respostas sempre `{ ok }` genérico com
 * `Cache-Control: no-store`. Logs só com os eventos do tipo
 * `ContactLogEvent` (lista fechada, imposta pelo compilador): nunca
 * valores dos campos, IP,
 * User-Agent, token, secret, `error.message` de terceiros nem issues
 * completos do Zod.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[api/contact]";

/**
 * Caracteres de controlo C0/C1 e separadores de linha Unicode (U+2028/U+2029).
 * Construídos a partir de string (escapes duplos) e não como literal de
 * regex: o minificador converte os escapes U+2028/U+2029 em caracteres
 * reais, que terminam um literal de regex e partem o bundle do servidor.
 */
const SINGLE_LINE_FORBIDDEN = new RegExp("[\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029]");
/** Em texto multilinha só se permitem \t, \n e \r. */
const MULTI_LINE_FORBIDDEN = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]");

const noControlChars = (value: string) => !SINGLE_LINE_FORBIDDEN.test(value);

const contactFormSchema = z.object({
  name: z.string().trim().min(1).max(150).refine(noControlChars),
  email: z.string().trim().email().max(254),
  // Espaço literal, não `\s` (que aceitaria quebras de linha).
  phone: z.string().trim().max(40).regex(/^[0-9+() .-]*$/).optional(),
  subject: z.string().trim().min(1).max(150).refine(noControlChars),
  message: z
    .string()
    .trim()
    .min(1)
    .max(5000)
    .refine((value) => !MULTI_LINE_FORBIDDEN.test(value)),
  turnstileToken: z.string().min(1).max(TURNSTILE_TOKEN_MAX_LENGTH),
  [HONEYPOT_FIELD]: z.string().max(200).optional(),
});

/** Primeira linha fixa do corpo do email. Nunca no CMS. */
const EMAIL_WARNING =
  "Mensagem enviada por um visitante através do formulário do site. O remetente não foi verificado: confirme por outro canal antes de abrir ligações ou efetuar pagamentos.";

type ContactLogEvent =
  | "config_invalid"
  | "dry_run_secrets_present"
  | "origin_rejected"
  | "content_type_rejected"
  | "body_too_large"
  | "body_unreadable"
  | "invalid_json"
  | "validation_failed"
  | "honeypot"
  | "turnstile_rejected"
  | "turnstile_unavailable"
  | "dry_run"
  | "send_failed"
  | "sent";

const INFO_EVENTS: ReadonlySet<ContactLogEvent> = new Set<ContactLogEvent>(["honeypot", "dry_run", "sent"]);

function log(requestId: string, event: ContactLogEvent, detail?: string) {
  const line = `${LOG_PREFIX} ${requestId} ${event}${detail ? ` ${detail}` : ""}`;
  if (INFO_EVENTS.has(event)) console.info(line);
  else console.error(line);
}

function reply(ok: boolean, status: number, extraHeaders?: Record<string, string>): NextResponse {
  const response = NextResponse.json({ ok }, { status });
  response.headers.set("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(extraHeaders ?? {})) {
    response.headers.set(key, value);
  }
  return response;
}

type BodyResult = { ok: true; text: string } | { ok: false; reason: "too_large" | "unreadable" };

/**
 * Lê o corpo acumulando bytes e pára ao passar `limit`.
 * Nunca `request.json()`/`request.text()` sem limite.
 */
async function readBodyWithLimit(request: NextRequest, limit: number): Promise<BodyResult> {
  if (!request.body) return { ok: true, text: "" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "unreadable" };
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(buffer) };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

function expectedOrigin(config: ContactConfig, request: NextRequest): string {
  return config.mode === "send" ? config.siteOrigin : request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // 1. Formulário desligado no admin: recusar também chamadas diretas.
  if (!contacts.contactForm.visible) {
    return reply(false, 404);
  }

  // 2. Configuração explícita e válida, ou 503.
  const configResult = readContactConfig();
  if (!configResult.ok) {
    log(requestId, "config_invalid", `${configResult.variable} (${configResult.reason})`);
    return reply(false, 503);
  }
  const { config } = configResult;
  if (configResult.warnings.length > 0) {
    // Nome das variáveis, nunca o valor.
    log(requestId, "dry_run_secrets_present", configResult.warnings.join(","));
  }

  // 3. Origem.
  const secFetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  if ((secFetchSite !== null && secFetchSite !== "same-origin") || (origin !== null && origin !== expectedOrigin(config, request))) {
    log(requestId, "origin_rejected");
    return reply(false, 403);
  }

  // 4. Content-Type.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    log(requestId, "content_type_rejected");
    return reply(false, 415);
  }

  // 5. Tamanho.
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    log(requestId, "body_too_large");
    return reply(false, 413);
  }
  const body = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (!body.ok) {
    if (body.reason === "too_large") {
      log(requestId, "body_too_large");
      return reply(false, 413);
    }
    log(requestId, "body_unreadable");
    return reply(false, 400);
  }

  // 6. JSON.
  let json: unknown;
  try {
    json = JSON.parse(body.text);
  } catch {
    log(requestId, "invalid_json");
    return reply(false, 400);
  }

  // 7. Validação (limites + caracteres de controlo).
  const parsed = contactFormSchema.safeParse(json);
  if (!parsed.success) {
    // Só caminho e código de cada issue: no Zod 4 os issues podem trazer `input`.
    const summary = parsed.error.issues.map((issue) => `${issue.path.join(".")}:${issue.code}`).join(",");
    log(requestId, "validation_failed", summary);
    return reply(false, 400);
  }
  const { name, email, phone, subject, message, turnstileToken, [HONEYPOT_FIELD]: honeypot } = parsed.data;

  // 8. Honeypot: OK sem denunciar a deteção, sem envio.
  if (honeypot) {
    log(requestId, "honeypot");
    return reply(true, 200);
  }

  // 9. Turnstile (B2), sempre antes de qualquer contacto com o Resend.
  const verification = await verifyTurnstileToken({
    secret: config.turnstileSecretKey,
    token: turnstileToken,
    expectedAction: TURNSTILE_ACTION,
    expectedHostname: config.mode === "send" ? config.expectedHostname : undefined,
  });
  if (!verification.ok) {
    if (verification.kind === "unavailable") {
      log(requestId, "turnstile_unavailable", verification.errorCodes.join(","));
      return reply(false, 503);
    }
    log(requestId, "turnstile_rejected", verification.errorCodes.join(","));
    return reply(false, 403);
  }

  // 10. Entrega.
  if (config.mode === "dry-run") {
    // Nunca importa nem instancia o Resend.
    log(requestId, "dry_run");
    return reply(true, 200, { "X-Contact-Delivery": "dry-run" });
  }

  const lines = [
    EMAIL_WARNING,
    "",
    `Nome: ${name}`,
    `Email: ${email}`,
    phone ? `Telefone: ${phone}` : null,
    `Assunto: ${subject}`,
    "",
    message,
  ].filter((line): line is string => line !== null);

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(config.resendApiKey);
    const { error } = await resend.emails.send({
      from: config.fromEmail,
      to: config.recipient,
      replyTo: email,
      subject: `[Formulário do site] ${subject}`,
      text: lines.join("\n"),
    });

    if (error) {
      // Nunca `error.message`: texto livre do fornecedor, pode repetir endereços.
      log(requestId, "send_failed", `${error.name} ${error.statusCode ?? "-"}`);
      return reply(false, 502);
    }
  } catch (err) {
    log(requestId, "send_failed", `${err instanceof Error ? err.name : "unknown"} -`);
    return reply(false, 502);
  }

  log(requestId, "sent");
  return reply(true, 200);
}
