import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { services } from "@/content";
import { serviceEnSlug, serviceIdFromEnSlug } from "@/content/service-slugs";

/**
 * Entrada na pré-visualização da TinaCMS em MODO LOCAL (task-017, fase 3;
 * architecture.md secção 12: "rota de desenvolvimento só com
 * NODE_ENV=development"). O admin local (`npm run tina:dev`) abre
 * `/api/editor-preview/<caminho da pré-visualização>` no iframe (ex.:
 * `/api/editor-preview/editor-preview/servicos/arroz`): liga o Draft Mode e
 * redireciona para essa rota. O caminho vai no URL e não numa query string
 * porque o admin da Tina descarta a query string do URL do `router`.
 *
 * Fora de `next dev` responde sempre 404, sem ler o pedido. A entrada em
 * produção (POST com o token da Tina Cloud validado no servidor) é da fase 4
 * e passa por revisão própria de segurança.
 *
 * O destino do redirect é reconstruído a partir da lista de serviços
 * conhecida, nunca copiado do URL (sem open redirect).
 */
export const dynamic = "force-dynamic";

function resolveTarget(path: string): string | null {
  if (path === "/editor-preview" || path === "/en/editor-preview") return path;
  const pt = path.match(/^\/editor-preview\/servicos\/([a-z0-9-]+)$/);
  if (pt) {
    const service = services.find((s) => s.id === pt[1]);
    return service ? `/editor-preview/servicos/${service.id}` : null;
  }
  const en = path.match(/^\/en\/editor-preview\/services\/([a-z0-9-]+)$/);
  if (en) {
    const id = serviceIdFromEnSlug(en[1]);
    return id ? `/en/editor-preview/services/${serviceEnSlug(id)}` : null;
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ target?: string[] }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }
  // Só navegações da própria origem (iframe do admin) ou escritas à mão.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return new Response(null, { status: 403 });
  }
  const { target = [] } = await params;
  const destination = resolveTarget("/" + target.join("/"));
  if (!destination) {
    return new Response(null, { status: 404 });
  }
  (await draftMode()).enable();
  redirect(destination);
}
