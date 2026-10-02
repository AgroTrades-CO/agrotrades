import Image from "next/image";
import Link from "next/link";
import type { BilingualString, Service, ServicePage, ServiceSection } from "@/content/schemas";
import type { Lang } from "@/content";
import { resolveSectionLayout, visibleGallery, visibleSections } from "@/content/derive";
import { Icon } from "@/components/icon-map";
import { IconWhatsapp } from "@/components/icons";
import { ServiceCardView, type ServiceCardData } from "@/components/ServiceCardView";
import { tinaAttr, type TinaAttr, type TinaFieldFn } from "@/components/tina/edit-binding";

/** Lista de bullets opcional, partilhada pelas variantes "split"/"feature"
 *  (design-spec-fase2 1d) — nunca lida em secções sem imagem. */
function SectionBullets({
  bullets,
  lang,
  edit = {},
}: {
  bullets: ServiceSection["bullets"];
  lang: Lang;
  edit?: TinaAttr;
}) {
  if (!bullets) return null;
  return (
    <ul className="sd-section-bullets" {...edit}>
      {bullets[lang].map((item) => (
        <li key={item}>
          <span className="sd-check">&#10003;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Dados da vista de detalhe de serviço (task-017, A-12; architecture.md
 * 18.1.3). JSON simples, construído no servidor por lib/view-data/service.ts;
 * na pré-visualização da TinaCMS `service` vem do `useTina`.
 */
export type ServiceDetailViewData = {
  service: Service;
  page: ServicePage;
  contact: { whatsappUrl: string; whatsappLabel: BilingualString; title: BilingualString };
  /** Vazio se `page.relatedVisible` for falso. */
  related: ServiceCardData[];
  learnMore: BilingualString;
  /** Link de volta no topo (listagem de serviços, ou de produtos). */
  back: { href: string; label: BilingualString };
  hrefs: { contact: string };
};

/**
 * Vista do detalhe de serviço (R-VIEW): só dados por props e só `import
 * type` de @/content — usada pelo invólucro de servidor
 * `ServiceDetailContent` (site público) e pela pré-visualização da TinaCMS
 * (`ServicePreview`, no browser). `tf` só é passada pela pré-visualização;
 * sem ela nenhum atributo `data-tina-field` é escrito (ver
 * components/tina/edit-binding.ts).
 */
export function ServiceDetailView({
  lang,
  data,
  tf,
}: {
  lang: Lang;
  data: ServiceDetailViewData;
  tf?: TinaFieldFn;
}) {
  const { service } = data;
  const sections = visibleSections(service);
  const gallery = visibleGallery(service);
  const hasSections = sections.length > 0;
  const hasGallery = gallery.length > 0;
  const related = data.related;

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
        <div className="sd-hero-overlay" {...tinaAttr(tf, service, "bannerImage")} />
        <div className="page-hero-content">
          <Link href={data.back.href} className="sd-back" style={{ color: "rgba(255,255,255,0.7)" }}>
            &larr; <span>{data.back.label[lang]}</span>
          </Link>
          <div style={{ marginBottom: 16, color: "white" }} {...tinaAttr(tf, service, "icon")}>
            <Icon name={service.icon} width={44} height={44} />
          </div>
          <h1 style={{ marginBottom: 16 }} {...tinaAttr(tf, service, "title")}>
            {service.title[lang]}
          </h1>
          <p {...tinaAttr(tf, service, "summary")}>{service.summary[lang]}</p>
        </div>
      </div>

      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sd-body">
            <div>
              {hasSections ? (
                <>
                  <p className="sd-description" {...tinaAttr(tf, service, "description")}>
                    {service.description[lang]}
                  </p>
                  <div className="sd-sections">
                    {sections.map((section, index) => {
                      const layout = resolveSectionLayout(section);

                      if (layout === "card") {
                        return (
                          <div
                            className={`sd-section-card ${index % 2 === 0 ? "sd-section-card--alt" : "sd-section-card--base"}`}
                            key={section.title[lang]}
                            {...tinaAttr(tf, section)}
                          >
                            <div className="sd-section-head">
                              <span className="sd-section-icon" aria-hidden="true">
                                <Icon name={section.icon ?? service.icon} width={16} height={16} />
                              </span>
                              <h3 {...tinaAttr(tf, section, "title")}>{section.title[lang]}</h3>
                            </div>
                            <p {...tinaAttr(tf, section, "text")}>{section.text[lang]}</p>
                          </div>
                        );
                      }

                      if (layout === "feature") {
                        return (
                          <div className="sd-section-feature" key={section.title[lang]}>
                            <div className="sd-section-feature-image" {...tinaAttr(tf, section, "image")}>
                              <Image
                                src={section.image!.image}
                                alt={section.image!.alt[lang]}
                                width={480}
                                height={360}
                              />
                            </div>
                            <div className="sd-section-feature-text">
                              <h3 className="sd-section-feature-title" {...tinaAttr(tf, section, "title")}>
                                {section.title[lang]}
                              </h3>
                              <p {...tinaAttr(tf, section, "text")}>{section.text[lang]}</p>
                              <SectionBullets
                                bullets={section.bullets}
                                lang={lang}
                                edit={tinaAttr(tf, section, "bullets")}
                              />
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
                          <div className="sd-section-split-image" {...tinaAttr(tf, section, "image")}>
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
                              <h3 {...tinaAttr(tf, section, "title")}>{section.title[lang]}</h3>
                            </div>
                            <p {...tinaAttr(tf, section, "text")}>{section.text[lang]}</p>
                            <SectionBullets
                              bullets={section.bullets}
                              lang={lang}
                              edit={tinaAttr(tf, section, "bullets")}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="sd-description" {...tinaAttr(tf, service, "description")}>
                  {service.description[lang]}
                </p>
              )}

              <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={data.contact.whatsappUrl}
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
                  <span>{data.contact.whatsappLabel[lang]}</span>
                </a>
                <Link href={data.hrefs.contact} className="btn-primary">
                  {data.contact.title[lang]}
                </Link>
              </div>
            </div>
            <div className="sd-highlights-box">
              <h3>{data.page.highlightsHeading[lang]}</h3>
              <ul {...tinaAttr(tf, service, "highlights")}>
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
                {data.page.galleryHeading[lang]}
              </h2>
              <div className="sd-gallery-grid">
                {gallery.map((item) => (
                  <div className="sd-gallery-item" key={item.image} {...tinaAttr(tf, item)}>
                    <Image src={item.image} alt={item.alt[lang]} width={480} height={360} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.page.relatedVisible && related.length > 0 && (
            <div className="sd-related-section">
              <h2 className="section-title sd-gallery-title">{data.page.relatedHeading[lang]}</h2>
              <div className="services-grid">
                {related.map((card) => (
                  <ServiceCardView card={card} learnMore={data.learnMore} lang={lang} key={card.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
