import { servicesHeading, type Lang, type Service } from "@/content";
import { toServiceCardData } from "@/lib/view-data/service";
import { ServiceCardView } from "@/components/ServiceCardView";

/**
 * Cartão de serviço partilhado — usado na listagem `/servicos` e na secção
 * "Outros serviços" do detalhe (Fase 2, design-spec-fase2 secção 2b), para
 * não duplicar markup/estilo entre os dois locais (recomendação do
 * ux-ui-designer, confirmada pelo software-architect no handoff-26).
 *
 * Invólucro de servidor (task-017, A-12): lê @/content e entrega os dados à
 * vista `ServiceCardView`. Nunca importar a partir de um componente cliente.
 */
export function ServiceCard({ service, lang }: { service: Service; lang: Lang }) {
  return <ServiceCardView card={toServiceCardData(service, lang)} learnMore={servicesHeading.learnMore} lang={lang} />;
}
