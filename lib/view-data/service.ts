import "server-only";
import { contacts, relatedServices, servicePage, servicesHeading, type Lang, type Service } from "@/content";
import { path, serviceDetailPath } from "@/content/routes";
import type { ServiceCardData } from "@/components/ServiceCardView";
import type { ServiceDetailViewData } from "@/components/pages/ServiceDetailView";

/**
 * Construtores dos dados das vistas de serviço (task-017, A-12;
 * architecture.md 18.1.2). Só servidor: leem @/content (com a validação
 * Zod) e devolvem JSON simples para as vistas. Um componente cliente que
 * importe este módulo faz o `next build` falhar (`server-only`).
 */

/** Cartão de serviço já resolvido (endereço no idioma pedido). */
export function toServiceCardData(service: Service, lang: Lang): ServiceCardData {
  return {
    id: service.id,
    bannerImage: service.bannerImage,
    bannerImageAlt: service.bannerImageAlt,
    icon: service.icon,
    title: service.title,
    summary: service.summary,
    href: serviceDetailPath(service.id, lang),
  };
}

/** Tudo o que a página de detalhe mostra além do próprio serviço. */
export function getServiceDetailViewData(service: Service, lang: Lang): ServiceDetailViewData {
  return {
    service,
    page: servicePage,
    contact: {
      whatsappUrl: contacts.whatsapp.url,
      whatsappLabel: contacts.whatsapp.label,
      title: contacts.title,
    },
    related: servicePage.relatedVisible ? relatedServices(service.id).map((s) => toServiceCardData(s, lang)) : [],
    learnMore: servicesHeading.learnMore,
    hrefs: { services: path("services", lang), contact: path("contact", lang) },
  };
}
