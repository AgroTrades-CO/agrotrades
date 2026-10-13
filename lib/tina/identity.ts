import "server-only";

/**
 * Validação, no servidor, da sessão de um editor na Tina Cloud.
 *
 * PARA QUE SERVE: a entrada na pré-visualização liga o Draft Mode, que faz o
 * servidor devolver conteúdo por publicar e renderizar cada pedido em vez de
 * servir a página em cache. Não pode ser aberta a quem passar por lá. O único
 * login que existe neste projeto é o da Tina Cloud, no /admin, e é esse que
 * aqui se verifica.
 *
 * COMO: o admin guarda a sessão em `localStorage["tinacms-auth"]`
 * (`{id_token, access_token, refresh_token}`) e usa `id_token ?? access_token`
 * como bearer. O mesmo token é verificado contra
 * `GET https://identity.tinajs.io/v2/apps/<clientId>/currentUser`: uma resposta
 * 2xx significa sessão viva NESTE projeto. É a mesma chamada que o próprio
 * admin faz para saber se o editor continua autenticado
 * (node_modules/tinacms/dist/index.js, `getUser`).
 *
 * O que isto NÃO é: verificação de cabeçalhos. `sec-fetch-site` e companhia
 * são postos pelo browser, mas um pedido feito por script põe o que quiser.
 * Só o token serve de prova.
 *
 * O token nunca é registado, nem em erro. Sai daqui apenas para
 * identity.tinajs.io.
 */

const IDENTITY_ORIGIN = "https://identity.tinajs.io";

/** Formato dos client ids da Tina Cloud; impede sujidade no URL. */
const CLIENT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

/**
 * Forma de um JWT: três segmentos base64url. Não prova nada — a prova é a
 * resposta da Tina Cloud — mas evita uma chamada externa por cada pedido com
 * lixo no cabeçalho `Authorization`.
 */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{4,2048}\.[A-Za-z0-9_-]{4,4096}\.[A-Za-z0-9_-]{4,2048}$/;

/** A Tina Cloud pode estar lenta ou em baixo; a rota não fica à espera dela. */
const TIMEOUT_MS = 5000;

/**
 * `true` só quando a Tina Cloud confirma o token como sessão deste projeto.
 * Qualquer outra coisa — formato errado, 401, 500, timeout, rede em baixo — dá
 * `false`: falha fechada, sem entrada na pré-visualização.
 */
export async function tinaSessionIsValid(token: string): Promise<boolean> {
  const clientId = process.env.TINA_PUBLIC_CLIENT_ID?.trim();
  if (!clientId || !CLIENT_ID_PATTERN.test(clientId)) return false;
  if (!TOKEN_PATTERN.test(token)) return false;

  try {
    const response = await fetch(`${IDENTITY_ORIGIN}/v2/apps/${clientId}/currentUser`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}
