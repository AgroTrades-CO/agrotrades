import Image from "next/image";
import { contacts, locations, type Lang } from "@/content";
import { Icon } from "@/components/icon-map";
import { IconWhatsapp } from "@/components/icons";

export function ContactContent({ lang }: { lang: Lang }) {
  return (
    <>
      <div className="page-hero sd-hero">
        <Image
          src={contacts.bannerImage}
          alt=""
          aria-hidden="true"
          fill
          className="sd-hero-image"
        />
        <div className="sd-hero-overlay" />
        <div className="page-hero-content">
          <span className="hero-tag">{contacts.tag[lang]}</span>
          <h1>{contacts.title[lang]}</h1>
          <p>{contacts.intro[lang]}</p>
        </div>
      </div>

      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="contact-grid">
            <div className="contact-info">
              <a href={contacts.whatsapp.url} target="_blank" rel="noopener" className="whatsapp-btn">
                <IconWhatsapp width={22} height={22} />
                <span>{contacts.whatsapp.label[lang]}</span>
              </a>

              <div className="contact-item">
                <div className="contact-icon">
                  <Icon name="handshake" width={18} height={18} />
                </div>
                <div>
                  <h4>{contacts.phoneLabel[lang]}</h4>
                  {contacts.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone}`}>
                      {phone}
                    </a>
                  ))}
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <Icon name="mapPin" width={18} height={18} />
                </div>
                <div>
                  <h4>{contacts.emailLabel[lang]}</h4>
                  {contacts.emails.map((email) => (
                    <a key={email} href={`mailto:${email}`}>
                      {email}
                    </a>
                  ))}
                </div>
              </div>

              {locations.map((location) => (
                <div className="contact-item" key={location.id}>
                  <div className="contact-icon">
                    <Icon name={location.icon} width={18} height={18} />
                  </div>
                  <div>
                    <h4>{location.type[lang]}</h4>
                    <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, display: "block" }}>
                      {location.address.map((line, index) => (
                        <span key={line}>
                          {line}
                          {index < location.address.length - 1 && <br />}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              ))}

              <div
                style={{
                  background: "var(--green-light)",
                  borderRadius: 14,
                  padding: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {contacts.ceo.initials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{contacts.ceo.name}</div>
                  <div style={{ fontSize: 13, color: "var(--green-dark)", fontWeight: 500 }}>
                    {contacts.ceo.role[lang]}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{contacts.ceo.company}</div>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  height: "100%",
                  minHeight: 400,
                }}
              >
                <iframe
                  src={contacts.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 400 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="AGRO TRADES"
                />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
                <a href={contacts.mapsLink} target="_blank" rel="noopener">
                  {locations[0]?.address.join(" — ")}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
