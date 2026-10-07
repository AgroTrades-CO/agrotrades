import { z } from "zod";
import { TURNSTILE_SITEVERIFY_URL, looksLikeTurnstileTestSecret } from "@/lib/contact/constants";

/**
 * Verificação servidor-a-servidor do token Cloudflare Turnstile. Falha
 * fechada: só `success === true` (e, com
 * secret real, `hostname` e `action` corretos) conta como aceite.
 *
 * - Timeout de 5 s, sem novas tentativas.
 * - Sem `remoteip`: não se envia o IP do visitante à Cloudflare.
 * - A secret nunca é registada nem incluída em mensagens de erro.
 * - `errorCodes` só contém os códigos enumerados da Cloudflare (filtrados)
 *   ou marcadores locais; nunca dados pessoais. Nunca expostos ao cliente.
 *
 * Módulo só de servidor.
 */

export type TurnstileVerification =
  | { ok: true }
  | { ok: false; kind: "rejected" | "unavailable"; errorCodes: string[] };

const SITEVERIFY_TIMEOUT_MS = 5000;

const siteverifyResponseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

function sanitizeErrorCodes(codes: string[] | undefined): string[] {
  return (codes ?? []).filter((code) => /^[a-z0-9-]{1,64}$/.test(code)).slice(0, 5);
}

/**
 * Códigos da Cloudflare causados pelo pedido do visitante (token em falta,
 * inválido, expirado ou reutilizado): 403. Tudo o resto (secret inválida,
 * `internal-error`, códigos desconhecidos) é problema de configuração ou do
 * serviço: 503.
 */
const VISITOR_ERROR_CODES = new Set(["missing-input-response", "invalid-input-response", "timeout-or-duplicate"]);

function unavailable(errorCodes: string[]): TurnstileVerification {
  return { ok: false, kind: "unavailable", errorCodes };
}

function rejected(errorCodes: string[]): TurnstileVerification {
  return { ok: false, kind: "rejected", errorCodes };
}

export async function verifyTurnstileToken({
  secret,
  token,
  expectedAction,
  expectedHostname,
}: {
  secret: string;
  token: string;
  expectedAction: string;
  expectedHostname?: string;
}): Promise<TurnstileVerification> {
  let data: unknown;
  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      // Em 4xx a Cloudflare inclui `error-codes` no corpo (ex.: HTTP 400 com
      // `invalid-input-secret`). Regista-os para diagnóstico; o resultado
      // continua a ser recusa (fail-closed), nunca aceite.
      const httpCode = `http-${response.status}`;
      const body: unknown = await response.json().catch(() => null);
      const bodyParsed = siteverifyResponseSchema.partial().safeParse(body);
      const codes = bodyParsed.success ? sanitizeErrorCodes(bodyParsed.data["error-codes"]) : [];
      const visitorCaused = codes.length > 0 && codes.every((code) => VISITOR_ERROR_CODES.has(code));
      return visitorCaused ? rejected([httpCode, ...codes]) : unavailable([httpCode, ...codes]);
    }
    data = await response.json();
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return unavailable([timedOut ? "local-timeout" : "local-fetch-failed"]);
  }

  const parsed = siteverifyResponseSchema.safeParse(data);
  if (!parsed.success) return unavailable(["local-invalid-response"]);

  const errorCodes = sanitizeErrorCodes(parsed.data["error-codes"]);

  if (!parsed.data.success) {
    // `internal-error` é falha do lado da Cloudflare, não do visitante.
    return errorCodes.includes("internal-error") ? unavailable(errorCodes) : rejected(errorCodes);
  }

  // Com as secrets de teste, a Cloudflare devolve `hostname: "example.com"`
  // (confirmado em 2026-09-26) e não devolve `action`: por isso só se
  // verificam com uma secret real.
  if (!looksLikeTurnstileTestSecret(secret)) {
    if (!expectedHostname || parsed.data.hostname !== expectedHostname) {
      return rejected(["local-hostname-mismatch"]);
    }
    if (parsed.data.action !== expectedAction) {
      return rejected(["local-action-mismatch"]);
    }
  }

  return { ok: true };
}
