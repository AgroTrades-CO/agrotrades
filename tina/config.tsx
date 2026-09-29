/**
 * TinaCMS — task-017-tina-cms-adoption (architecture.md secções 3, 4 e 8).
 *
 * Fase 3: só MODO LOCAL. `npm run tina:dev` (scripts/tina-dev.mjs) corre
 * `tinacms dev`, que serve a API GraphQL local e lê/grava diretamente os
 * ficheiros JSON de content/ no disco — sem Tina Cloud, sem login, sem
 * credenciais. O build do site (`npm run build`) não corre a Tina
 * (scripts/tina-build.mjs). A ligação à Tina Cloud é da fase 4.
 *
 * Segurança (security-review-design.md, SEC-T-07/SEC-T-12):
 *   - `token` NÃO é definido aqui: tudo o que este ficheiro importa vai para o
 *     JS do admin (browser) e a CLI escreve o token literalmente no cliente
 *     gerado. O token de leitura (fase 4) só é lido no servidor
 *     (lib/tina/client.ts).
 *   - O client id chama-se TINA_PUBLIC_CLIENT_ID: é público por construção
 *     (fica no JS do admin, injetado só pela CLI da Tina). Nunca NEXT_PUBLIC_*,
 *     que o Next injetaria no bundle do visitante.
 *   - Não importar nada de lib/, app/ nem ler outras variáveis de ambiente.
 *   - Telemetria e verificação de versões desligadas (sem pedidos a
 *     *.tinajs.io a partir do admin em modo local).
 */
import { defineConfig } from "tinacms";
import { collections } from "./collections";

export default defineConfig({
  // Ramo constante (architecture 4.3): a Tina Cloud (fase 4/5) lê e grava só
  // o ramo `content`. Ignorado em modo local.
  branch: "content",
  // Ignorado em modo local; na fase 4 vem das variáveis de Production.
  clientId: process.env.TINA_PUBLIC_CLIENT_ID ?? null,
  build: {
    // Admin em /admin (A-4), gerado no build e fora do Git (.gitignore).
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      publicFolder: "public",
      // Só a pasta protegida (media-guard, CSP sandbox, exceção do CODEOWNERS):
      // o gestor de media não vê nem grava fora dela (FR-4.1, SEC-T-03).
      mediaRoot: "images/uploads",
    },
    // Só raster, os mesmos formatos que o media-guard aceita (FR-4.3).
    accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
  },
  telemetry: "disabled",
  ui: { optOutOfUpdateCheck: true },
  schema: { collections },
});
