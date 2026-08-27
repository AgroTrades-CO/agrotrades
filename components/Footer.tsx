import Image from "next/image";
import Link from "next/link";
import { footer, nav, services, visibleFooterServiceLinks, waLink, type Lang } from "@/content";
import { path, type PageKey } from "@/content/routes";

// Caso especial de routing: "campanha" é um serviço normal (content/services)
// mas o link do rodapé aponta para a página dedicada /campanha, não para a
// listagem genérica de serviços. Decisão de rota, por isso fica no código —
// o resto (quais serviços aparecem, ordem, visibilidade) é editorial (CMS).
const FOOTER_SERVICE_PAGE_OVERRIDE: Partial<Record<string, PageKey>> = {
  campanha: "campaign",
};

export function Footer({ lang }: { lang: Lang }) {
  const year = new Date().getFullYear();

  function serviceLabel(id: string) {
    const service = services.find((s) => s.id === id);
    if (!service) return id;
    return (service.homeTitle ?? service.title)[lang];
  }

  const navLinks = [
    { key: "home", href: path("home", lang), label: nav.home[lang], visible: nav.home.visible },
    { key: "services", href: path("services", lang), label: nav.services[lang], visible: nav.services.visible },
    { key: "campaign", href: path("campaign", lang), label: nav.campaign[lang], visible: nav.campaign.visible },
    { key: "contact", href: path("contact", lang), label: nav.contact[lang], visible: nav.contact.visible },
    { key: "about", href: path("about", lang), label: nav.about[lang], visible: nav.about.visible },
  ].filter((link) => link.visible);

  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="footer-logo">
            <Image src="/images/logo.png" alt="AGRO TRADES LDA" width={48} height={48} />
          </div>
          <p className="footer-desc">{footer.description[lang]}</p>
        </div>
        <div>
          <h4>{footer.servicesHeading[lang]}</h4>
          <ul>
            {visibleFooterServiceLinks.map(({ serviceId }) => (
              <li key={serviceId}>
                <Link href={path(FOOTER_SERVICE_PAGE_OVERRIDE[serviceId] ?? "services", lang)}>
                  {serviceLabel(serviceId)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{footer.linksHeading[lang]}</h4>
          <ul>
            {navLinks.map((link) => (
              <li key={link.key}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          &copy; {year} {footer.legalCopy[lang]}
        </span>
        {footer.signature.visible && (
          <span className="footer-signature">
            by{" "}
            <a href={waLink(footer.signature.whatsappNumber)} target="_blank" rel="noopener">
              {footer.signature.name}
            </a>
          </span>
        )}
        <span>{footer.madeIn[lang]}</span>
      </div>
    </footer>
  );
}
