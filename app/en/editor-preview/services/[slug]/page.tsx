/**
 * Pré-visualização editável da página de um serviço (EN) — TinaCMS, task-017.
 * Mesmo endereço EN do site público (/en/services/<slug>), com o prefixo da
 * pré-visualização; mesmas regras de app/(pt)/editor-preview/page.tsx.
 */
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTinaClient } from "@/lib/tina/client";
import { ServicePreview } from "@/components/tina/ServicePreview";
import { services } from "@/content";
import { serviceEnSlug, serviceIdFromEnSlug } from "@/content/service-slugs";
import { getServiceDetailViewData } from "@/lib/view-data/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview — Service",
  robots: { index: false, follow: false },
};

export default async function EditorPreviewServicePageEn({ params }: { params: Promise<{ slug: string }> }) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) notFound();
  const { slug } = await params;
  const id = serviceIdFromEnSlug(slug);
  const service = id ? services.find((s) => s.id === id) : undefined;
  if (!service) notFound();
  const result = await getTinaClient().queries.servico({ relativePath: `${service.id}.json` });
  return (
    <ServicePreview
      query={result.query}
      variables={result.variables}
      data={result.data}
      lang="en"
      published={getServiceDetailViewData(service, "en")}
      hrefPt={`/editor-preview/servicos/${service.id}`}
      hrefEn={`/en/editor-preview/services/${serviceEnSlug(service.id)}`}
    />
  );
}
