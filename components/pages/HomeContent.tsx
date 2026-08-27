import Link from "next/link";
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
  type Service,
} from "@/content";
import { path } from "@/content/routes";
import { Icon } from "@/components/icon-map";
import { IconArrowRight, IconWhatsapp } from "@/components/icons";
import { HeroSlider } from "@/components/HeroSlider";
import { ServiceCard } from "@/components/ServiceCard";

// Mesma seleção e ordem de serviços do preview da homepage original (index.html):
// arroz, cereais, mecanização, moageira.
const PREVIEW_SERVICE_IDS = ["arroz", "cereais", "mecanizacao", "moageira"] as const;

export function HomeContent({ lang }: { lang: Lang }) {
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
      <section className="hero">
        <HeroSlider slider={hero.slider} slides={visibleHeroSlides} lang={lang} />
        <div className="hero-slider-overlay" />
        <div className="hero-content">
          <div className="hero-tag fade-up">{hero.tag[lang]}</div>
          <h1 className="fade-up-2">
            <span>{hero.titleLine1[lang]}</span>
            <br />
            <span style={{ color: "var(--orange)" }}>{hero.titleLine2[lang]}</span>
          </h1>
          <p className="hero-motto fade-up-2">{hero.motto[lang]}</p>
          <p className="fade-up-3">{hero.text[lang]}</p>
          <div className="hero-btns fade-up-3">
            <a href={contacts.whatsapp.url} className="btn-primary" target="_blank" rel="noopener">
              <IconWhatsapp />
              <span>{hero.buttons.whatsapp[lang]}</span>
            </a>
            <Link href={path("services", lang)} className="btn-secondary">
              <span>{hero.buttons.services[lang]}</span>
              <IconArrowRight width={16} height={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        {visibleStats.map((stat) => (
          <div className="stat-item" key={stat.label.pt}>
            <span className="stat-num">{stat.value}</span>
            <span className="stat-label">{stat.label[lang]}</span>
          </div>
        ))}
      </div>

      {/* ABOUT */}
      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="about-grid">
            <div>
              <span className="section-tag">{about.tag[lang]}</span>
              <h2 className="section-title">{about.title[lang]}</h2>
              <p className="section-sub">{about.summary[lang]}</p>
              {homeAbout.extended.visible && (
                <p
                  style={{
                    fontSize: 16,
                    color: "var(--text-muted)",
                    lineHeight: 1.8,
                    marginTop: 16,
                  }}
                >
                  {homeAbout.extended[lang]}
                </p>
              )}
              <div className="about-tags">
                {visibleAboutTags.map((tag) => (
                  <span className="about-tag" key={tag.label.pt}>
                    <Icon name={tag.icon} width={16} height={16} /> {tag.label[lang]}
                  </span>
                ))}
              </div>
              <Link href={path("about", lang)} className="btn-saiba-mais" style={{ marginTop: 20 }}>
                {homeAbout.learnMoreLabel[lang]} <IconArrowRight width={14} height={14} />
              </Link>
            </div>
            <div className="about-visual">
              <div className="about-card">
                <blockquote>{hero.motto[lang]}</blockquote>
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
          <span className="section-tag">{locationsHeading.tag[lang]}</span>
          <h2 className="section-title">{locationsHeading.title[lang]}</h2>
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
