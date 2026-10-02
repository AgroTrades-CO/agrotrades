import Image from "next/image";
import Link from "next/link";
import { contacts, products, productsPage, type Lang } from "@/content";
import { path, productDetailPath } from "@/content/routes";
import { IconWhatsapp } from "@/components/icons";
import { ServiceCard } from "@/components/ServiceCard";

/** Listagem `/produtos` — mesmo layout da listagem de serviços, com os cartões a apontar para os produtos. */
export function ProductsListContent({ lang }: { lang: Lang }) {
  return (
    <>
      <div className="page-hero sd-hero">
        <Image
          src={productsPage.bannerImage}
          alt=""
          aria-hidden="true"
          fill
          className="sd-hero-image"
        />
        <div className="sd-hero-overlay" />
        <div className="page-hero-content">
          <span className="hero-tag">{productsPage.sectionHeading.tag[lang]}</span>
          <h1>{productsPage.sectionHeading.title[lang]}</h1>
          <p>{productsPage.intro[lang]}</p>
        </div>
      </div>

      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="services-grid">
            {products.map((product) => (
              <ServiceCard
                service={product}
                lang={lang}
                href={productDetailPath(product.id, lang)}
                learnMore={productsPage.sectionHeading.learnMore}
                key={product.id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--off-white)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <span className="section-tag">{contacts.tag[lang]}</span>
          <h2 className="section-title">{productsPage.ctaTitle[lang]}</h2>
          <p className="section-sub" style={{ margin: "0 auto 32px" }}>
            {productsPage.ctaText[lang]}
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
