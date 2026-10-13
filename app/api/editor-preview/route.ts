import { draftMode } from "next/headers";
import { services } from "@/content";
import { serviceEnSlug, serviceIdFromEnSlug } from "@/content/service-slugs";
import { tinaSessionIsValid } from "@/lib/tina/identity";

/**
 * Entrada na pré-visualização da TinaCMS: liga o Draft Mode e diz à página de
 * entrada para onde navegar.
 *
 * QUEM CHAMA: a página /editor-preview/entrada, carregada no iframe do admin.
 * É ela que lê a sessão da Tina Cloud do `localStorage` (mesma origem que o
 * /admin) e a envia aqui no cabeçalho `Authorization`. Um pedido GET de
 * navegação não poderia levar esse cabeçalho; daí ser POST com uma página pelo
 * meio, em vez de um redirect direto.
 *
 * AUTENTICAÇÃO (produção): o token é validado contra a Tina Cloud
 * (lib/tina/identity.ts). Sem sessão válida não se liga o Draft Mode. Em
 * desenvolvimento não há login — o admin local fala com o `tinacms dev` — e a
 * verificação é saltada; a rota já só responde a pedidos da própria origem.
 *
 * O DESTINO é reconstruído a partir da lista de serviços conhecida, nunca
 * copiado do pedido (sem open redirect), e é o servidor que o devolve: a
 * página de entrada navega para o que vem daqui, não para o que recebeu.
 *
 * Porque é que o Draft Mode é merecedor de autenticação: faz o servidor
 * devolver conteúdo por publicar e renderizar cada pedido, em vez de servir a
 * página em cache.
 */
export const dynamic = "force-dynamic";

/** O corpo é `{ "target": "/..." }`; mais do que isto é lixo. */
const MAX_BODY_BYTES = 512;

type BodyResult = { ok: true; text: string } | { ok: false };

/** Lê o corpo com limite; nunca `request.json()` sem travão. */
async function readBodyWithLimit(request: Request, limit: number): Promise<BodyResult> {
  if (!request.body) return { ok: true, text: "" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel().catch(() => undefined);
        return { ok: false };
      }
      chunks.push(value);
    }
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(buffer) };
  } catch {
    return { ok: false };
  }
}

/** Caminho de pré-visualização conhecido, ou `null`. Nunca devolve o que entrou. */
function resolveTarget(path: unknown): string | null {
  if (typeof path !== "string") return null;
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

/** Resposta sem corpo nem detalhe: nada aqui ajuda quem está a sondar. */
const refuse = (status: number) => new Response(null, { status });

function bearerFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1].trim() : null;
}

export async function POST(request: Request) {
  // 1. Só da própria origem. Não é autenticação (um script põe o cabeçalho que
  //    quiser); é o filtro barato que evita o resto do trabalho.
  if (request.headers.get("sec-fetch-site") !== "same-origin") return refuse(403);

  // 2. Content-Type.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return refuse(415);

  // 3. Autenticação, antes de ler o corpo e antes de tocar no Draft Mode.
  if (process.env.NODE_ENV !== "development") {
    const token = bearerFrom(request);
    if (!token) return refuse(401);
    if (!(await tinaSessionIsValid(token))) return refuse(403);
  }

  // 4. Corpo.
  const body = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (!body.ok) return refuse(400);
  let json: unknown;
  try {
    json = JSON.parse(body.text);
  } catch {
    return refuse(400);
  }

  // 5. Destino.
  const destination = resolveTarget(
    typeof json === "object" && json !== null ? (json as { target?: unknown }).target : null
  );
  if (!destination) return refuse(404);

  (await draftMode()).enable();
  return Response.json({ destination });
}

/**
 * Sair da pré-visualização: apaga o cookie do Draft Mode. Sem ele o browser do
 * editor continuava a forçar renderização dinâmica nas rotas de
 * pré-visualização. Não precisa de token — desligar não dá acesso a nada.
 */
export async function DELETE(request: Request) {
  if (request.headers.get("sec-fetch-site") !== "same-origin") return refuse(403);
  (await draftMode()).disable();
  return new Response(null, { status: 204 });
}
