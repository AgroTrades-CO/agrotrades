import type { Lang } from "@/content";
import { getHeaderViewData } from "@/lib/view-data/header";
import { HeaderView } from "@/components/HeaderView";

/**
 * Cabeçalho do site, usado pelos dois layouts raiz (PT e EN).
 *
 * Invólucro de servidor: lê @/content e entrega os dados à vista
 * `HeaderView`, que é o componente cliente. Nunca importar a partir de um
 * componente cliente — o conteúdo validado (Zod + todos os JSON de
 * `content/`) ficaria no bundle de todas as páginas, porque o cabeçalho está
 * no layout.
 */
export function Header({ lang }: { lang: Lang }) {
  return <HeaderView data={getHeaderViewData(lang)} lang={lang} />;
}
