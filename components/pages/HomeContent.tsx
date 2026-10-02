import type { Lang } from "@/content";
import { getHomeViewData } from "@/lib/view-data/home";
import { HomeView } from "@/components/pages/HomeView";

/**
 * Homepage do site público — invólucro de servidor (task-017, A-12): lê o
 * conteúdo publicado (lib/view-data/home.ts) e entrega-o à vista `HomeView`.
 * A pré-visualização da TinaCMS usa a mesma vista com os dados em edição.
 */
export function HomeContent({ lang }: { lang: Lang }) {
  return <HomeView lang={lang} data={getHomeViewData(lang)} />;
}
