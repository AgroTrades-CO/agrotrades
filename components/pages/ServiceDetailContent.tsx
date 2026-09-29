import type { Lang, Service } from "@/content";
import { getServiceDetailViewData } from "@/lib/view-data/service";
import { ServiceDetailView } from "@/components/pages/ServiceDetailView";

/**
 * Detalhe de serviço do site público — invólucro de servidor (task-017,
 * A-12): lê o conteúdo publicado (lib/view-data/service.ts) e entrega-o à
 * vista `ServiceDetailView`. A pré-visualização da TinaCMS usa a mesma vista
 * com os dados em edição.
 */
export function ServiceDetailContent({ service, lang }: { service: Service; lang: Lang }) {
  return <ServiceDetailView lang={lang} data={getServiceDetailViewData(service, lang)} />;
}
