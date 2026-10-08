import type { MetadataRoute } from "next";
import { meta } from "@/content";

/**
 * `robots.txt` gerado no build. Permite tudo exceto o admin
 * do CMS (`/admin`, TinaCMS), as rotas de
 * pré-visualização do editor e as rotas de API — preparação de indexação,
 * não controlo de acesso (esse vive no servidor: Draft Mode nas rotas de
 * pré-visualização).
 *
 * Não muda com `SITE_INDEXING` (next.config.mjs), de propósito: quem bloqueia
 * a indexação é o `X-Robots-Tag: noindex, nofollow`, e para o motor de busca
 * o ler tem de poder rastrear as páginas. Um `Disallow: /` faria o contrário
 * do pretendido — o URL continuaria elegível para aparecer nas pesquisas, sem
 * descrição, bastando estar referido noutro sítio.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/editor-preview", "/en/editor-preview", "/api/"],
      },
    ],
    sitemap: `${meta.siteUrl}/sitemap.xml`,
  };
}
