import { createUploadGrant, destroyImage, listImages } from "@/lib/cloudinary/media";
import { tinaSessionIsValid } from "@/lib/tina/identity";

/**
 * Media do CMS na Cloudinary: listar, autorizar um upload e apagar.
 *
 * QUEM CHAMA: o gestor de media do admin da TinaCMS, através de
 * tina/media-store.ts. É esse ficheiro que lê a sessão da Tina Cloud do
 * `localStorage` (mesma origem que o /admin) e a envia aqui no cabeçalho
 * `Authorization`.
 *
 * AUTENTICAÇÃO (produção): o token é validado contra a Tina Cloud
 * (lib/tina/identity.ts), igual à entrada na pré-visualização. Sem isto, esta
 * rota era um endpoint de upload e de apagar aberto sobre a conta Cloudinary
 * da empresa. Em desenvolvimento não há login — o admin local fala com o
 * `tinacms dev` — e a verificação é saltada; a rota já só responde a pedidos
 * da própria origem.
 *
 * O FICHEIRO NÃO PASSA AQUI: o POST devolve só uma autorização assinada e o
 * browser carrega direto para a Cloudinary (ver lib/cloudinary/media.ts). O
 * `api_secret` nunca sai do servidor.
 */
export const dynamic = "force-dynamic";

/** O corpo só leva um `public_id`; mais do que isto é lixo. */
const MAX_BODY_BYTES = 512;

/** Página do gestor de media. A Cloudinary aceita até 500 por pedido. */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Resposta sem corpo nem detalhe: nada aqui ajuda quem está a sondar. */
const refuse = (status: number) => new Response(null, { status });

/** Erro com motivo, para o editor ver o que se passou no gestor de media. */
const problem = (status: number, reason: string) =>
  Response.json({ error: reason }, { status });

function bearerFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1].trim() : null;
}

/**
 * `null` quando o pedido pode seguir; um código HTTP quando não. A ordem é
 * deliberada: o filtro barato primeiro, a chamada à Tina Cloud só depois.
 */
async function authorize(request: Request): Promise<number | null> {
  // Não é autenticação (um script põe o cabeçalho que quiser); é o filtro que
  // evita o resto do trabalho.
  if (request.headers.get("sec-fetch-site") !== "same-origin") return 403;
  if (process.env.NODE_ENV === "development") return null;
  const token = bearerFrom(request);
  if (!token) return 401;
  if (!(await tinaSessionIsValid(token))) return 403;
  return null;
}

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

/** Lista as imagens do CMS. `?limit=` e `?cursor=` vêm do gestor de media. */
export async function GET(request: Request) {
  const denied = await authorize(request);
  if (denied) return refuse(denied);

  const params = new URL(request.url).searchParams;
  const rawLimit = Number(params.get("limit") ?? DEFAULT_LIMIT);
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
  const cursor = params.get("cursor") ?? undefined;

  const result = await listImages({ limit, cursor });
  if (!result.ok) return problem(result.status, result.reason);
  return Response.json({
    items: result.value.items,
    nextCursor: result.value.nextCursor ?? null,
  });
}

/**
 * Autorização de upload. Não leva corpo: o que o upload pode fazer está todo
 * fixado na assinatura, do lado do servidor.
 */
export async function POST(request: Request) {
  const denied = await authorize(request);
  if (denied) return refuse(denied);

  const grant = createUploadGrant();
  if (!grant.ok) return problem(grant.status, grant.reason);
  return Response.json(grant.value);
}

/** Apaga uma imagem do CMS. Corpo: `{ "publicId": "..." }`. */
export async function DELETE(request: Request) {
  const denied = await authorize(request);
  if (denied) return refuse(denied);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return refuse(415);

  const body = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (!body.ok) return refuse(400);
  let json: unknown;
  try {
    json = JSON.parse(body.text);
  } catch {
    return refuse(400);
  }
  const publicId =
    typeof json === "object" && json !== null ? (json as { publicId?: unknown }).publicId : null;
  if (typeof publicId !== "string" || publicId === "") return refuse(400);

  const result = await destroyImage(publicId);
  if (!result.ok) return problem(result.status, result.reason);
  return new Response(null, { status: 204 });
}
