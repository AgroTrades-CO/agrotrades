/**
 * Formatos, limites e destino do media do CMS.
 *
 * ZERO DEPENDÊNCIAS, de propósito: este ficheiro é importado dos dois lados da
 * fronteira — pelo admin da Tina (vai para o bundle do browser, via
 * tina/config.tsx e tina/media-store.ts) e pelo servidor (lib/cloudinary/,
 * app/api/cms-media/). Não acrescentar imports nem ler variáveis de ambiente
 * aqui. Mesmo papel que tina/branch.ts.
 */

/**
 * Formatos que o editor pode carregar: só raster, os mesmos que o
 * `media-guard` aceita em public/images/uploads/.
 *
 * Na Cloudinary esta lista não é só conforto do editor: vai ASSINADA no
 * parâmetro `allowed_formats` do upload e é a Cloudinary que recusa o resto,
 * SVG incluído. O browser não a pode alterar sem invalidar a assinatura.
 */
export const RASTER_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const;

/** `accept` do input de ficheiros (MIME), equivalente à lista acima. */
export const RASTER_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/**
 * Mesmo limite do `media-guard`: 5.000.000 bytes.
 *
 * É CONFORTO, não controlo: o upload vai do browser direto para a Cloudinary,
 * por isso quem fizer o pedido à mão fica limitado apenas pelo limite do plano
 * da Cloudinary (10 MB por imagem no plano gratuito). O que o servidor controla
 * de facto é o formato (`allowed_formats`), a pasta e a tag — vão assinados.
 */
export const MAX_UPLOAD_BYTES = 5_000_000;

/** Pasta na Cloudinary. Só arruma a consola; a identificação é pela tag. */
export const CLOUDINARY_FOLDER = "agrotrades";

/**
 * Tag posta em cada upload do CMS. É por ela que o media é LISTADO e é ela
 * que autoriza um apagar.
 *
 * Porque não a pasta: listar por prefixo depende de a pasta aparecer no
 * `public_id`, o que só acontece nas contas em modo "fixed folders". Com
 * "dynamic folders" a pasta vive num campo à parte e o prefixo não encontra
 * nada. A listagem por tag (`/resources/image/tags/<tag>`) funciona nos dois
 * modos.
 *
 * A conta deste projeto está em "dynamic folders": a resposta de um upload
 * traz `folder: null` e `asset_folder: "agrotrades"`. Não mudar a listagem
 * para prefixo sem confirmar isso primeiro.
 */
export const CLOUDINARY_TAG = "agrotrades-cms";
