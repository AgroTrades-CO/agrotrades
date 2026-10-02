import Image from "next/image";
import Link from "next/link";
import type { BilingualString, Service } from "@/content/schemas";
import type { Lang } from "@/content";
import { Icon } from "@/components/icon-map";

/** Dados do cartão de serviço, já resolvidos no servidor (lib/view-data/service.ts). */
export type ServiceCardData = Pick<Service, "id" | "bannerImage" | "bannerImageAlt" | "icon" | "title" | "summary"> & {
  href: string;
};

/**
 * Vista do cartão de serviço (task-017, A-12/R-VIEW): só recebe dados por
 * props e só importa tipos de @/content — pode correr no browser da
 * pré-visualização sem mudar o bundle das páginas públicas (AC-15).
 * Markup igual ao do antigo `ServiceCard` (listagem `/servicos`, "Outros
 * serviços" do detalhe e pré-visualização da homepage; design-spec-fase2 2b).
 */
export function ServiceCardView({ card, learnMore, lang }: { card: ServiceCardData; learnMore: BilingualString; lang: Lang }) {
  return (
    <div className="service-card service-card--with-cover">
      <div className="service-card-cover">
        <Image src={card.bannerImage} alt={card.bannerImageAlt[lang]} width={640} height={360} />
      </div>
      <div className="service-card-body">
        <div className="service-icon service-icon--badge" aria-hidden="true">
          <Icon name={card.icon} width={24} height={24} />
        </div>
        <h3>{card.title[lang]}</h3>
        <p>{card.summary[lang]}</p>
        <Link href={card.href} className="btn-saiba-mais">
          {learnMore[lang]} &rarr;
        </Link>
      </div>
    </div>
  );
}
