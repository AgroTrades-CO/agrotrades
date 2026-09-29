"use client";

/**
 * Pré-visualização editável da página de um serviço (TinaCMS, task-017).
 * Reutiliza o MESMO componente do site (`ServiceDetailContent`). Só usado
 * pelas rotas /editor-preview/servicos/[id] e /en/editor-preview/services/[slug].
 */
import { useTina } from "tinacms/dist/react";
import type { ServicoQuery, ServicoQueryVariables } from "@/tina/__generated__/types";
import { ServiceDetailContent } from "@/components/pages/ServiceDetailContent";
import { services, type Lang, type Service } from "@/content";
import { serviceEnSlug } from "@/content/service-slugs";
import { PreviewLangSwitch } from "./PreviewLangSwitch";
import { hasImage, stripNulls, tf } from "./normalize";

type AnyRecord = Record<string, unknown>;

export function ServicePreview(props: {
  query: string;
  variables: ServicoQueryVariables;
  data: ServicoQuery;
  lang: Lang;
  /** Id do serviço (nome do ficheiro), validado pela rota. */
  id: string;
}) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const raw = stripNulls(data.servico) as unknown as AnyRecord & {
    serviceId: string;
    bannerImage?: string;
    sections?: (AnyRecord & { image?: { image?: string } })[];
    gallery?: (AnyRecord & { image?: string })[];
  };
  const published = services.find((s) => s.id === props.id);

  const service = {
    ...raw,
    // O endereço vem da rota (ficheiro), não do valor em edição.
    id: props.id,
    // Imagem de topo apagada durante a edição: mostra a publicada.
    bannerImage: hasImage(raw.bannerImage) ? raw.bannerImage : published?.bannerImage,
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
      <ServiceDetailContent service={service} lang={props.lang} tf={tf} />
      <PreviewLangSwitch
        lang={props.lang}
        hrefPt={`/editor-preview/servicos/${props.id}`}
        hrefEn={`/en/editor-preview/services/${serviceEnSlug(props.id)}`}
      />
    </>
  );
}
