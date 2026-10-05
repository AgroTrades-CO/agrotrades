import type { Lang, Service } from "@/content";
import type { BilingualString } from "@/content/schemas";
import { getServiceDetailViewData } from "@/lib/view-data/service";
import { ServiceDetailView } from "@/components/pages/ServiceDetailView";

/**
 * Detalhe de serviço do site público — invólucro de servidor: lê o
 * conteúdo publicado (lib/view-data/service.ts) e entrega-o à
 * vista `ServiceDetailView`. A pré-visualização da TinaCMS usa a mesma vista
 * com os dados em edição. As páginas de produto passam `back` e
 * `showRelated={false}`.
 */
export function ServiceDetailContent({
  service,
  lang,
  back,
  showRelated,
}: {
  service: Service;
  lang: Lang;
  /** Link de volta no topo; por omissão, a listagem de serviços. */
  back?: { href: string; label: BilingualString };
  /** Bloco "Outros serviços" — só faz sentido nas páginas de serviço. */
  showRelated?: boolean;
}) {
  return <ServiceDetailView lang={lang} data={getServiceDetailViewData(service, lang, { back, showRelated })} />;
}
