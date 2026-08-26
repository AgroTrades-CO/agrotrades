import Image from "next/image";
import Link from "next/link";
import { footer, hero, nav, services, type Lang } from "@/content";
import { path } from "@/content/routes";

// Mesma seleção e ordem de serviços/links do footer original (index.html):
// arroz -> /servicos, mecanização -> /servicos, moageira -> /servicos,
// campanha -> /campanha.
const FOOTER_SERVICE_LINKS = [
  { id: "arroz", page: "services" as const },
  { id: "mecanizacao", page: "services" as const },
  { id: "moageira", page: "services" as const },
  { id: "campanha", page: "campaign" as const },
];

export function Footer({ lang }: { lang: Lang }) {
  const year = new Date().getFullYear();

  function serviceLabel(id: string) {
    const service = services.find((s) => s.id === id);
    if (!service) return id;
    return (service.homeTitle ?? service.title)[lang];
  }

  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="footer-logo">
            <Image src="/images/logo.png" alt="AGRO TRADES LDA" width={48} height={48} />
          </div>
          <p className="footer-desc">{hero.text[lang]}</p>
        </div>
        <div>
          <h4>{footer.servicesHeading[lang]}</h4>
          <ul>
            {FOOTER_SERVICE_LINKS.map(({ id, page: pageKey }) => (
              <li key={id}>
                <Link href={path(pageKey, lang)}>{serviceLabel(id)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{footer.linksHeading[lang]}</h4>
          <ul>
            <li><Link href={path("home", lang)}>{nav.home[lang]}</Link></li>
            <li><Link href={path("services", lang)}>{nav.services[lang]}</Link></li>
            <li><Link href={path("campaign", lang)}>{nav.campaign[lang]}</Link></li>
            <li><Link href={path("contact", lang)}>{nav.contact[lang]}</Link></li>
            <li><Link href={path("about", lang)}>{nav.about[lang]}</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {year} {footer.legalCopy[lang]}</span>
        <span>{footer.madeIn[lang]}</span>
      </div>
    </footer>
  );
}
