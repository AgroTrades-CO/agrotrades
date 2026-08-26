import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readOAuthConfig } from "@/lib/auth/env";
import {
  OAUTH_CALLBACK_PATH,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/auth/oauthState";

/**
 * `/api/auth` — primeiro salto do fluxo OAuth do backend `github` do Decap
 * CMS (arquitetura secção 9/12, Fase 5). O Decap abre isto num popup como
 * `GET {base_url}/{auth_endpoint}?provider=github&site_id=...&scope=...`.
 *
 * Restrições vinculativas aplicadas:
 * - Scope SEMPRE `public_repo`, fixado aqui — nunca lido do pedido, mesmo
 *   que o Decap peça outro (restrição 6).
 * - `redirect_uri` enviado ao GitHub é construído a partir de
 *   `OAUTH_ALLOWED_ORIGIN` (variável de ambiente de servidor), NUNCA a
 *   partir de query string, header `Origin`/`Referer`, ou qualquer outro
 *   valor do pedido (restrição 3/9.2 — "não construídos a partir de
 *   valores do pedido").
 * - `state`: CSPRNG (`crypto.randomUUID`, >=128 bits), uso único, guardado
 *   num cookie PRÓPRIO e distinto do cookie de sessão: httpOnly, Secure,
 *   SameSite=Lax (tem de sobreviver à navegação de retorno vinda de
 *   github.com — Strict não seria enviado), Path restrito à rota de
 *   callback, TTL <=10 min (restrição 31/32).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function genericError(status: number): NextResponse {
  const response = new NextResponse("Erro de autenticação.", { status });
  // SEC-P5-01: nenhuma resposta desta rota pode ser guardada por caches
  // partilhadas — mesmo as de erro, por defeito e sem exceção.
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");
  if (provider !== "github") {
    // Único provider suportado. Sem detalhe adicional na resposta.
    return genericError(400);
  }

  const config = readOAuthConfig();
  if (!config) {
    // readOAuthConfig() já regista o motivo exato nos logs do servidor.
    return genericError(500);
  }

  const state = `${randomUUID()}${randomUUID()}`.replace(/-/g, ""); // CSPRNG, >=128 bits, restrição 32
  const redirectUri = `${config.allowedOrigin}${OAUTH_CALLBACK_PATH}`;

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", config.githubClientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "public_repo"); // restrição 6 — nunca "repo"
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("allow_signup", "false");

  const response = NextResponse.redirect(authorizeUrl, { status: 302 });
  // SEC-P5-01: esta resposta emite o cookie de state — nunca armazenável.
  response.headers.set("Cache-Control", "no-store");

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    // SEC-P5-02: Secure derivado da CONFIGURAÇÃO (OAUTH_ALLOWED_ORIGIN), não
    // do protocolo do pedido — `request.nextUrl.protocol` reflete
    // `X-Forwarded-Proto`, um valor que chega no pedido e que um atacante
    // pode influenciar dependendo de como o proxy à frente o trata. Em
    // desenvolvimento local, `OAUTH_ALLOWED_ORIGIN=http://localhost:...` faz
    // `secure` ser `false`, exatamente como antes; em produção/preview,
    // `isValidOrigin()` já exige https fora de localhost/127.0.0.1 (ver
    // lib/auth/env.ts), portanto isto nunca fica aberto em silêncio.
    secure: config.allowedOrigin.startsWith("https:"),
    sameSite: "lax", // restrição 31 — nunca Strict aqui (não sobreviveria ao retorno do GitHub)
    path: OAUTH_CALLBACK_PATH,
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });

  return response;
}
