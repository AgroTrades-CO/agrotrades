/**
 * Pré-visualização editável da página inicial (EN) — TinaCMS, task-017.
 * Igual a app/(pt)/editor-preview/page.tsx, dentro do layout EN (cabeçalho e
 * rodapé em inglês, FR-3.4).
 */
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTinaClient } from "@/lib/tina/client";
import { HomePreview } from "@/components/tina/HomePreview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview — Home",
  robots: { index: false, follow: false },
};

export default async function EditorPreviewHomePageEn() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) notFound();
  const result = await getTinaClient().queries.homePreview();
  return <HomePreview query={result.query} variables={result.variables} data={result.data} lang="en" />;
}
