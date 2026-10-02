import type { MetadataRoute } from "next";
import { meta } from "@/content";

/**
 * `robots.txt` gerado no build (Fase 4, AC-14). Permite tudo exceto o admin
 * do CMS (`/admin`, TinaCMS a partir da task-017), as rotas de
 * pré-visualização do editor e as rotas de API — preparação de indexação,
 * não controlo de acesso (esse vive no servidor: Draft Mode nas rotas de
 * pré-visualização, task-017 architecture.md 5.2/5.3).
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
