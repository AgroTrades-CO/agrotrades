/**
 * Pré-visualização editável da página de um serviço (PT) na TinaCMS.
 * Mesmas regras de app/(pt)/editor-preview/page.tsx. O ficheiro lido é
 * sempre um dos serviços conhecidos (nunca um caminho vindo do URL).
 */
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTinaClient } from "@/lib/tina/client";
import { ServicePreview } from "@/components/tina/ServicePreview";
import { services } from "@/content";
import { serviceEnSlug } from "@/content/service-slugs";
import { getServiceDetailViewData } from "@/lib/view-data/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pré-visualização — Serviço",
  robots: { index: false, follow: false },
};

export default async function EditorPreviewServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) notFound();
  const { id } = await params;
  const service = services.find((s) => s.id === id);
  if (!service) notFound();
  const result = await getTinaClient().queries.servico({ relativePath: `${service.id}.json` });
  return (
    <ServicePreview
      query={result.query}
      variables={result.variables}
      data={result.data}
      lang="pt"
      published={getServiceDetailViewData(service, "pt")}
      hrefPt={`/editor-preview/servicos/${service.id}`}
      hrefEn={`/en/editor-preview/services/${serviceEnSlug(service.id)}`}
    />
  );
}
