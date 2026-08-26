import Image from "next/image";
import Link from "next/link";
import { sections, type Lang, type Service } from "@/content";
import { serviceDetailPath } from "@/content/routes";
import { Icon } from "@/components/icon-map";

/**
 * Cartão de serviço partilhado — usado na listagem `/servicos` e na secção
 * "Outros serviços" do detalhe (Fase 2, design-spec-fase2 secção 2b), para
 * não duplicar markup/estilo entre os dois locais (recomendação do
 * ux-ui-designer, confirmada pelo software-architect no handoff-26).
 */
export function ServiceCard({ service, lang }: { service: Service; lang: Lang }) {
  return (
    <div className="service-card service-card--with-cover">
      <div className="service-card-cover">
        <Image src={service.bannerImage} alt={service.bannerImageAlt[lang]} width={640} height={360} />
      </div>
      <div className="service-card-body">
        <div className="service-icon service-icon--badge" aria-hidden="true">
          <Icon name={service.icon} width={24} height={24} />
        </div>
        <h3>{service.title[lang]}</h3>
        <p>{service.summary[lang]}</p>
        <Link href={serviceDetailPath(service.id, lang)} className="btn-saiba-mais">
          {sections.services.learnMore[lang]} &rarr;
        </Link>
      </div>
    </div>
  );
}
