/**
 * Constantes partilhadas do formulário de contacto (task-006,
 * architecture.md secção 10, ponto 14). Importadas pelo cliente
 * (components/ContactForm.tsx) e pelo servidor (app/api/contact/route.ts,
 * lib/contact/*). NUNCA colocar aqui segredos nem leituras de `process.env`:
 * este ficheiro acaba no bundle do browser.
 */

/**
 * Nome do campo honeypot (SEC-C-08). Sem semântica de preenchimento
 * automático: nomes como "empresa"/"company" são preenchidos pelos
 * gestores de autopreenchimento e descartavam mensagens reais.
 */
export const HONEYPOT_FIELD = "hp_k7q";

/** Ação do widget Turnstile, verificada no servidor quando a secret é real. */
export const TURNSTILE_ACTION = "contact-form";

/**
 * Script oficial da Cloudflare em renderização explícita. Tem de vir
 * deste URL exato: não pode ser copiado para `public/`, servido por CDN
 * intermédia nem guardado em cache (restrição R7).
 */
export const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Endpoint de verificação servidor-a-servidor. */
export const TURNSTILE_SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Limite do corpo do pedido em bytes (SEC-C-09), aplicado antes do parse. */
export const MAX_BODY_BYTES = 16384;

/** Comprimento máximo de um token Turnstile (documentação da Cloudflare). */
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

/**
 * Secrets de teste oficiais e públicas da Cloudflare
 * (developers.cloudflare.com/turnstile/troubleshooting/testing):
 * passa sempre / falha sempre / token já usado. Não são segredos.
 */
export const TURNSTILE_TEST_SECRET_KEYS: readonly string[] = [
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
];

/**
 * Site keys de teste oficiais: começam por `1x`/`2x`/`3x` seguidos de zeros
 * e dois caracteres finais (ex.: `1x00000000000000000000AA`). As chaves
 * reais começam por `0x`. O padrão é deliberadamente largo para que
 * qualquer chave de teste, mesmo uma que não esteja listada aqui, faça
 * falhar o build de produção (architecture.md 3.3).
 */
const TURNSTILE_TEST_KEY_PATTERN = /^[123]x0+[A-Z]{2}$/;

/** Exatamente uma das três secrets de teste oficiais (aceites em `dry-run`). */
export function isOfficialTurnstileTestSecret(secret: string): boolean {
  return TURNSTILE_TEST_SECRET_KEYS.includes(secret);
}

/**
 * Qualquer secret com aspeto de chave de teste (lista oficial ou mesmo
 * padrão). Usado para RECUSAR em `send`: largo de propósito.
 */
export function looksLikeTurnstileTestSecret(secret: string): boolean {
  return isOfficialTurnstileTestSecret(secret) || TURNSTILE_TEST_KEY_PATTERN.test(secret);
}

export function isTurnstileTestSiteKey(siteKey: string): boolean {
  return TURNSTILE_TEST_KEY_PATTERN.test(siteKey);
}
