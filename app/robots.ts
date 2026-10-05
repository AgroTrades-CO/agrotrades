import type { MetadataRoute } from "next";
import { meta } from "@/content";

/**
 * `robots.txt` gerado no build. Permite tudo exceto o admin
 * do CMS (`/admin`, TinaCMS), as rotas de
 * pré-visualização do editor e as rotas de API — preparação de indexação,
 * não controlo de acesso (esse vive no servidor: Draft Mode nas rotas de
 * pré-visualização).
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
