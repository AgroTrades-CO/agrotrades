/**
 * Camada de conteúdo — Fase 2 da migração.
 *
 * Carrega os ficheiros JSON de `content/services` e `content/site`,
 * valida-os contra os schemas Zod de `content/schemas`, e exporta objetos
 * já tipados para os componentes consumirem. Só a versão PT é servida
 * nesta fase (i18n real é Fase 3), mas a estrutura de dados guarda sempre
 * `{ pt, en }`.
 *
 * A validação corre aqui, ao nível do módulo — isto é, na primeira vez que
 * qualquer componente importar algo deste ficheiro. Como o `app/layout.tsx`
 * (usado por todas as rotas) importa `Header`/`Footer`/`WhatsappFloat`, que
 * por sua vez importam este módulo, a validação corre sempre no build,
 * mesmo para coleções (como `team` ou `contacts`) ainda não renderizadas em
 * nenhuma página nesta fase. Se faltar `pt`/`en` num campo obrigatório, ou
 * faltar um serviço, o `next build` falha aqui com uma mensagem legível.
 */

import { z } from "zod";

import campanhaJson from "./site/campanha.json";
import contactsJson from "./site/contacts.json";
import footerJson from "./site/footer.json";
import homeJson from "./site/home.json";
import metaJson from "./site/meta.json";
import navJson from "./site/nav.json";
import notFoundJson from "./site/notFound.json";
import quemSomosJson from "./site/quemSomos.json";
import servicePageJson from "./site/servicePage.json";
import servicesPageJson from "./site/servicesPage.json";

import apoioTecnico from "./services/apoio-tecnico.json";
import arroz from "./services/arroz.json";
import campanhaService from "./services/campanha.json";
import cereais from "./services/cereais.json";
import comercializacao from "./services/comercializacao.json";
import mecanizacao from "./services/mecanizacao.json";
import moageira from "./services/moageira.json";
import terras from "./services/terras.json";

import {
  campanhaSchema,
  contactsSchema,
  footerSchema,
  homeSchema,
  metaSchema,
  navSchema,
  notFoundSchema,
  quemSomosSchema,
  resolveSectionLayout,
  servicePageSchema,
  servicesPageSchema,
  servicesSchema,
  youtubeEmbedUrl,
  type AboutPage,
  type BilingualString,
  type Service,
} from "./schemas";

/** Idioma servido pelo site — PT na raiz, EN sob /en (Fase 3, D-4). */
export type Lang = "pt" | "en";

/** Devolve o texto no idioma pedido. */
export function pick(field: BilingualString, lang: Lang): string {
  return field[lang];
}

function parseContent<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(raiz)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Conteúdo inválido em "${label}":\n${details}\n\n` +
        `Corrija o ficheiro JSON correspondente em content/ antes de repetir o build.`
    );
  }
  return result.data;
}

// Mantém a ordem historicamente usada no array SERVICES de js/main.js.
export const services = parseContent(
  servicesSchema,
  [arroz, cereais, moageira, terras, campanhaService, mecanizacao, apoioTecnico, comercializacao],
  "content/services/*.json"
);

export const nav = parseContent(navSchema, navJson, "content/site/nav.json");

// "Homepage" no admin — hero + stats + cabeçalho de localizações + parte
// exclusiva de "about" (2º parágrafo, CEO, "Saber mais").
const home = parseContent(homeSchema, homeJson, "content/site/home.json");
export const hero = home.hero;
export const stats = home.stats.items;
export const locationsHeading = home.locationsHeading;
/** Campos de "about" exclusivos da Homepage — usados só em HomeContent.tsx. */
export const homeAbout = home.about;

// "Quem Somos" no admin — junta about (campos partilhados com a Homepage) +
// aboutPage + team num só ficheiro. `about`/`aboutPage`/`team` mantêm a
// mesma forma de sempre para os componentes não precisarem de mudar.
const quemSomos = parseContent(quemSomosSchema, quemSomosJson, "content/site/quemSomos.json");
export const about = {
  tag: quemSomos.tag,
  title: quemSomos.title,
  summary: quemSomos.summary,
  fullText: quemSomos.fullText,
  tags: quemSomos.tags,
};
export const aboutPage = {
  bannerImage: quemSomos.bannerImage,
  bannerImageAlt: quemSomos.bannerImageAlt,
  teamTag: quemSomos.teamTag,
  teamHeading: quemSomos.teamHeading,
  valuesTag: quemSomos.valuesTag,
  valuesHeading: quemSomos.valuesHeading,
  valuesVisible: quemSomos.valuesVisible,
  values: quemSomos.values,
};
export const team = quemSomos.team.items;

export const campanha = parseContent(campanhaSchema, campanhaJson, "content/site/campanha.json");

// "Contactos" no admin absorve também as localizações (também mostradas na
// Homepage) — `locations` mantém a mesma forma de sempre.
export const contacts = parseContent(contactsSchema, contactsJson, "content/site/contacts.json");
export const locations = contacts.locations;

export const footer = parseContent(footerSchema, footerJson, "content/site/footer.json");

for (const link of footer.serviceLinks) {
  if (!services.some((s) => s.id === link.serviceId)) {
    throw new Error(
      `content/site/footer.json: "serviceLinks" referencia um serviço inexistente "${link.serviceId}". ` +
        `Corrija o id (tem de bater certo com um id em content/services/*.json) antes de repetir o build.`
    );
  }
}
export const meta = parseContent(metaSchema, metaJson, "content/site/meta.json");
export const notFoundContent = parseContent(notFoundSchema, notFoundJson, "content/site/notFound.json");
export const servicesPage = parseContent(servicesPageSchema, servicesPageJson, "content/site/servicesPage.json");
/** Cabeçalho da secção "Serviços" — usado na Homepage, na listagem e nos cartões de serviço. */
export const servicesHeading = servicesPage.sectionHeading;
export const servicePage = parseContent(servicePageSchema, servicePageJson, "content/site/servicePage.json");

export { resolveSectionLayout, youtubeEmbedUrl };

/**
 * Derivações únicas de visibilidade (FR-6, handoff-34 secção D.5) — a regra
 * de filtragem por `visible`/`<bloco>Visible` existe UMA VEZ aqui, nunca nos
 * componentes. Proibido `.filter(x => x.visible)` dentro de um componente.
 */

/** Lista bruta de slides do hero, só para debug/CMS — os componentes usam
 *  sempre `visibleHeroSlides`. */
export const heroSlides = hero.slider.slides;
/** Slides visíveis do hero, na ordem do ficheiro. Garantidamente não-vazio
 *  pelo `.refine` do schema (pelo menos 1 slide `visible: true`). */
export const visibleHeroSlides = heroSlides.filter((s) => s.visible);

/** Secções do detalhe de serviço visíveis, na ordem do ficheiro. */
export function visibleSections(service: Service) {
  return (service.sections ?? []).filter((s) => s.visible);
}

/** Itens de galeria visíveis, só se o bloco galeria estiver ligado. */
export function visibleGallery(service: Service) {
  return service.galleryVisible ? (service.gallery ?? []).filter((i) => i.visible) : [];
}

/** Valores institucionais visíveis, só se o bloco valores estiver ligado. */
export function visibleValues(page: AboutPage) {
  return page.valuesVisible ? page.values.filter((v) => v.visible) : [];
}

/** Etiquetas "about-tag" visíveis (usadas na homepage e em "Quem Somos"). */
export const visibleAboutTags = about.tags.filter((t) => t.visible);

/** Parágrafos visíveis do texto institucional completo ("Quem Somos"). */
export const visibleFullText = about.fullText.filter((p) => p.visible);

/** Estatísticas visíveis da stats-bar. */
export const visibleStats = stats.filter((s) => s.visible);

/** Pilares visíveis da página /campanha. */
export const visiblePillars = campanha.pillars.filter((p) => p.visible);

/** Fases da timeline visíveis, só se o bloco timeline estiver ligado. */
export const visibleTimeline = campanha.timelineVisible ? campanha.timeline.filter((t) => t.visible) : [];

/** Membros da equipa visíveis, na ordem do ficheiro (o primeiro é o cartão destacado). */
export const visibleTeam = team.filter((m) => m.visible);

/** Localizações visíveis (usadas na homepage e na página de contactos). */
export const visibleLocations = locations.filter((l) => l.visible);

/** Telefones visíveis da página de contactos. */
export const visiblePhones = contacts.phones.filter((p) => p.visible);

/** Emails visíveis da página de contactos. */
export const visibleEmails = contacts.emails.filter((e) => e.visible);

/** Referências de serviço visíveis na lista "Serviços" do rodapé, na ordem do ficheiro. */
export const visibleFooterServiceLinks = footer.serviceLinks.filter((l) => l.visible);

/** Constrói um link wa.me a partir de um número — só mantém dígitos, nunca escrito à mão. */
export function waLink(number: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

/**
 * Serviços relacionados no detalhe (Fase 2, design-spec-fase2 secção 2a):
 * os 3 próximos serviços na ORDEM CANÓNICA deste array `services` (definida
 * acima, herdada do antigo SERVICES de js/main.js), com wrap-around, nunca
 * incluindo o próprio serviço. A ordem deste array tem, portanto, significado
 * editorial — não reordenar sem intenção.
 */
export function relatedServices(currentId: string): Service[] {
  const total = services.length;
  const currentIndex = services.findIndex((s) => s.id === currentId);
  if (currentIndex === -1) return [];
  return [1, 2, 3].map((offset) => services[(currentIndex + offset) % total]);
}

/** Constrói o `<title>` de uma página a partir do título próprio + sufixo da marca. */
export function buildTitle(pageTitle: string): string {
  return `${pageTitle} — ${meta.titleSuffix}`;
}

export type {
  About,
  AboutPage,
  Campanha,
  ContentImage,
  Contacts,
  Footer,
  FooterServiceLink,
  GalleryImage,
  Hero,
  HeroSlide,
  Location,
  Nav,
  NavItem,
  NotFoundContent,
  Paragraph,
  PhoneEntry,
  EmailEntry,
  ResolvedSectionLayout,
  Service,
  ServicePage,
  ServiceSection,
  ServiceSectionLayout,
  ServicesPage,
  SiteMeta,
  StatItem,
  TeamMember,
  ValueItem,
} from "./schemas";
