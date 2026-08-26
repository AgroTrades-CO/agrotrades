import { createHmac } from "node:crypto";
import { constantTimeEqual } from "./constantTimeEqual";

/**
 * Cookie de SESSÃO (distinto do cookie de `state` do OAuth — ver
 * lib/auth/oauthState.ts). Restrições vinculativas 30 da arquitetura:
 *
 * - TTL absoluto <= 60 min, sem renovação deslizante (calculado uma vez na
 *   emissão, nunca prolongado).
 * - HMAC-SHA256 com SESSION_SECRET dedicado (nunca o client_secret do OAuth).
 * - Algoritmo FIXADO no código (esta função), nunca lido do próprio token —
 *   evita a família de vulnerabilidades "alg:none"/confusão de algoritmo.
 * - Comparação da assinatura em tempo constante.
 * - Payload MÍNIMO: apenas o ID numérico do GitHub e a expiração. Nunca o
 *   token de acesso do GitHub, nunca username, nunca email (7A.3).
 *
 * Formato do cookie: "<payload base64url>.<assinatura base64url>", onde
 * `payload` é o JSON `{"id":<number>,"exp":<epoch seconds>}`.
 *
 * Nesta Fase (5) o cookie de sessão ainda não é lido por nenhuma rota
 * privilegiada (isso só existe na Fase 6, `/admin/users`) — é emitido aqui
 * porque a arquitetura (secção 7A.3, entregável da Fase 5) pede que a
 * infraestrutura de sessão já exista e esteja correta antes de haver
 * qualquer coisa que dependa dela. "Possuir sessão válida confere ZERO
 * autoridade" nesta fase — não há nenhuma rota que a consuma para decidir
 * fosse o que fosse.
 */

export interface SessionPayload {
  /** ID numérico do GitHub, obtido em `GET /user` no servidor (nunca do cliente). */
  id: number;
  /** Expiração absoluta, epoch seconds. */
  exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string): Buffer | null {
  try {
    return Buffer.from(input, "base64url");
  } catch {
    return null;
  }
}

function sign(payloadB64: string, secret: string): string {
  // Algoritmo fixado aqui, no código — nunca configurável, nunca lido do token.
  return base64UrlEncode(createHmac("sha256", secret).update(payloadB64).digest());
}

/** Cria um novo token de sessão assinado, válido por `maxAgeSeconds` a partir de agora. */
export function createSessionToken(
  data: { id: number },
  secret: string,
  maxAgeSeconds: number
): string {
  const payload: SessionPayload = {
    id: data.id,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signatureB64 = sign(payloadB64, secret);
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Valida um token de sessão: assinatura (tempo constante) e expiração.
 * Devolve o payload se válido, ou `null` — nunca lança, para que o chamador
 * trate "sessão inválida" e "sessão ausente" da mesma forma (sem oráculo).
 */
export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signatureB64] = parts;

  const expectedSignatureB64 = sign(payloadB64, secret);
  if (!constantTimeEqual(signatureB64, expectedSignatureB64)) return null;

  const rawPayload = base64UrlDecode(payloadB64);
  if (!rawPayload) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload.toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).id !== "number" ||
    typeof (parsed as Record<string, unknown>).exp !== "number"
  ) {
    return null;
  }

  const payload = parsed as SessionPayload;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return payload;
}
