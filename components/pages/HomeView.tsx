import Link from "next/link";
import type {
  About,
  Campanha,
  Hero,
  HeroSlide,
  Home,
  HomeAbout,
  Location,
  ServicesPage,
  StatItem,
} from "@/content/schemas";
import type { Lang } from "@/content";
import { Icon } from "@/components/icon-map";
import { IconArrowRight, IconWhatsapp } from "@/components/icons";
import { HeroSlider } from "@/components/HeroSlider";
import { ServiceCardView, type ServiceCardData } from "@/components/ServiceCardView";
import { tinaAttr, type TinaFieldFn } from "@/components/tina/edit-binding";

/**
 * Dados da vista da homepage.
 * JSON simples, construído no servidor por lib/view-data/home.ts; na
 * pré-visualização da TinaCMS os campos editáveis vêm do `useTina`.
 */
export type HomeViewData = {
  hero: Hero;
  visibleHeroSlides: HeroSlide[];
  visibleStats: StatItem[];
  homeAbout: HomeAbout;
  locationsHeading: Home["locationsHeading"];
  about: Pick<About, "tag" | "title" | "summary">;
  visibleAboutTags: About["tags"];
  // Só de leitura nesta página (editáveis noutras entradas do CMS).
  whatsappUrl: string;
  servicesHeading: ServicesPage["sectionHeading"];
  serviceCards: ServiceCardData[];
  campanhaBanner: Campanha["banner"];
  campanhaQuoteAuthor: string;
  visibleLocations: Location[];
  hrefs: { services: string; about: string; campaign: string };
};

/**
 * Vista da homepage: só dados por props e só `import type` de
 * @/content — usada pelo invólucro de servidor `HomeContent` (site público)
 * e pela pré-visualização da TinaCMS (`HomePreview`, no browser). `tf` só é
 * passada pela pré-visualização; sem ela nenhum atributo `data-tina-field`
 * é escrito (components/tina/edit-binding.ts).
 */
export function HomeView({ lang, data, tf }: { lang: Lang; data: HomeViewData; tf?: TinaFieldFn }) {
  const {
    hero,
    visibleHeroSlides,
    visibleStats,
    homeAbout,
    locationsHeading,
    about,
    visibleAboutTags,
    servicesHeading,
    visibleLocations,
  } = data;

  return (
    <>
      {/* HERO */}
      <section className="hero" {...tinaAttr(tf, hero.slider, "slides")}>
        {/* Na pré-visualização, acrescentar/esconder slides volta a montar o carrossel. */}
        <HeroSlider
          slider={hero.slider}
          slides={visibleHeroSlides}
          lang={lang}
          key={tf ? visibleHeroSlides.length : undefined}
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
            <a href={data.whatsappUrl} className="btn-primary" target="_blank" rel="noopener">
              <IconWhatsapp />
              <span {...tinaAttr(tf, hero.buttons, "whatsapp")}>{hero.buttons.whatsapp[lang]}</span>
            </a>
            <Link href={data.hrefs.services} className="btn-secondary">
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
                href={data.hrefs.about}
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
                  &mdash; {data.campanhaQuoteAuthor} &nbsp;&middot;&nbsp; {data.campanhaBanner.title[lang]}
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
            <Link href={data.hrefs.services} className="btn-primary">
              {hero.buttons.services[lang]}
            </Link>
          </div>
          <div className="services-grid">
            {data.serviceCards.map((card) => (
              <ServiceCardView card={card} learnMore={servicesHeading.learnMore} lang={lang} key={card.id} />
            ))}
          </div>
        </div>
      </section>

      {/* CAMPANHA BANNER */}
      <div className="campanha-banner">
        <div>
          <div className="hero-tag" style={{ marginBottom: 12 }}>
            {data.campanhaBanner.tag[lang]}
          </div>
          <h2>{data.campanhaBanner.title[lang]}</h2>
          <p>{data.campanhaBanner.text[lang]}</p>
        </div>
        <Link href={data.hrefs.campaign} className="btn-primary" style={{ background: "var(--orange)" }}>
          <span>{data.campanhaBanner.button[lang]}</span>
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
