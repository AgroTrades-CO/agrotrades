import "server-only";
import { createHash } from "node:crypto";
import {
  CLOUDINARY_FOLDER,
  CLOUDINARY_TAG,
  MAX_UPLOAD_BYTES,
  RASTER_ACCEPT,
  RASTER_EXTENSIONS,
} from "@/tina/media-formats";
import { readCloudinaryConfig } from "./env";

/**
 * Media da Cloudinary para o gestor de media da TinaCMS: autorização de
 * upload, listagem e apagar.
 *
 * SEM SDK: são três chamadas REST assinadas com `node:crypto` e `fetch`. O SDK
 * oficial arrasta dependências para fazer exatamente isto, e a regra do
 * projeto é não acrescentar dependências sem necessidade real.
 *
 * O UPLOAD NÃO PASSA POR AQUI. Este módulo só assina uma autorização; o
 * ficheiro vai do browser direto para a Cloudinary. Dois motivos:
 *   1. o corpo de um pedido a uma função da Vercel está limitado a 4,5 MB, e
 *      as fotos do cliente passam disso com facilidade;
 *   2. o ficheiro não atravessa o nosso servidor duas vezes.
 * O que o servidor mantém sob controlo são os parâmetros ASSINADOS — pasta,
 * tag, formatos aceites, nome único. O browser não os pode mudar sem
 * invalidar a assinatura, e é a Cloudinary que os aplica.
 *
 * O `api_secret` nunca sai deste módulo, nem para o log de erro: as mensagens
 * devolvidas nomeiam variáveis e estados, nunca valores.
 */

const API_ORIGIN = "https://api.cloudinary.com";

/** A Cloudinary pode estar lenta; nenhuma chamada fica à espera dela. */
const TIMEOUT_MS = 10_000;

/**
 * `public_id` aceitável. Vai para o caminho de um URL da API, por isso recusa
 * barras iniciais, `..` e tudo o que não seja nome de ficheiro ou de pasta.
 */
const PUBLIC_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;

/** Cursor de paginação devolvido pela Cloudinary. */
const CURSOR_PATTERN = /^[A-Za-z0-9_-]{1,512}$/;

export type Failure = { ok: false; status: number; reason: string };
export type Result<T> = { ok: true; value: T } | Failure;

const fail = (status: number, reason: string): Failure => ({ ok: false, status, reason });

/**
 * Assinatura da Cloudinary: sha1 dos parâmetros a assinar, ordenados por nome
 * e escritos em `k=v&k=v`, seguidos do `api_secret`. `api_key`, `signature`,
 * `resource_type`, `cloud_name` e o ficheiro ficam de fora.
 *
 * Igual ao `api_sign_request` do SDK oficial (cloudinary 2.11.0,
 * lib/utils/index.js), por partes:
 *   - valores vazios são descartados;
 *   - ordenação por `localeCompare`;
 *   - o `&` dentro de um valor vai como `%26` — é a "signature version 2",
 *     que impede que um valor finja ser dois parâmetros. Nenhum valor nosso
 *     leva `&`, mas o `public_id` vem de fora e a regra fica aplicada.
 */
function sign(params: Record<string, string>, apiSecret: string): string {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`.replace(/&/g, "%26"))
    .join("&");
  return createHash("sha1").update(`${canonical}${apiSecret}`, "utf8").digest("hex");
}

/** A Admin API autentica-se com `api_key:api_secret` em Basic. */
function basicAuth(apiKey: string, apiSecret: string): string {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

function configOrFailure() {
  const result = readCloudinaryConfig();
  if (!result.ok) {
    return { ok: false as const, failure: fail(503, `${result.variable}: ${result.reason}`) };
  }
  return { ok: true as const, config: result.config };
}

/** Pedido à API da Cloudinary, com timeout e JSON. Nunca registra credenciais. */
async function callApi(
  url: string,
  init: Omit<RequestInit, "signal" | "cache"> & { authorization: string }
): Promise<Result<unknown>> {
  const { authorization, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: { ...headers, Authorization: authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return fail(504, "a Cloudinary não respondeu");
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    // A Cloudinary devolve `{ error: { message } }`. A mensagem descreve o
    // pedido, não a conta, por isso pode subir até ao editor.
    const error =
      typeof body === "object" && body !== null
        ? (body as { error?: { message?: unknown } }).error
        : null;
    const message = typeof error?.message === "string" ? error.message : null;
    // Credenciais recusadas são falha nossa de configuração, não do editor.
    const status = response.status === 401 || response.status === 403 ? 502 : response.status;
    return fail(status, message ?? `a Cloudinary respondeu ${response.status}`);
  }
  return { ok: true, value: body };
}

/* -------------------------------------------------------------------------- */
/* Upload                                                                     */
/* -------------------------------------------------------------------------- */

export type UploadGrant = {
  /** Endpoint da Cloudinary a que o browser faz POST. */
  endpoint: string;
  /** Campos a enviar no `FormData`, além do ficheiro. */
  fields: Record<string, string>;
  /** Limite indicado ao editor antes de escolher o ficheiro. */
  maxBytes: number;
  /** `accept` do input de ficheiros. */
  accept: string;
};

/**
 * Autorização de um upload. Vai assinado o que o browser não pode poder mudar:
 *   - `allowed_formats`: a Cloudinary recusa qualquer outro formato, SVG
 *     incluído, e recusa-o depois de ler o ficheiro, não pelo nome;
 *   - `folder` e `tags`: o destino e a marca que torna o ficheiro visível ao
 *     gestor de media e apagável por ele;
 *   - `use_filename` + `unique_filename`: o nome do editor é mantido (depois
 *     de a Cloudinary o limpar) com um sufixo aleatório, por isso um upload
 *     nunca substitui um ficheiro já existente.
 */
export function createUploadGrant(): Result<UploadGrant> {
  const env = configOrFailure();
  if (!env.ok) return env.failure;
  const { cloudName, apiKey, apiSecret } = env.config;

  const signed: Record<string, string> = {
    allowed_formats: RASTER_EXTENSIONS.join(","),
    folder: CLOUDINARY_FOLDER,
    tags: CLOUDINARY_TAG,
    timestamp: String(Math.floor(Date.now() / 1000)),
    unique_filename: "true",
    use_filename: "true",
  };

  return {
    ok: true,
    value: {
      // `/image/upload` fixa o tipo de recurso: vídeo e `raw` não entram aqui.
      endpoint: `${API_ORIGIN}/v1_1/${cloudName}/image/upload`,
      fields: { ...signed, api_key: apiKey, signature: sign(signed, apiSecret) },
      maxBytes: MAX_UPLOAD_BYTES,
      accept: RASTER_ACCEPT,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Listagem                                                                   */
/* -------------------------------------------------------------------------- */

export type CloudinaryImage = {
  publicId: string;
  filename: string;
  format: string;
  secureUrl: string;
  bytes: number;
  width: number;
  height: number;
};

export type ImageList = { items: CloudinaryImage[]; nextCursor?: string };

function toImage(resource: unknown): CloudinaryImage | null {
  if (typeof resource !== "object" || resource === null) return null;
  const r = resource as Record<string, unknown>;
  const publicId = r.public_id;
  const format = r.format;
  const secureUrl = r.secure_url;
  if (typeof publicId !== "string" || typeof format !== "string") return null;
  if (typeof secureUrl !== "string" || !secureUrl.startsWith("https://")) return null;
  const base = publicId.slice(publicId.lastIndexOf("/") + 1);
  return {
    publicId,
    filename: `${base}.${format}`,
    format,
    secureUrl,
    bytes: typeof r.bytes === "number" ? r.bytes : 0,
    width: typeof r.width === "number" ? r.width : 0,
    height: typeof r.height === "number" ? r.height : 0,
  };
}

/**
 * Imagens do CMS, as mais recentes primeiro.
 *
 * Pela TAG, e não pela pasta nem pela Search API: a tag funciona nos dois
 * modos de pasta da Cloudinary (ver tina/media-formats.ts) e a Admin API é
 * imediatamente consistente — a Search API é um índice e pode levar um minuto
 * a mostrar o que acabou de ser carregado, o que dava um gestor de media a
 * "perder" o upload anterior.
 *
 * A Admin API tem limite de pedidos por hora (500 no plano gratuito). Cada
 * abertura do gestor de media e cada página gastam um.
 */
export async function listImages(options: {
  limit: number;
  cursor?: string;
}): Promise<Result<ImageList>> {
  const env = configOrFailure();
  if (!env.ok) return env.failure;
  const { cloudName, apiKey, apiSecret } = env.config;

  if (options.cursor !== undefined && !CURSOR_PATTERN.test(options.cursor)) {
    return fail(400, "cursor inválido");
  }

  const query = new URLSearchParams({ max_results: String(options.limit) });
  if (options.cursor) query.set("next_cursor", options.cursor);

  const url = `${API_ORIGIN}/v1_1/${cloudName}/resources/image/tags/${encodeURIComponent(
    CLOUDINARY_TAG
  )}?${query}`;
  const response = await callApi(url, {
    method: "GET",
    authorization: basicAuth(apiKey, apiSecret),
  });
  if (!response.ok) return response;

  const body = response.value as { resources?: unknown; next_cursor?: unknown } | null;
  const resources = Array.isArray(body?.resources) ? body.resources : [];
  const items = resources.map(toImage).filter((item): item is CloudinaryImage => item !== null);
  const nextCursor =
    typeof body?.next_cursor === "string" && CURSOR_PATTERN.test(body.next_cursor)
      ? body.next_cursor
      : undefined;
  return { ok: true, value: { items, nextCursor } };
}

/* -------------------------------------------------------------------------- */
/* Apagar                                                                     */
/* -------------------------------------------------------------------------- */

/** Caminho de um `public_id` no URL da API: as barras são separadores. */
function publicIdPath(publicId: string): string {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

/**
 * Apaga uma imagem do CMS.
 *
 * Confirma primeiro que a imagem TEM a tag do CMS. A conta da Cloudinary pode
 * guardar ficheiros que não vêm daqui e o botão de apagar do gestor de media
 * não lhes pode chegar. Custa um pedido extra à Admin API; apagar é raro.
 *
 * `invalidate=true` limpa também as cópias em cache no CDN; sem isso o URL
 * continuava a servir a imagem apagada durante dias.
 */
export async function destroyImage(publicId: string): Promise<Result<null>> {
  const env = configOrFailure();
  if (!env.ok) return env.failure;
  const { cloudName, apiKey, apiSecret } = env.config;

  if (publicId.length > 200 || !PUBLIC_ID_PATTERN.test(publicId)) {
    return fail(400, "public_id inválido");
  }

  const details = await callApi(
    `${API_ORIGIN}/v1_1/${cloudName}/resources/image/upload/${publicIdPath(publicId)}`,
    { method: "GET", authorization: basicAuth(apiKey, apiSecret) }
  );
  if (!details.ok) {
    return details.status === 404 ? fail(404, "imagem não encontrada") : details;
  }
  const tags = (details.value as { tags?: unknown } | null)?.tags;
  if (!Array.isArray(tags) || !tags.includes(CLOUDINARY_TAG)) {
    return fail(403, "esta imagem não foi carregada pelo CMS");
  }

  const signed: Record<string, string> = {
    invalidate: "true",
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const form = new URLSearchParams({
    ...signed,
    api_key: apiKey,
    signature: sign(signed, apiSecret),
  });

  const destroyed = await callApi(`${API_ORIGIN}/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    authorization: basicAuth(apiKey, apiSecret),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!destroyed.ok) return destroyed;

  const result = (destroyed.value as { result?: unknown } | null)?.result;
  if (result !== "ok" && result !== "not found") {
    return fail(502, typeof result === "string" ? result : "a Cloudinary não apagou a imagem");
  }
  return { ok: true, value: null };
}
