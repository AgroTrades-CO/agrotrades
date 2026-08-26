import type { MetadataRoute } from "next";
import { meta, services } from "@/content";
import { PAGE_KEYS, path, serviceDetailPath } from "@/content/routes";

/**
 * `sitemap.xml` gerado no build (Fase 4, FR-14/AC-14) a partir das mesmas
 * fontes que geram as rotas — `content/routes.ts` (páginas fixas) e
 * `content/index.ts` `services` (8 serviços) — nunca uma lista de URLs
 * escrita à mão, para não divergir da estrutura real do site.
 *
 * Cada URL PT/EN inclui a sua contraparte via `alternates.languages`
 * (hreflang), coerente com `content/seo.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const addPair = (pathPt: string, pathEn: string) => {
    const absolutePt = `${meta.siteUrl}${pathPt}`;
    const absoluteEn = `${meta.siteUrl}${pathEn}`;
    const alternates = { languages: { pt: absolutePt, en: absoluteEn } };
    entries.push({ url: absolutePt, alternates });
    entries.push({ url: absoluteEn, alternates });
  };

  for (const page of PAGE_KEYS) {
    addPair(path(page, "pt"), path(page, "en"));
  }

  for (const service of services) {
    addPair(serviceDetailPath(service.id, "pt"), serviceDetailPath(service.id, "en"));
  }

  return entries;
}
