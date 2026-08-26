/**
 * Gera a página HTML mínima que o popup de callback devolve ao browser,
 * implementando o "handshake" de duas mensagens que o Decap CMS espera do
 * backend `github` (protocolo confirmado por inspeção do bundle
 * `decap-cms.js`, classe `GitHub`/`ImplicitAuthenticator`):
 *
 *   1. popup -> opener: "authorizing:github"
 *   2. opener ecoa a mesma mensagem de volta ao popup (só se
 *      `event.origin === base_url`, que é este mesmo `targetOrigin`)
 *   3. popup, ao receber a mensagem 2, confirma a origem e responde com a
 *      mensagem final: "authorization:github:success:<json>" (ou "...error:<json>")
 *
 * Restrições vinculativas aplicadas aqui:
 * - `targetOrigin` SEMPRE explícito e literal (a origem configurada em
 *   OAUTH_ALLOWED_ORIGIN), NUNCA `'*'`, nunca derivado de
 *   `location`/`referrer`/query string do próprio pedido (restrição 4/9.3).
 * - O recetor (a mensagem 2, vinda do opener) só é aceite se
 *   `event.origin` bater exatamente com essa mesma origem literal — nunca
 *   confiado às cegas.
 * - O corpo é gerado por esta ÚNICA função, para sucesso e para erro — o
 *   "mesmo caminho de código" evita diferenças subtis entre os dois casos
 *   que pudessem servir de oráculo.
 */

function escapeForInlineScript(json: string): string {
  // Neutraliza qualquer sequência "</" para que um valor nunca possa fechar
  // a tag <script> prematuramente (defesa em profundidade — o token do
  // GitHub e o ID numérico não deveriam conter isto, mas não confiamos nisso).
  return json.replace(/</g, "\\u003c");
}

function renderPopupHtml(targetOrigin: string, finalMessage: string): string {
  const targetOriginJson = escapeForInlineScript(JSON.stringify(targetOrigin));
  const finalMessageJson = escapeForInlineScript(JSON.stringify(finalMessage));

  return `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8" /><title>AGRO TRADES — Autenticação</title><meta name="robots" content="noindex, nofollow" /></head>
<body>
<script>
(function () {
  "use strict";
  var TARGET_ORIGIN = ${targetOriginJson};
  var FINAL_MESSAGE = ${finalMessageJson};

  function sendFinal() {
    if (window.opener) {
      window.opener.postMessage(FINAL_MESSAGE, TARGET_ORIGIN);
    }
    window.close();
  }

  function onHandshakeEcho(event) {
    if (event.origin !== TARGET_ORIGIN) return;
    window.removeEventListener("message", onHandshakeEcho);
    sendFinal();
  }

  if (window.opener) {
    window.addEventListener("message", onHandshakeEcho);
    window.opener.postMessage("authorizing:github", TARGET_ORIGIN);
  } else {
    // Não há opener (ex.: alguém abriu o callback diretamente, fora do
    // fluxo popup do Decap) — nada a fazer, sem informação a revelar.
  }
})();
</script>
</body>
</html>`;
}

export function renderAuthSuccessHtml(targetOrigin: string, accessToken: string): string {
  const finalMessage =
    "authorization:github:success:" + JSON.stringify({ token: accessToken, provider: "github" });
  return renderPopupHtml(targetOrigin, finalMessage);
}

/**
 * Página de erro GENÉRICA (restrição vinculativa: o callback nunca distingue
 * se falhou o `state`, o código ou a permissão — "callback como oráculo").
 * `targetOrigin` pode ser `null` quando a própria configuração do servidor
 * está incompleta (nesse caso não sabemos sequer a origem correta) — nesse
 * caso a página não tenta fazer `postMessage`, só fecha/mostra um erro plano.
 */
export function renderAuthErrorHtml(targetOrigin: string | null): string {
  if (!targetOrigin) {
    return `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8" /><title>AGRO TRADES — Autenticação</title><meta name="robots" content="noindex, nofollow" /></head>
<body>Erro de autenticação.</body>
</html>`;
  }
  const finalMessage =
    "authorization:github:error:" + JSON.stringify({ message: "Erro de autenticação." });
  return renderPopupHtml(targetOrigin, finalMessage);
}
