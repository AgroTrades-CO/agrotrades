/**
 * Routing i18n — Fase 3.
 *
 * PT vive na raiz, sem prefixo (`/`, `/servicos`, ...); EN vive sob `/en`
 * (`/en`, `/en/services`, ...), com slugs de serviço traduzidos
 * (`content/service-slugs.ts`). Ver architecture-proposal.md secção D-4.
 *
 * Todas as rotas do site devem ser construídas a partir daqui — nunca com
 * caminhos escritos à mão em componentes — para que o seletor de idioma
 * (`alternatePath`) e a navegação fiquem sempre coerentes entre si.
 */

import type { Lang } from "./index";
import { serviceEnSlug, serviceIdFromEnSlug } from "./service-slugs";

export type PageKey = "home" | "services" | "campaign" | "contact" | "about";

/**
 * Todas as páginas fixas do site (exclui as páginas de serviço, que são
 * dinâmicas — ver `content/index.ts` `services` e `serviceDetailPath`).
 * Usado por `app/sitemap.ts` para gerar as duas entradas por idioma sem
 * repetir esta lista à mão (Fase 4, AC-14).
 */
export const PAGE_KEYS: PageKey[] = ["home", "services", "campaign", "contact", "about"];

const PATHS: Record<PageKey, Record<Lang, string>> = {
  home: { pt: "/", en: "/en" },
  services: { pt: "/servicos", en: "/en/services" },
  campaign: { pt: "/campanha", en: "/en/campaign" },
  contact: { pt: "/contactos", en: "/en/contact" },
  about: { pt: "/quem-somos", en: "/en/about" },
};

/** Caminho de uma página fixa do site, no idioma pedido. */
export function path(page: PageKey, lang: Lang): string {
  return PATHS[page][lang];
}

/** Caminho da página de detalhe de um serviço, no idioma pedido. */
export function serviceDetailPath(id: string, lang: Lang): string {
  return lang === "pt" ? `/servicos/${id}` : `/en/services/${serviceEnSlug(id)}`;
}

/**
 * Dado o `pathname` atual (de `usePathname()`) e o idioma atual, devolve o
 * caminho equivalente no outro idioma, preservando a página — usado pelo
 * seletor de idioma do Header. Nunca troca client-side; é sempre navegação.
 *
 * Ex.: alternatePath("/servicos/arroz", "pt") -> "/en/services/rice".
 */
export function alternatePath(pathname: string, currentLang: Lang): string {
  if (currentLang === "pt") {
    if (pathname === "/") return path("home", "en");
    if (pathname === "/servicos") return path("services", "en");

    const serviceMatch = pathname.match(/^\/servicos\/([^/]+)\/?$/);
    if (serviceMatch) {
      try {
        return serviceDetailPath(serviceMatch[1], "en");
      } catch {
        return path("services", "en");
      }
    }

    if (pathname === "/campanha") return path("campaign", "en");
    if (pathname === "/contactos") return path("contact", "en");
    if (pathname === "/quem-somos") return path("about", "en");

    return path("home", "en");
  }

  // currentLang === "en"
  if (pathname === "/en" || pathname === "/en/") return path("home", "pt");
  if (pathname === "/en/services") return path("services", "pt");

  const enServiceMatch = pathname.match(/^\/en\/services\/([^/]+)\/?$/);
  if (enServiceMatch) {
    const id = serviceIdFromEnSlug(enServiceMatch[1]);
    return id ? `/servicos/${id}` : path("services", "pt");
  }

  if (pathname === "/en/campaign") return path("campaign", "pt");
  if (pathname === "/en/contact") return path("contact", "pt");
  if (pathname === "/en/about") return path("about", "pt");

  return path("home", "pt");
}
