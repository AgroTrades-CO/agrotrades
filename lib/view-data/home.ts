import "server-only";
import {
  about,
  campanha,
  contacts,
  hero,
  homeAbout,
  locationsHeading,
  servicesHeading,
  services,
  visibleAboutTags,
  visibleHeroSlides,
  visibleLocations,
  visibleStats,
  type Lang,
} from "@/content";
import { path } from "@/content/routes";
import type { HomeViewData } from "@/components/pages/HomeView";
import { toServiceCardData } from "./service";

/**
 * Construtor dos dados da vista da homepage (task-017, A-12;
 * architecture.md 18.1.2). Só servidor (`server-only`): lê @/content e
 * devolve JSON simples para `HomeView`.
 */

// Mesma seleção e ordem de serviços do preview da homepage original (index.html):
// arroz, cereais, mecanização, moageira.
const PREVIEW_SERVICE_IDS = ["arroz", "cereais", "mecanizacao", "moageira"] as const;

export function getHomeViewData(lang: Lang): HomeViewData {
  // Resolve o override homeTitle/homeBlurb ANTES de entrar no cartão
  // (design-spec-fase3 secção 3, opção (a) — o cartão não conhece o
  // conceito "override da homepage").
  const serviceCards = PREVIEW_SERVICE_IDS.map((id) => {
    const service = services.find((s) => s.id === id);
    if (!service) {
      throw new Error(`Serviço "${id}" não encontrado em content/services — necessário para o preview da homepage.`);
    }
    return toServiceCardData(
      {
        ...service,
        title: service.homeTitle ?? service.title,
        summary: service.homeBlurb ?? service.summary,
      },
      lang
    );
  });

  return {
    hero,
    visibleHeroSlides,
    visibleStats,
    homeAbout,
    locationsHeading,
    about: { tag: about.tag, title: about.title, summary: about.summary },
    visibleAboutTags,
    whatsappUrl: contacts.whatsapp.url,
    servicesHeading,
    serviceCards,
    campanhaBanner: campanha.banner,
    campanhaQuoteAuthor: campanha.quote.author,
    visibleLocations,
    hrefs: { services: path("services", lang), about: path("about", lang), campaign: path("campaign", lang) },
  };
}
