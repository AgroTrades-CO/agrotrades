/**
 * Pré-visualização editável da página inicial (EN) na TinaCMS.
 * Igual a app/(pt)/editor-preview/page.tsx, dentro do layout EN (cabeçalho e
 * rodapé em inglês).
 */
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTinaClient } from "@/lib/tina/client";
import { HomePreview } from "@/components/tina/HomePreview";
import { getHomeViewData } from "@/lib/view-data/home";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview — Home",
  robots: { index: false, follow: false },
};

export default async function EditorPreviewHomePageEn() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) notFound();
  const result = await getTinaClient().queries.homePreview();
  return (
    <HomePreview
      query={result.query}
      variables={result.variables}
      data={result.data}
      lang="en"
      published={getHomeViewData("en")}
    />
  );
}
