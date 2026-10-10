import "server-only";
import { nav, services, type Lang } from "@/content";
import { path, serviceDetailPath } from "@/content/routes";
import type { HeaderViewData } from "@/components/HeaderView";

/**
 * Dados do cabeçalho. Só servidor: lê @/content (com a validação Zod) e
 * devolve JSON simples para a vista. Um componente cliente que importe este
 * módulo faz o `next build` falhar (`server-only`).
 */
export function getHeaderViewData(lang: Lang): HeaderViewData {
  const after = [
    { href: path("products", lang), label: nav.products[lang], visible: nav.products.visible },
    { href: path("campaign", lang), label: nav.campaign[lang], visible: nav.campaign.visible },
    { href: path("contact", lang), label: nav.contact[lang], visible: nav.contact.visible },
    { href: path("about", lang), label: nav.about[lang], visible: nav.about.visible },
  ];

  return {
    homeHref: path("home", lang),
    home: nav.home.visible ? { href: path("home", lang), label: nav.home[lang] } : null,
    services: nav.services.visible
      ? {
          label: nav.services[lang],
          viewAllLabel: nav.servicesViewAll[lang],
          href: path("services", lang),
          // Ordem canónica do array `services` — tem significado editorial.
          items: services.map((service) => ({
            id: service.id,
            href: serviceDetailPath(service.id, lang),
            image: service.bannerImage,
            label: service.title[lang],
          })),
        }
      : null,
    links: after.filter((link) => link.visible).map(({ href, label }) => ({ href, label })),
  };
}
