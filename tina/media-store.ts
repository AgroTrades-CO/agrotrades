import { MediaListError } from "tinacms";
import type { Media, MediaList, MediaListOptions, MediaStore, MediaUploadOptions } from "tinacms";
import { CLOUDINARY_FOLDER, MAX_UPLOAD_BYTES, RASTER_ACCEPT } from "./media-formats";

/**
 * Gestor de media do admin da TinaCMS sobre a Cloudinary.
 *
 * Corre NO BROWSER, dentro do admin, e não tem credenciais nenhumas. Fala com
 * /api/cms-media (mesma origem que o /admin), que valida a sessão do editor
 * contra a Tina Cloud e assina o que for preciso.
 *
 * O UPLOAD vai daqui direto para a Cloudinary, com uma autorização assinada
 * pedida ao nosso servidor. O ficheiro não passa pela Vercel: um pedido a uma
 * função está limitado a 4,5 MB de corpo e as fotos do cliente passam disso.
 * A autorização fixa a pasta, a tag e os formatos aceites; nada disso é
 * decidido aqui.
 *
 * A sessão é lida do `localStorage` — possível porque o /admin é servido da
 * MESMA origem — e enviada no cabeçalho `Authorization`. É o mesmo mecanismo
 * da entrada na pré-visualização (components/tina/PreviewEntry.tsx). O token é
 * lido, enviado e esquecido: não fica em estado, nem em URL, nem na consola.
 *
 * Não importar nada de lib/ nem de app/: este ficheiro vai para o bundle do
 * admin.
 */

/** Chave do `localStorage` usada pelo admin (tinacms, `AUTH_TOKEN_KEY`). */
const AUTH_TOKEN_KEY = "tinacms-auth";

const ENDPOINT = "/api/cms-media";

/** Tamanhos que o gestor de media procura em `thumbnails`. */
const THUMBNAIL_SIZES = [75, 400, 1000] as const;

const UNAUTHORIZED = new MediaListError({
  title: "Sessão expirada",
  message: "Voltar a entrar no /admin e abrir o gestor de media outra vez.",
  docsLink: "/admin",
});

const UNAVAILABLE = new MediaListError({
  title: "Media indisponível",
  message: "Não foi possível falar com a Cloudinary. Tentar outra vez dentro de um minuto.",
  docsLink: "https://console.cloudinary.com/console/media_library",
});

type UploadGrant = {
  endpoint: string;
  fields: Record<string, string>;
  maxBytes: number;
  accept: string;
};

type ListedImage = {
  publicId: string;
  filename: string;
  secureUrl: string;
};

/** O admin usa `id_token ?? access_token` como bearer; aqui é igual. */
function readToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const tokens = parsed as { id_token?: unknown; access_token?: unknown };
    const token = typeof tokens.id_token === "string" ? tokens.id_token : tokens.access_token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    // Modo privado, armazenamento bloqueado ou JSON estragado.
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Miniatura por transformação no URL. `f_auto` e `q_auto` deixam a Cloudinary
 * escolher formato e compressão; `c_fill` recorta ao quadrado que o gestor de
 * media mostra. Cada tamanho novo gasta uma transformação na primeira vez e
 * fica em cache no CDN a partir daí.
 */
function thumbnail(secureUrl: string, size: number): string {
  return secureUrl.replace("/upload/", `/upload/c_fill,f_auto,q_auto,w_${size},h_${size}/`);
}

function toMedia(image: ListedImage): Media {
  return {
    type: "file",
    // O `id` é o que volta em `delete`: tem de ser o `public_id` da Cloudinary.
    id: image.publicId,
    filename: image.filename,
    directory: CLOUDINARY_FOLDER,
    src: image.secureUrl,
    thumbnails: Object.fromEntries(
      THUMBNAIL_SIZES.map((size) => [`${size}x${size}`, thumbnail(image.secureUrl, size)])
    ),
  };
}

/** Resposta da Cloudinary a um upload, reduzida ao que daqui interessa. */
function imageFromUpload(payload: unknown): ListedImage | null {
  if (typeof payload !== "object" || payload === null) return null;
  const asset = payload as Record<string, unknown>;
  const { public_id: publicId, format, secure_url: secureUrl } = asset;
  if (typeof publicId !== "string" || typeof format !== "string") return null;
  if (typeof secureUrl !== "string" || !secureUrl.startsWith("https://")) return null;
  return {
    publicId,
    filename: `${publicId.slice(publicId.lastIndexOf("/") + 1)}.${format}`,
    secureUrl,
  };
}

/** Mensagem de erro da nossa rota, quando traz uma. */
async function reasonFrom(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    const error = typeof body === "object" && body !== null ? (body as { error?: unknown }).error : null;
    return typeof error === "string" && error ? error : null;
  } catch {
    return null;
  }
}

export class CloudinaryMediaStore implements MediaStore {
  accept = RASTER_ACCEPT;

  /**
   * Limite mostrado ao editor e aplicado pelo gestor de media antes de
   * carregar. Não é um controlo de servidor: o upload vai direto para a
   * Cloudinary, que aplica os seus próprios limites de plano.
   */
  maxSize = MAX_UPLOAD_BYTES;

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    if (files.length === 0) return [];

    // Uma autorização serve os ficheiros deste lote: a assinatura cobre a
    // pasta, a tag e os formatos, não o ficheiro.
    const grant = await this.requestGrant();
    const uploaded: Media[] = [];

    for (const { file } of files) {
      const body = new FormData();
      for (const [key, value] of Object.entries(grant.fields)) body.append(key, value);
      body.append("file", file);

      const response = await fetch(grant.endpoint, { method: "POST", body });
      if (!response.ok) {
        const reason = await reasonFrom(response);
        throw new Error(
          reason
            ? `A Cloudinary recusou "${file.name}": ${reason}`
            : `A Cloudinary recusou "${file.name}".`
        );
      }
      const image = imageFromUpload(await response.json());
      if (!image) throw new Error(`Resposta inesperada da Cloudinary para "${file.name}".`);
      uploaded.push(toMedia(image));
    }

    return uploaded;
  }

  async delete(media: Media): Promise<void> {
    const response = await fetch(ENDPOINT, {
      method: "DELETE",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: media.id }),
    });
    if (!response.ok) {
      const reason = await reasonFrom(response);
      throw new Error(reason ?? `Não foi possível apagar "${media.filename}".`);
    }
  }

  async list(options?: MediaListOptions): Promise<MediaList> {
    const query = new URLSearchParams();
    if (options?.limit) query.set("limit", String(options.limit));
    // O primeiro pedido vem com `offset` 0 (número); as páginas seguintes
    // trazem o cursor que esta rota devolveu.
    if (typeof options?.offset === "string") query.set("cursor", options.offset);

    const response = await fetch(`${ENDPOINT}?${query}`, { headers: authHeaders() });
    if (response.status === 401 || response.status === 403) throw UNAUTHORIZED;
    if (!response.ok) throw UNAVAILABLE;

    let body: { items?: unknown; nextCursor?: unknown };
    try {
      body = (await response.json()) as typeof body;
    } catch {
      throw UNAVAILABLE;
    }
    const items = Array.isArray(body.items) ? (body.items as ListedImage[]) : [];
    return {
      items: items.map(toMedia),
      nextOffset: typeof body.nextCursor === "string" ? body.nextCursor : undefined,
    };
  }

  /** O valor gravado no campo é o URL da imagem, tal como vem da Cloudinary. */
  parse(media: Media): string {
    return media.src ?? "";
  }

  private async requestGrant(): Promise<UploadGrant> {
    const response = await fetch(ENDPOINT, { method: "POST", headers: authHeaders() });
    if (response.status === 401 || response.status === 403) {
      throw new Error("Sessão da TinaCMS expirada. Voltar a entrar no /admin.");
    }
    if (!response.ok) {
      const reason = await reasonFrom(response);
      throw new Error(reason ?? "Não foi possível autorizar o upload.");
    }
    const grant = (await response.json()) as Partial<UploadGrant>;
    if (!grant?.endpoint || !grant.fields) {
      throw new Error("Autorização de upload inválida.");
    }
    return grant as UploadGrant;
  }
}
