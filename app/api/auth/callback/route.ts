import { NextRequest, NextResponse } from "next/server";
import { readOAuthConfig } from "@/lib/auth/env";
import { constantTimeEqual } from "@/lib/auth/constantTimeEqual";
import { renderAuthErrorHtml, renderAuthSuccessHtml } from "@/lib/auth/popupMessage";
import { createSessionToken } from "@/lib/auth/session";
import {
  OAUTH_CALLBACK_PATH,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/oauthState";

/**
 * `/api/auth/callback` — segundo salto do fluxo OAuth (Fase 5). O GitHub
 * navega o popup até aqui com `?code=...&state=...` depois do utilizador
 * autorizar (ou recusar) a aplicação.
 *
 * Ordem de operações deliberada (restrição vinculativa 31): o cookie de
 * `state` é lido e IMEDIATAMENTE apagado, antes de qualquer validação —
 * uso único, sempre, mesmo quando a validação falha a seguir. Só depois é
 * que comparamos o valor (em tempo constante) com o parâmetro `state` da
 * query string.
 *
 * Toda a saída de erro passa pela MESMA função (`finish` + `renderAuthErrorHtml`)
 * e devolve sempre o mesmo tipo de resposta — nunca distingue, na resposta
 * ao cliente, se falhou o `state`, o `code`, a troca de token ou a chamada a
 * `GET /user` ("callback como oráculo", restrição da arquitetura).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GithubTokenResponse {
  access_token?: string;
  error?: string;
}

interface GithubUserResponse {
  id?: number;
}

export async function GET(request: NextRequest) {
  const config = readOAuthConfig();
  const allowedOrigin = config?.allowedOrigin ?? null;

  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? null;
  const queryState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");

  // SEC-P5-02: Secure derivado da CONFIGURAÇÃO, não do protocolo do pedido
  // (ver o mesmo comentário, mais detalhado, em app/api/auth/route.ts). Se
  // `config` for `null` (variáveis em falta/inválidas), não há origem de
  // confiança nenhuma disponível — assume-se o caso mais restritivo
  // (`secure: true`) em vez de confiar num valor do pedido.
  const cookiesSecure = allowedOrigin ? allowedOrigin.startsWith("https:") : true;

  function finish(html: string, status: number): NextResponse {
    const response = new NextResponse(html, {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
    // SEC-P5-01: nenhuma resposta desta rota pode ser guardada por caches
    // partilhadas — o caminho de sucesso transporta o token do GitHub no
    // corpo, e todos os caminhos de erro emitem/apagam o cookie de state.
    response.headers.set("Cache-Control", "no-store");
    // Uso único: o cookie de state é sempre apagado aqui, em TODAS as
    // saídas desta rota — sucesso ou erro (restrição 31).
    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: cookiesSecure,
      sameSite: "lax",
      path: OAUTH_CALLBACK_PATH,
      maxAge: 0,
    });
    return response;
  }

  if (!config) {
    // readOAuthConfig() já registou o motivo exato nos logs do servidor.
    return finish(renderAuthErrorHtml(allowedOrigin), 500);
  }

  if (!cookieState || !queryState || !constantTimeEqual(cookieState, queryState)) {
    return finish(renderAuthErrorHtml(allowedOrigin), 400);
  }

  if (!code) {
    return finish(renderAuthErrorHtml(allowedOrigin), 400);
  }

  const redirectUri = `${config.allowedOrigin}${OAUTH_CALLBACK_PATH}`;

  let accessToken: string;
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return finish(renderAuthErrorHtml(allowedOrigin), 400);
    }

    const tokenJson = (await tokenResponse.json()) as GithubTokenResponse;
    if (!tokenJson.access_token) {
      // Nunca registar tokenJson.error em bruto nem o code — restrição 38.
      console.error("[api/auth/callback] GitHub não devolveu access_token.");
      return finish(renderAuthErrorHtml(allowedOrigin), 400);
    }
    accessToken = tokenJson.access_token;
  } catch (error) {
    console.error("[api/auth/callback] Falha ao trocar o code por um token.", error);
    return finish(renderAuthErrorHtml(allowedOrigin), 502);
  }

  // Identidade obtida SEMPRE via GET /user no servidor, com o token
  // acabado de trocar — nunca de um valor vindo do cliente (AMB-08/7A.3).
  let githubUserId: number;
  try {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "agrotrades-decap-oauth-proxy",
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return finish(renderAuthErrorHtml(allowedOrigin), 400);
    }

    const userJson = (await userResponse.json()) as GithubUserResponse;
    if (typeof userJson.id !== "number") {
      return finish(renderAuthErrorHtml(allowedOrigin), 400);
    }
    githubUserId = userJson.id;
  } catch (error) {
    console.error("[api/auth/callback] Falha ao obter GET /user.", error);
    return finish(renderAuthErrorHtml(allowedOrigin), 502);
  }

  const sessionToken = createSessionToken(
    { id: githubUserId },
    config.sessionSecret,
    SESSION_MAX_AGE_SECONDS
  );

  const response = finish(renderAuthSuccessHtml(config.allowedOrigin, accessToken), 200);
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    // SEC-P5-02: idem — derivado de config.allowedOrigin, não do pedido.
    // Neste ponto `config` já não é `null` (retornou mais acima se fosse).
    secure: config.allowedOrigin.startsWith("https:"),
    sameSite: "strict", // restrição 30/31 — distinto do cookie de state (Lax)
    // SEC-P5-04: Path=/admin não cobre /api/admin/* que a Fase 6 prevê
    // (arquitetura 7A.5). Decisão deliberada a tomar NA Fase 6, não a meio
    // dela: alargar Path para "/", usar um Path próprio para as novas
    // rotas, ou mover essas rotas para debaixo de /admin/api/. Hoje é
    // inofensivo — nenhuma rota lê este cookie ainda.
    path: "/admin", // restrito à área administrativa (7A.3)
    maxAge: SESSION_MAX_AGE_SECONDS, // TTL absoluto, sem renovação deslizante
  });
  return response;
}
