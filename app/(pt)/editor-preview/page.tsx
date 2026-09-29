/**
 * Pré-visualização editável da página inicial (PT) — TinaCMS, task-017
 * (architecture.md 5.2, SEC-T-08). Dentro do layout PT (cabeçalho e rodapé em
 * português). Sem Draft Mode dá 404 ANTES de qualquer pedido à Tina; nunca
 * indexável (robots aqui + X-Robots-Tag em next.config.mjs). Nenhuma página
 * pública importa este ficheiro nem nada da Tina.
 */
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTinaClient } from "@/lib/tina/client";
import { HomePreview } from "@/components/tina/HomePreview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pré-visualização — Página inicial",
  robots: { index: false, follow: false },
};

export default async function EditorPreviewHomePage() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) notFound();
  const result = await getTinaClient().queries.homePreview();
  return <HomePreview query={result.query} variables={result.variables} data={result.data} lang="pt" />;
}
