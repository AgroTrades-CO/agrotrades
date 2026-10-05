/**
 * Configuração da TinaCMS.
 *
 * Em Production o build gera o admin ligado à Tina Cloud
 * (scripts/tina-build.mjs), com o TINA_PUBLIC_CLIENT_ID; sem pré-visualização.
 *
 * MODO LOCAL: `npm run tina:dev` (scripts/tina-dev.mjs) corre
 * `tinacms dev`, que serve a API GraphQL local e lê/grava diretamente os
 * ficheiros JSON de content/ no disco — sem Tina Cloud, sem login, sem
 * credenciais. O build do site (`npm run build`) não corre a Tina
 * (scripts/tina-build.mjs).
 *
 * Segurança:
 *   - `token` NUNCA é o token real: tudo o que este ficheiro importa vai para
 *     o JS do admin (browser) e a CLI escreve o token literalmente no cliente
 *     gerado. A CLI exige um valor para construir o admin, por isso fica um
 *     marcador público sem valor. O admin autentica cada editor pelo login
 *     da Tina Cloud; o token de leitura real só é lido no servidor
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
  // Ramo constante: a Tina Cloud lê e grava só
  // o ramo `content`. Ignorado em modo local.
  branch: "content",
  // Ignorado em modo local; em produção vem das variáveis de Production.
  clientId: process.env.TINA_PUBLIC_CLIENT_ID ?? null,
  // Marcador exigido pela CLI (ver comentário acima); não é um segredo.
  token: "not-a-secret-placeholder",
  build: {
    // Admin em /admin, gerado no build e fora do Git (.gitignore).
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      publicFolder: "public",
      // Só a pasta protegida (media-guard, CSP sandbox, exceção do CODEOWNERS):
      // o gestor de media não vê nem grava fora dela.
      mediaRoot: "images/uploads",
    },
    // Só raster, os mesmos formatos que o media-guard aceita.
    accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
  },
  telemetry: "disabled",
  ui: { optOutOfUpdateCheck: true },
  schema: { collections },
});
