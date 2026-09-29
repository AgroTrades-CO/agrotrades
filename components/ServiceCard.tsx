import Image from "next/image";
import Link from "next/link";
import { servicesHeading, type Lang, type Service } from "@/content";
import { serviceDetailPath } from "@/content/routes";
import { Icon } from "@/components/icon-map";

/**
 * Cartão de serviço partilhado — usado na listagem `/servicos` e na secção
 * "Outros serviços" do detalhe (Fase 2, design-spec-fase2 secção 2b), para
 * não duplicar markup/estilo entre os dois locais (recomendação do
 * ux-ui-designer, confirmada pelo software-architect no handoff-26).
 */
export function ServiceCard({
  service,
  lang,
  href = serviceDetailPath(service.id, lang),
  learnMore = servicesHeading.learnMore[lang],
}: {
  service: Service;
  lang: Lang;
  /** Destino do link; por omissão, a página do serviço. Os produtos passam o seu próprio caminho. */
  href?: string;
  learnMore?: string;
}) {
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
        <Link href={href} className="btn-saiba-mais">
          {learnMore} &rarr;
        </Link>
      </div>
    </div>
  );
}
