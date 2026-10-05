"use client";

/**
 * Pré-visualização editável da página de um serviço (TinaCMS).
 * Reutiliza a MESMA vista do site (`ServiceDetailView`). Só usado pelas rotas
 * /editor-preview/servicos/[id] e /en/editor-preview/services/[slug].
 *
 * Regra das vistas: nenhum valor de @/content aqui — o
 * conteúdo publicado (serviços relacionados, textos comuns, contactos) e os
 * endereços PT/EN chegam por props, construídos no servidor.
 */
import { useTina } from "tinacms/dist/react";
import type { ServicoQuery, ServicoQueryVariables } from "@/tina/__generated__/types";
import type { Lang, Service } from "@/content";
import { ServiceDetailView, type ServiceDetailViewData } from "@/components/pages/ServiceDetailView";
import { PreviewLangSwitch } from "./PreviewLangSwitch";
import { hasImage, stripNulls, tf } from "./normalize";

type AnyRecord = Record<string, unknown>;

export function ServicePreview(props: {
  query: string;
  variables: ServicoQueryVariables;
  data: ServicoQuery;
  lang: Lang;
  /** Dados publicados do serviço e da página, construídos no servidor. */
  published: ServiceDetailViewData;
  hrefPt: string;
  hrefEn: string;
}) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const raw = stripNulls(data.servico) as unknown as AnyRecord & {
    serviceId: string;
    bannerImage?: string;
    sections?: (AnyRecord & { image?: { image?: string } })[];
    gallery?: (AnyRecord & { image?: string })[];
  };
  const published = props.published.service;

  const service = {
    ...raw,
    // O endereço vem da rota (ficheiro), não do valor em edição.
    id: published.id,
    // Imagem de topo apagada durante a edição: mostra a publicada.
    bannerImage: hasImage(raw.bannerImage) ? raw.bannerImage : published.bannerImage,
    // `visible` ausente = visível (default do schema Zod do site).
    galleryVisible: raw.galleryVisible !== false,
    // Secção com imagem ainda por escolher: mostra-se como cartão de texto.
    sections: raw.sections?.map((section) => ({
      ...section,
      visible: section.visible !== false,
      ...(section.image && !hasImage(section.image.image) ? { image: undefined } : {}),
    })),
    gallery: raw.gallery
      ?.filter((item) => hasImage(item.image))
      .map((item) => ({ ...item, visible: item.visible !== false })),
  } as unknown as Service;

  return (
    <>
      <ServiceDetailView lang={props.lang} data={{ ...props.published, service }} tf={tf} />
      <PreviewLangSwitch lang={props.lang} hrefPt={props.hrefPt} hrefEn={props.hrefEn} />
    </>
  );
}
