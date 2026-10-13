import "server-only";
import { createClient } from "tinacms/dist/client";
import { queries } from "@/tina/__generated__/types";
import { CONTENT_BRANCH } from "@/tina/branch";

/**
 * Cliente de leitura da TinaCMS para as rotas de pré-visualização
 * (/editor-preview, /en/editor-preview).
 *
 * Só servidor (`server-only`): em modo cloud este módulo lê o token da Tina
 * Cloud, que nunca pode ir para o browser. Não usa o cliente gerado em
 * tina/__generated__/client.ts (fora do Git: a CLI escreve lá o token
 * literalmente); usa só as queries geradas (types.ts, versionado).
 *
 * MODO LOCAL (`next dev`): a API GraphQL do `tinacms dev` (npm run tina:dev),
 * que lê os ficheiros de content/ no disco. Sem token.
 *
 * MODO CLOUD (tudo o resto): a API da Tina Cloud, no ramo `content` — o mesmo
 * que o admin grava. Mostra o que está por publicar, que é o objetivo da
 * pré-visualização: o `main` já se vê no site.
 *
 * As rotas que chamam isto exigem Draft Mode e dão 404 sem ele, por isso nada
 * disto corre num pedido público nem durante o `next build`.
 */

/**
 * Segmento de versão da API de conteúdo, no formato `major.minor`.
 *
 * A CLI da Tina constrói o URL a partir de `version` em
 * tina/__generated__/_schema.json, que NÃO está no Git (é gerado no build).
 * Aqui fica em constante para não depender de um ficheiro gerado em tempo de
 * execução. Ao actualizar o `tinacms`, confirmar `version.major`/`version.minor`
 * nesse ficheiro e corrigir aqui se mudarem.
 */
const CONTENT_API_VERSION = "3.0";

/** Aceita o formato dos client ids da Tina Cloud; impede sujidade no URL. */
const CLIENT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

function localClient() {
  // Porta da API local; scripts/tina-dev.mjs passa o mesmo valor ao `tinacms dev`.
  const port = process.env.TINA_LOCAL_PORT ?? "4001";
  if (!/^[0-9]{2,5}$/.test(port)) {
    throw new Error("TINA_LOCAL_PORT inválida: tem de ser um número de porta.");
  }
  return createClient({ url: `http://localhost:${port}/graphql`, queries });
}

function cloudClient() {
  const clientId = process.env.TINA_PUBLIC_CLIENT_ID?.trim();
  const token = process.env.TINA_TOKEN?.trim();
  // Mensagens sem valores: o que falta, nunca o que lá está.
  if (!clientId) {
    throw new Error("TINA_PUBLIC_CLIENT_ID em falta: a pré-visualização não pode ler a Tina Cloud.");
  }
  if (!CLIENT_ID_PATTERN.test(clientId)) {
    throw new Error("TINA_PUBLIC_CLIENT_ID com formato inesperado.");
  }
  if (!token) {
    throw new Error("TINA_TOKEN em falta: a pré-visualização não pode ler a Tina Cloud.");
  }
  return createClient({
    url: `https://content.tinajs.io/${CONTENT_API_VERSION}/content/${clientId}/github/${CONTENT_BRANCH}`,
    token,
    queries,
  });
}

export function getTinaClient() {
  return process.env.NODE_ENV === "development" ? localClient() : cloudClient();
}
