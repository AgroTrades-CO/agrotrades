import Image from "next/image";
import Link from "next/link";
import { path } from "@/content/routes";
import {
  contacts,
  relatedServices,
  resolveSectionLayout,
  servicePage,
  visibleGallery,
  visibleSections,
  type Lang,
  type Service,
  type ServiceSection,
} from "@/content";
import { Icon } from "@/components/icon-map";
import { IconWhatsapp } from "@/components/icons";
import { ServiceCard } from "@/components/ServiceCard";

/** Lista de bullets opcional, partilhada pelas variantes "split"/"feature"
 *  (design-spec-fase2 1d) — nunca lida em secções sem imagem. */
function SectionBullets({ bullets, lang }: { bullets: ServiceSection["bullets"]; lang: Lang }) {
  if (!bullets) return null;
  return (
    <ul className="sd-section-bullets">
      {bullets[lang].map((item) => (
        <li key={item}>
          <span className="sd-check">&#10003;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ServiceDetailContent({ service, lang }: { service: Service; lang: Lang }) {
  const sections = visibleSections(service);
  const gallery = visibleGallery(service);
  const hasSections = sections.length > 0;
  const hasGallery = gallery.length > 0;
  const related = servicePage.relatedVisible ? relatedServices(service.id) : [];

  // Alternância do lado da variante "split": conta-se só entre secções desta
  // variante, não entre todas as secções do serviço (design-spec-fase2 1b).
  let splitCount = 0;

  return (
    <>
      <div className="page-hero sd-hero">
        <Image
          src={service.bannerImage}
          alt=""
          aria-hidden="true"
          fill
          className="sd-hero-image"
        />
        <div className="sd-hero-overlay" />
        <div className="page-hero-content">
          <Link href={path("services", lang)} className="sd-back" style={{ color: "rgba(255,255,255,0.7)" }}>
            &larr; <span>{servicePage.backToServices[lang]}</span>
          </Link>
          <div style={{ marginBottom: 16, color: "white" }}>
            <Icon name={service.icon} width={44} height={44} />
          </div>
          <h1 style={{ marginBottom: 16 }}>{service.title[lang]}</h1>
          <p>{service.summary[lang]}</p>
        </div>
      </div>

      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sd-body">
            <div>
              {hasSections ? (
                <>
                  <p className="sd-description">{service.description[lang]}</p>
                  <div className="sd-sections">
                    {sections.map((section, index) => {
                      const layout = resolveSectionLayout(section);

                      if (layout === "card") {
                        return (
                          <div
                            className={`sd-section-card ${index % 2 === 0 ? "sd-section-card--alt" : "sd-section-card--base"}`}
                            key={section.title[lang]}
                          >
                            <div className="sd-section-head">
                              <span className="sd-section-icon" aria-hidden="true">
                                <Icon name={section.icon ?? service.icon} width={16} height={16} />
                              </span>
                              <h3>{section.title[lang]}</h3>
                            </div>
                            <p>{section.text[lang]}</p>
                          </div>
                        );
                      }

                      if (layout === "feature") {
                        return (
                          <div className="sd-section-feature" key={section.title[lang]}>
                            <div className="sd-section-feature-image">
                              <Image
                                src={section.image!.image}
                                alt={section.image!.alt[lang]}
                                width={480}
                                height={360}
                              />
                            </div>
                            <div className="sd-section-feature-text">
                              <h3 className="sd-section-feature-title">{section.title[lang]}</h3>
                              <p>{section.text[lang]}</p>
                              <SectionBullets bullets={section.bullets} lang={lang} />
                            </div>
                          </div>
                        );
                      }

                      // layout === "split"
                      const isLeft = splitCount % 2 === 0;
                      splitCount += 1;
                      return (
                        <div
                          className={`sd-section-split${isLeft ? "" : " sd-section-split--reverse"}`}
                          key={section.title[lang]}
                        >
                          <div className="sd-section-split-image">
                            <Image
                              src={section.image!.image}
                              alt={section.image!.alt[lang]}
                              width={480}
                              height={360}
                            />
                          </div>
                          <div className="sd-section-split-text">
                            <div className="sd-section-head">
                              <span className="sd-section-icon" aria-hidden="true">
                                <Icon name={section.icon ?? service.icon} width={16} height={16} />
                              </span>
                              <h3>{section.title[lang]}</h3>
                            </div>
                            <p>{section.text[lang]}</p>
                            <SectionBullets bullets={section.bullets} lang={lang} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="sd-description">{service.description[lang]}</p>
              )}

              <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={contacts.whatsapp.url}
                  target="_blank"
                  rel="noopener"
                  className="whatsapp-btn"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 24px",
                    borderRadius: 10,
                    fontSize: 14,
                    width: "auto",
                  }}
                >
                  <IconWhatsapp width={18} height={18} />
                  <span>{contacts.whatsapp.label[lang]}</span>
                </a>
                <Link href={path("contact", lang)} className="btn-primary">
                  {contacts.title[lang]}
                </Link>
              </div>
            </div>
            <div className="sd-highlights-box">
              <h3>{servicePage.highlightsHeading[lang]}</h3>
              <ul>
                {service.highlights[lang].map((item) => (
                  <li key={item}>
                    <span className="sd-check">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {hasGallery && (
            <div className="sd-gallery-section">
              <h2 className="section-title sd-gallery-title">
                {servicePage.galleryHeading[lang]}
              </h2>
              <div className="sd-gallery-grid">
                {gallery.map((item) => (
                  <div className="sd-gallery-item" key={item.image}>
                    <Image src={item.image} alt={item.alt[lang]} width={480} height={360} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {servicePage.relatedVisible && related.length > 0 && (
            <div className="sd-related-section">
              <h2 className="section-title sd-gallery-title">{servicePage.relatedHeading[lang]}</h2>
              <div className="services-grid">
                {related.map((relatedService) => (
                  <ServiceCard service={relatedService} lang={lang} key={relatedService.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
