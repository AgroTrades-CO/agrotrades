"use client";

/**
 * Pré-visualização editável da página inicial (TinaCMS, task-017).
 * Reutiliza o MESMO componente do site (`HomeContent`), com os dados em
 * edição (recebidos do admin por `useTina`, nunca saem do browser) e a
 * ligação clicar-para-editar. Só usado pelas rotas /editor-preview e
 * /en/editor-preview; nada disto entra no site público.
 */
import { useTina } from "tinacms/dist/react";
import type { HomePreviewQuery, HomePreviewQueryVariables } from "@/tina/__generated__/types";
import { HomeContent, type HomeData } from "@/components/pages/HomeContent";
import { visibleHeroSlides as siteVisibleHeroSlides, type Lang } from "@/content";
import { PreviewLangSwitch } from "./PreviewLangSwitch";
import { isVisible, stripNulls, tf, toHeroSlide } from "./normalize";

type AnyRecord = Record<string, unknown>;

export function HomePreview(props: {
  query: string;
  variables: HomePreviewQueryVariables;
  data: HomePreviewQuery;
  lang: Lang;
}) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const home = stripNulls(data.paginaInicial) as unknown as AnyRecord & {
    hero: AnyRecord & { slider: AnyRecord & { slides?: AnyRecord[] } };
    stats: { items?: AnyRecord[] };
  };
  const quemSomos = stripNulls(data.quemSomos) as unknown as AnyRecord & { tags?: AnyRecord[] };

  const slides = (home.hero.slider.slides ?? [])
    .map(toHeroSlide)
    .filter((s): s is AnyRecord => s !== null);
  const visibleSlides = slides.filter(isVisible);

  const homeData = {
    hero: { ...home.hero, slider: { ...home.hero.slider, slides } },
    // O site exige pelo menos um slide visível (validado no build); durante
    // a edição, se não houver nenhum, mantém-se o fundo publicado.
    visibleHeroSlides: visibleSlides.length > 0 ? visibleSlides : siteVisibleHeroSlides,
    visibleStats: (home.stats.items ?? []).filter(isVisible),
    homeAbout: home.about,
    locationsHeading: home.locationsHeading,
    about: quemSomos,
    visibleAboutTags: (quemSomos.tags ?? []).filter(isVisible),
  } as unknown as HomeData;

  return (
    <>
      <HomeContent lang={props.lang} data={homeData} tf={tf} />
      <PreviewLangSwitch lang={props.lang} hrefPt="/editor-preview" hrefEn="/en/editor-preview" />
    </>
  );
}
