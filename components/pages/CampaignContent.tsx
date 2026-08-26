import Image from "next/image";
import { campanha, hero, type Lang } from "@/content";
import { Icon } from "@/components/icon-map";
import { IconWhatsapp } from "@/components/icons";

export function CampaignContent({ lang }: { lang: Lang }) {
  return (
    <>
      <div className="page-hero sd-hero">
        <Image
          src={campanha.hero.bannerImage}
          alt=""
          aria-hidden="true"
          fill
          className="sd-hero-image"
        />
        <div className="sd-hero-overlay" />
        <div className="page-hero-content">
          <span className="hero-tag">{campanha.hero.tag}</span>
          <h1>{campanha.banner.title[lang]}</h1>
          <p>{campanha.hero.intro[lang]}</p>
        </div>
      </div>

      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="quote-block">
            <blockquote>{hero.motto[lang]}</blockquote>
            <cite>
              &mdash; {campanha.quote.author} &nbsp;&middot;&nbsp; {campanha.quote.citeSuffix[lang]}
            </cite>
          </div>

          <span className="section-tag">{campanha.vision.tag[lang]}</span>
          <h2 className="section-title">{campanha.vision.title[lang]}</h2>
          <p className="section-sub">{campanha.vision.text[lang]}</p>

          <div className="pillar-grid">
            {campanha.pillars.map((pillar) => (
              <div className="pillar" key={pillar.title.pt}>
                <div className="icon">
                  <Icon name={pillar.icon} width={32} height={32} />
                </div>
                <h3>{pillar.title[lang]}</h3>
                <p>{pillar.text[lang]}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 64 }}>
            <span className="section-tag">{campanha.timelineHeading.tag[lang]}</span>
            <h2 className="section-title">{campanha.timelineHeading.title[lang]}</h2>
            <div className="timeline">
              {campanha.timeline.map((item) => (
                <div className="timeline-item" key={item.title.pt}>
                  <h3>{item.title[lang]}</h3>
                  <p>{item.text[lang]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="campanha-banner" style={{ margin: 0, borderRadius: 0 }}>
        <div>
          <h2>{campanha.cta.title[lang]}</h2>
          <p>{campanha.cta.text[lang]}</p>
        </div>
        <a
          href="https://wa.me/258841031220"
          target="_blank"
          rel="noopener"
          className="btn-primary"
          style={{ background: "var(--orange)" }}
        >
          <IconWhatsapp width={18} height={18} />
          <span>{campanha.cta.button[lang]}</span>
        </a>
      </div>
    </>
  );
}
