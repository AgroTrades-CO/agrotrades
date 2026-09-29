import Link from "next/link";
import {
  about as siteAbout,
  campanha,
  contacts,
  hero as siteHero,
  homeAbout as siteHomeAbout,
  locationsHeading as siteLocationsHeading,
  servicesHeading,
  services,
  visibleAboutTags as siteVisibleAboutTags,
  visibleHeroSlides as siteVisibleHeroSlides,
  visibleLocations,
  visibleStats as siteVisibleStats,
  type Lang,
  type Service,
} from "@/content";
import type { HomeAbout } from "@/content/schemas";
import { path } from "@/content/routes";
import { Icon } from "@/components/icon-map";
import { IconArrowRight, IconWhatsapp } from "@/components/icons";
import { HeroSlider } from "@/components/HeroSlider";
import { ServiceCard } from "@/components/ServiceCard";
import { tinaAttr, type TinaFieldFn } from "@/components/tina/edit-binding";

// Mesma seleção e ordem de serviços do preview da homepage original (index.html):
// arroz, cereais, mecanização, moageira.
const PREVIEW_SERVICE_IDS = ["arroz", "cereais", "mecanizacao", "moageira"] as const;

/**
 * Dados editáveis da homepage. O site público usa sempre os valores de
 * `@/content` (validados no build); só a pré-visualização da TinaCMS
 * (/editor-preview, task-017) passa `data` com o conteúdo em edição e `tf`
 * (clicar para editar). Sem `data`/`tf` o resultado é exatamente o anterior.
 */
export type HomeData = {
  hero: typeof siteHero;
  visibleHeroSlides: typeof siteVisibleHeroSlides;
  visibleStats: typeof siteVisibleStats;
  homeAbout: HomeAbout;
  locationsHeading: typeof siteLocationsHeading;
  about: Pick<typeof siteAbout, "tag" | "title" | "summary">;
  visibleAboutTags: typeof siteVisibleAboutTags;
};

const SITE_HOME_DATA: HomeData = {
  hero: siteHero,
  visibleHeroSlides: siteVisibleHeroSlides,
  visibleStats: siteVisibleStats,
  homeAbout: siteHomeAbout,
  locationsHeading: siteLocationsHeading,
  about: siteAbout,
  visibleAboutTags: siteVisibleAboutTags,
};

export function HomeContent({ lang, data, tf }: { lang: Lang; data?: HomeData; tf?: TinaFieldFn }) {
  const { hero, visibleHeroSlides, visibleStats, homeAbout, locationsHeading, about, visibleAboutTags } =
    data ?? SITE_HOME_DATA;
  // Resolve o override homeTitle/homeBlurb ANTES de entrar no ServiceCard
  // (design-spec-fase3 secção 3, opção (a) — o componente não conhece o
  // conceito "override da homepage").
  const servicePreview: Service[] = PREVIEW_SERVICE_IDS.map((id) => {
    const service = services.find((s) => s.id === id);
    if (!service) {
      throw new Error(`Serviço "${id}" não encontrado em content/services — necessário para o preview da homepage.`);
    }
    return {
      ...service,
      title: service.homeTitle ?? service.title,
      summary: service.homeBlurb ?? service.summary,
    };
  });

  return (
    <>
      {/* HERO */}
      <section className="hero" {...tinaAttr(tf, hero.slider, "slides")}>
        {/* Na pré-visualização, acrescentar/esconder slides volta a montar o carrossel. */}
        <HeroSlider
          slider={hero.slider}
          slides={visibleHeroSlides}
          lang={lang}
          key={data ? visibleHeroSlides.length : undefined}
        />
        <div className="hero-slider-overlay" />
        <div className="hero-content">
          <div className="hero-tag fade-up" {...tinaAttr(tf, hero, "tag")}>
            {hero.tag[lang]}
          </div>
          <h1 className="fade-up-2">
            <span {...tinaAttr(tf, hero, "titleLine1")}>{hero.titleLine1[lang]}</span>
            <br />
            <span style={{ color: "var(--orange)" }} {...tinaAttr(tf, hero, "titleLine2")}>
              {hero.titleLine2[lang]}
            </span>
          </h1>
          <p className="hero-motto fade-up-2" {...tinaAttr(tf, hero, "motto")}>
            {hero.motto[lang]}
          </p>
          <p className="fade-up-3" {...tinaAttr(tf, hero, "text")}>
            {hero.text[lang]}
          </p>
          <div className="hero-btns fade-up-3">
            <a href={contacts.whatsapp.url} className="btn-primary" target="_blank" rel="noopener">
              <IconWhatsapp />
              <span {...tinaAttr(tf, hero.buttons, "whatsapp")}>{hero.buttons.whatsapp[lang]}</span>
            </a>
            <Link href={path("services", lang)} className="btn-secondary">
              <span {...tinaAttr(tf, hero.buttons, "services")}>{hero.buttons.services[lang]}</span>
              <IconArrowRight width={16} height={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        {visibleStats.map((stat) => (
          <div className="stat-item" key={stat.label.pt}>
            <span className="stat-num" {...tinaAttr(tf, stat, "value")}>
              {stat.value}
            </span>
            <span className="stat-label" {...tinaAttr(tf, stat, "label")}>
              {stat.label[lang]}
            </span>
          </div>
        ))}
      </div>

      {/* ABOUT */}
      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="about-grid">
            <div>
              <span className="section-tag" {...tinaAttr(tf, about, "tag")}>
                {about.tag[lang]}
              </span>
              <h2 className="section-title" {...tinaAttr(tf, about, "title")}>
                {about.title[lang]}
              </h2>
              <p className="section-sub" {...tinaAttr(tf, about, "summary")}>
                {about.summary[lang]}
              </p>
              {homeAbout.extended.visible && (
                <p
                  style={{
                    fontSize: 16,
                    color: "var(--text-muted)",
                    lineHeight: 1.8,
                    marginTop: 16,
                  }}
                  {...tinaAttr(tf, homeAbout, "extended")}
                >
                  {homeAbout.extended[lang]}
                </p>
              )}
              <div className="about-tags">
                {visibleAboutTags.map((tag) => (
                  <span className="about-tag" key={tag.label.pt} {...tinaAttr(tf, tag)}>
                    <Icon name={tag.icon} width={16} height={16} /> {tag.label[lang]}
                  </span>
                ))}
              </div>
              <Link
                href={path("about", lang)}
                className="btn-saiba-mais"
                style={{ marginTop: 20 }}
                {...tinaAttr(tf, homeAbout, "learnMoreLabel")}
              >
                {homeAbout.learnMoreLabel[lang]} <IconArrowRight width={14} height={14} />
              </Link>
            </div>
            <div className="about-visual">
              <div className="about-card">
                <blockquote {...tinaAttr(tf, hero, "motto")}>{hero.motto[lang]}</blockquote>
                <p className="quote-author">
                  &mdash; {campanha.quote.author} &nbsp;&middot;&nbsp; {campanha.banner.title[lang]}
                </p>
              </div>
              {homeAbout.ceo.visible && (
                <div
                  style={{
                    marginTop: 20,
                    background: "var(--green-light)",
                    borderRadius: 16,
                    padding: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                  {...tinaAttr(tf, homeAbout, "ceo")}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "var(--green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {homeAbout.ceo.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{homeAbout.ceo.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{homeAbout.ceo.role[lang]}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <span className="section-tag">{servicesHeading.tag[lang]}</span>
              <h2 className="section-title">{servicesHeading.title[lang]}</h2>
            </div>
            <Link href={path("services", lang)} className="btn-primary">
              {hero.buttons.services[lang]}
            </Link>
          </div>
          <div className="services-grid">
            {servicePreview.map((service) => (
              <ServiceCard service={service} lang={lang} key={service.id} />
            ))}
          </div>
        </div>
      </section>

      {/* CAMPANHA BANNER */}
      <div className="campanha-banner">
        <div>
          <div className="hero-tag" style={{ marginBottom: 12 }}>
            {campanha.banner.tag[lang]}
          </div>
          <h2>{campanha.banner.title[lang]}</h2>
          <p>{campanha.banner.text[lang]}</p>
        </div>
        <Link href={path("campaign", lang)} className="btn-primary" style={{ background: "var(--orange)" }}>
          <span>{campanha.banner.button[lang]}</span>
          <IconArrowRight width={16} height={16} />
        </Link>
      </div>

      {/* LOCATIONS */}
      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="section-tag" {...tinaAttr(tf, locationsHeading, "tag")}>
            {locationsHeading.tag[lang]}
          </span>
          <h2 className="section-title" {...tinaAttr(tf, locationsHeading, "title")}>
            {locationsHeading.title[lang]}
          </h2>
          <div className="locations-grid">
            {visibleLocations.map((location) => (
              <div className="location-card" key={location.id}>
                <div className="loc-icon">
                  <Icon name={location.icon} width={28} height={28} />
                </div>
                <p className="loc-type">{location.type[lang]}</p>
                <h3>{location.name}</h3>
                <address>
                  {location.address.map((line, index) => (
                    <span key={line}>
                      {line}
                      {index < location.address.length - 1 && <br />}
                    </span>
                  ))}
                </address>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
