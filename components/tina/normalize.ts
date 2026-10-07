/**
 * Converte a resposta GraphQL da Tina para a forma que os componentes do
 * site já esperam (a mesma dos ficheiros JSON), SEM perder os metadados
 * `_content_source` que o `useTina` acrescenta (necessários ao clicar-para-
 * editar). Só usado nas rotas de pré-visualização.
 *
 * Diferenças tratadas:
 *   - a Tina devolve `null` para campos ausentes; o site espera `undefined`;
 *   - o `visible` ausente vem `null`; o site trata ausente como `true`;
 *   - o `id` do serviço chama-se `serviceId` no GraphQL (ver tina/collections.ts);
 *   - os slides do topo distinguem-se por `__typename` em vez da chave `type`;
 *   - enquanto se edita, uma imagem pode estar vazia: nunca se passa `src=""`
 *     ao next/image (dá erro) — o item é omitido na pré-visualização.
 */

import { tinaField } from "tinacms/dist/react";
import type { TinaFieldFn } from "@/components/tina/edit-binding";

type AnyRecord = Record<string, unknown>;

/** `tinaField` da Tina com a assinatura simples usada pelos componentes do site. */
export const tf: TinaFieldFn = (object, property, index) =>
  tinaField(object as AnyRecord, property as never, index);

export function stripNulls<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null).map((item) => stripNulls(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: AnyRecord = {};
    for (const [key, v] of Object.entries(value as AnyRecord)) {
      if (v === null) continue;
      out[key] = key === "_content_source" ? v : stripNulls(v);
    }
    return out as T;
  }
  return value;
}

export const isVisible = (item: { visible?: boolean | null }) => item.visible !== false;

export const hasImage = (path: unknown): path is string => typeof path === "string" && path.trim() !== "";

/** Slide do topo: repõe `type` a partir do `__typename` do template Tina. */
export function toHeroSlide(slide: AnyRecord): AnyRecord | null {
  const typename = String(slide.__typename ?? "");
  const type = typename.endsWith("Video") ? "video" : "image";
  const out: AnyRecord = { ...slide, type, visible: slide.visible !== false };
  if (type === "image" && !hasImage(out.image)) return null;
  if (type === "video" && !/^[A-Za-z0-9_-]{11}$/.test(String(out.youtubeId ?? ""))) return null;
  return out;
}
