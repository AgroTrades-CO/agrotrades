import Image from "next/image";
import Link from "next/link";
import { contacts, sections, services, servicesPage, type Lang } from "@/content";
import { path } from "@/content/routes";
import { IconWhatsapp } from "@/components/icons";
import { ServiceCard } from "@/components/ServiceCard";

export function ServicesListContent({ lang }: { lang: Lang }) {
  return (
    <>
      <div className="page-hero sd-hero">
        <Image
          src={servicesPage.bannerImage}
          alt=""
          aria-hidden="true"
          fill
          className="sd-hero-image"
        />
        <div className="sd-hero-overlay" />
        <div className="page-hero-content">
          <span className="hero-tag">{sections.services.tag[lang]}</span>
          <h1>{sections.services.title[lang]}</h1>
          <p>{servicesPage.intro[lang]}</p>
        </div>
      </div>

      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard service={service} lang={lang} key={service.id} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--off-white)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <span className="section-tag">{contacts.tag[lang]}</span>
          <h2 className="section-title">{servicesPage.ctaTitle[lang]}</h2>
          <p className="section-sub" style={{ margin: "0 auto 32px" }}>
            {servicesPage.ctaText[lang]}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
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
                padding: "14px 28px",
                borderRadius: 10,
                width: "auto",
              }}
            >
              <IconWhatsapp width={20} height={20} />
              <span>{contacts.whatsapp.label[lang]}</span>
            </a>
            <Link href={path("contact", lang)} className="btn-primary">
              {contacts.title[lang]}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
