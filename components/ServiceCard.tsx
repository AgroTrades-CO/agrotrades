import { servicesHeading, type Lang, type Service } from "@/content";
import type { BilingualString } from "@/content/schemas";
import { toServiceCardData } from "@/lib/view-data/service";
import { ServiceCardView } from "@/components/ServiceCardView";

/**
 * Cartão de serviço partilhado — usado na listagem `/servicos` e na secção
 * "Outros serviços" do detalhe, para não duplicar markup nem estilo entre
 * os dois locais.
 *
 * Invólucro de servidor: lê @/content e entrega os dados à
 * vista `ServiceCardView`. Nunca importar a partir de um componente cliente.
 */
export function ServiceCard({
  service,
  lang,
  href,
  learnMore = servicesHeading.learnMore,
}: {
  service: Service;
  lang: Lang;
  /** Destino do link; por omissão, a página do serviço. Os produtos passam o seu próprio caminho. */
  href?: string;
  learnMore?: BilingualString;
}) {
  return <ServiceCardView card={toServiceCardData(service, lang, href)} learnMore={learnMore} lang={lang} />;
}
