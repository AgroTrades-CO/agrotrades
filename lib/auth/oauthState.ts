/**
 * Constantes partilhadas entre app/api/auth/route.ts e
 * app/api/auth/callback/route.ts. Ficam num módulo à parte (em vez de
 * exportadas a partir de um dos route handlers) porque ficheiros
 * `route.ts` do App Router só podem exportar os métodos HTTP e as opções de
 * segmento — qualquer outro export nomeado é rejeitado no build.
 */

export const OAUTH_STATE_COOKIE = "agrotrades_oauth_state";
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60; // <= 10 min, restrição 31
export const OAUTH_CALLBACK_PATH = "/api/auth/callback";

export const SESSION_COOKIE = "agrotrades_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60; // <= 60 min absoluto, sem renovação, restrição 30
