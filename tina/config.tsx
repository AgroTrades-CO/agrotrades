/**
 * Configuração da TinaCMS.
 *
 * Em Production o build gera o admin ligado à Tina Cloud
 * (scripts/tina-build.mjs), com o TINA_PUBLIC_CLIENT_ID.
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
import { CONTENT_BRANCH } from "./branch";
import { collections } from "./collections";
import { RASTER_ACCEPT } from "./media-formats";

/**
 * Onde fica o media.
 *
 * CLOUDINARY (produção): os uploads vão do browser direto para a Cloudinary
 * (tina/media-store.ts e app/api/cms-media/route.ts) e os campos de imagem
 * guardam o URL do CDN. Nada de imagens no repositório.
 *
 * FICHEIROS NO REPOSITÓRIO (modo local): o `tinacms dev` grava em
 * public/images/uploads/ no disco, sem rede e sem credenciais. É o que se quer
 * a trabalhar offline, e não gasta a quota da Cloudinary com testes.
 *
 * Para exercitar a Cloudinary em local — a única forma de testar a rota sem
 * fazer deploy — correr `npm run tina:dev` com TINA_PUBLIC_MEDIA=cloudinary e
 * as variáveis CLOUDINARY_* em .env.local. Tem de ser um nome TINA_PUBLIC_*:
 * a CLI da Tina só passa essas ao admin.
 *
 * NÃO É BUG: com `loadCustomStore` a Tina só registra os plugins dos campos
 * depois de o módulo da loja carregar, por isso num arranque frio o formulário
 * pode mostrar "Unrecognized field type" durante um instante. Resolve-se
 * sozinho quando o `import()` dinâmico termina. Com `media.tina` não acontece,
 * porque não há nada a carregar.
 */
const cloudinaryMedia =
  process.env.TINA_PUBLIC_MEDIA === "cloudinary" || process.env.NODE_ENV === "production";

export default defineConfig({
  // Ramo constante: a Tina Cloud lê e grava só o ramo `content`. Ignorado em
  // modo local. O mesmo valor serve a leitura em lib/tina/client.ts.
  branch: CONTENT_BRANCH,
  // Ignorado em modo local; em produção vem das variáveis de Production.
  clientId: process.env.TINA_PUBLIC_CLIENT_ID ?? null,
  // Marcador exigido pela CLI (ver comentário acima); não é um segredo.
  token: "not-a-secret-placeholder",
  build: {
    // Admin em /admin, gerado no build e fora do Git (.gitignore).
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: cloudinaryMedia
    ? {
        loadCustomStore: async () => (await import("./media-store")).CloudinaryMediaStore,
        // Só raster, os mesmos formatos que a autorização de upload assina.
        accept: RASTER_ACCEPT,
      }
    : {
        tina: {
          publicFolder: "public",
          // Só a pasta protegida (media-guard, CSP sandbox, exceção do
          // CODEOWNERS): o gestor de media não vê nem grava fora dela.
          mediaRoot: "images/uploads",
        },
        accept: RASTER_ACCEPT,
      },
  telemetry: "disabled",
  ui: { optOutOfUpdateCheck: true },
  schema: { collections },
});
