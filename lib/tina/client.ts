import "server-only";
import { createClient } from "tinacms/dist/client";
import { queries } from "@/tina/__generated__/types";

/**
 * Cliente de leitura da TinaCMS para as rotas de pré-visualização
 * (/editor-preview, /en/editor-preview) — task-017, architecture.md secção 3.
 *
 * Só servidor (`server-only`): na fase 4 este módulo lê o token de leitura da
 * Tina Cloud, que nunca pode ir para o browser (SEC-T-07 (2)). Não usa o
 * cliente gerado em tina/__generated__/client.ts (fora do Git: a CLI escreve lá
 * o token literalmente); usa só as queries geradas (types.ts, versionado).
 *
 * Fase 3: só MODO LOCAL — a API GraphQL do `tinacms dev` (npm run tina:dev),
 * que lê os ficheiros de content/ no disco. Fora de `next dev` lança erro: as
 * rotas de pré-visualização já dão 404 antes de chegarem aqui (sem Draft Mode),
 * e a leitura da Tina Cloud (ramo `content`, TINA_PUBLIC_CLIENT_ID/TINA_TOKEN)
 * é da fase 4.
 */
export function getTinaClient() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "Cliente da TinaCMS não configurado: na fase 3 só existe o modo local (npm run tina:dev)."
    );
  }
  // Porta da API local; scripts/tina-dev.mjs passa o mesmo valor ao `tinacms dev`.
  const port = process.env.TINA_LOCAL_PORT ?? "4001";
  if (!/^[0-9]{2,5}$/.test(port)) {
    throw new Error("TINA_LOCAL_PORT inválida: tem de ser um número de porta.");
  }
  return createClient({ url: `http://localhost:${port}/graphql`, queries });
}
