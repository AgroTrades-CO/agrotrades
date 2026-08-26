import type { MetadataRoute } from "next";
import { meta } from "@/content";

/**
 * `robots.txt` gerado no build (Fase 4, AC-14). Permite tudo exceto uma
 * futura `/admin` (Fase 5, Decap CMS) — preparação de indexação, não
 * controlo de acesso (esse vive no servidor, arquitetura secção 9.6). A
 * rota ainda não existe nesta fase; a entrada fica pronta com antecedência
 * por decisão explícita da tarefa.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin"],
      },
    ],
    sitemap: `${meta.siteUrl}/sitemap.xml`,
  };
}
