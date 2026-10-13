import type { Metadata } from "next";
import { PreviewEntry } from "@/components/tina/PreviewEntry";

/**
 * Entrada na pré-visualização, aberta pelo admin da TinaCMS no iframe. É esta
 * a página para onde aponta o `router` das coleções
 * (`/editor-preview/entrada/<caminho da pré-visualização>`).
 *
 * O caminho vai em segmentos e não em query string porque o admin da Tina
 * descarta a query string do URL do `router`.
 *
 * Ao contrário das páginas de pré-visualização, esta NÃO exige Draft Mode — é
 * ela que o vai pedir. Também não lê conteúdo nenhum: só mostra uma linha de
 * estado enquanto o componente cliente trata do resto. Herda do grupo (pt) a
 * CSP com `frame-ancestors 'self'` e o `X-Robots-Tag: noindex, nofollow` de
 * `/editor-preview/:path*` (next.config.mjs).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pré-visualização",
  robots: { index: false, follow: false },
};

export default async function EditorPreviewEntryPage({
  params,
}: {
  params: Promise<{ target?: string[] }>;
}) {
  const { target = [] } = await params;
  // O caminho é passado tal e qual; quem decide se é válido é o servidor, em
  // /api/editor-preview, que o reconstrói a partir da lista de serviços.
  return <PreviewEntry target={"/" + target.join("/")} />;
}
