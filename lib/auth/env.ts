/**
 * Configuração de servidor do proxy OAuth (Fase 5). Lida só aqui, nunca
 * duplicada — se faltar alguma variável, `readOAuthConfig()` devolve `null`
 * e as rotas respondem com um erro genérico (nunca dizem QUAL variável
 * falta na resposta ao cliente — isso é só para os logs do servidor).
 *
 * Restrição vinculativa 1 da arquitetura: estes valores vivem APENAS em
 * variáveis de ambiente do servidor. Nunca em `NEXT_PUBLIC_`, nunca em
 * `public/admin/config.yml`, nunca no repositório.
 */

export interface OAuthConfig {
  githubClientId: string;
  githubClientSecret: string;
  sessionSecret: string;
  /**
   * Origem única e fixa deste deployment (ex.: "https://agrotrades.co.mz"),
   * usada para: (a) construir o `redirect_uri` enviado ao GitHub — nunca
   * construído a partir do pedido (restrição 3/9.2); (b) `targetOrigin`
   * explícito e literal do `postMessage` de volta ao Decap — nunca `'*'`
   * (restrição 4/9.3); (c) tem de bater certo com `backend.base_url` em
   * public/admin/config.yml (ver comentário nesse ficheiro).
   *
   * SEM protocolo relativo, sem barra final. Validado no arranque de cada
   * pedido (ver `readOAuthConfig`).
   */
  allowedOrigin: string;
}

function isValidOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.origin !== value) return false; // rejeita qualquer path/query/hash acrescentado por engano
    if (url.pathname !== "/") return false; // URL() normaliza pathname vazio para "/", mas origin já exclui isso — dupla verificação barata

    if (url.protocol === "https:") return true;

    // SEC-P5-02: http só é aceitável para desenvolvimento local. Aceitar
    // qualquer http (ex.: um OAUTH_ALLOWED_ORIGIN de produção mal
    // configurado em texto claro) passaria a validação sem qualquer aviso
    // — e o atributo `Secure` dos cookies, derivado desta origem, ficaria
    // silenciosamente desligado. Só localhost/127.0.0.1 têm essa isenção.
    if (url.protocol === "http:") {
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Lê e valida a configuração do servidor. Devolve `null` se algo estiver em
 * falta ou malformado — as rotas tratam isso como erro genérico 500, nunca
 * revelam ao cliente qual variável falta.
 */
export function readOAuthConfig(): OAuthConfig | null {
  const githubClientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  const allowedOrigin = process.env.OAUTH_ALLOWED_ORIGIN;

  if (!githubClientId || !githubClientSecret || !sessionSecret || !allowedOrigin) {
    console.error(
      "[lib/auth/env] Configuração do proxy OAuth incompleta — confirme GITHUB_OAUTH_CLIENT_ID, " +
        "GITHUB_OAUTH_CLIENT_SECRET, SESSION_SECRET e OAUTH_ALLOWED_ORIGIN " +
        "(ver handoff-38-developer-fase5.md, secção \"VARIÁVEIS DE AMBIENTE NECESSÁRIAS\")."
    );
    return null;
  }

  if (!isValidOrigin(allowedOrigin)) {
    console.error(
      `[lib/auth/env] OAUTH_ALLOWED_ORIGIN inválido: tem de ser uma origem absoluta sem barra final (ex.: "https://agrotrades.co.mz").`
    );
    return null;
  }

  if (sessionSecret.length < 32) {
    console.error("[lib/auth/env] SESSION_SECRET demasiado curto — use pelo menos 32 caracteres aleatórios.");
    return null;
  }

  return { githubClientId, githubClientSecret, sessionSecret, allowedOrigin };
}
