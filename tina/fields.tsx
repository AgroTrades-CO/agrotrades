/**
 * Blocos de construção do schema TinaCMS.
 *
 * Regras:
 *   - cada campo traduzível é UM grupo com "Português" e "Inglês" empilhados
 *     (componente `BilingualField`), com validação PT/EN no próprio campo
 *     ("Preencha "X" em Inglês."), espelho do Zod de content/schemas — o
 *     build continua a ser a garantia final;
 *   - rótulos PT curtos + ajuda "Aparece em ...";
 *   - seletor de ícones com nomes PT, pela ordem por temas;
 *   - imagens só raster e só da pasta protegida (mediaRoot em config.tsx).
 *
 * Os NOMES dos campos são exatamente as chaves atuais dos ficheiros JSON em
 * content/ (formato {pt, en} inalterado). Só os rótulos mudam.
 *
 * Segurança: este ficheiro vai para o bundle do admin
 * (browser). Não importa nada de lib/, app/ nem lê process.env. Sem campos
 * `rich-text` (a superfície Plate da Tina fica inativa).
 */
import React from "react";
import { wrapFieldsWithMeta } from "tinacms";
import type { TinaField } from "tinacms";

type FieldOpts = { description?: string; required?: boolean; maxLength?: number };

// ── PT/EN empilhados, sem sub-painel ────────────────────────────────────────

type BilingualValue = { pt?: string; en?: string } | null | undefined;

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 12px",
  fontSize: 14,
  lineHeight: 1.4,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "white",
  color: "#1f2937",
  boxSizing: "border-box",
};

const subLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#4b5563",
  margin: "8px 0 4px",
};

function makeBilingualComponent(multiline: boolean) {
  const BilingualField = wrapFieldsWithMeta(({ input }) => {
    const value = (input.value || {}) as BilingualValue & object;
    const set = (lang: "pt" | "en", text: string) => input.onChange({ ...value, [lang]: text });
    const Tag = multiline ? "textarea" : "input";
    return (
      <div>
        {(["pt", "en"] as const).map((lang) => (
          <label key={lang} style={{ display: "block" }}>
            <span style={subLabelStyle}>{lang === "pt" ? "Português" : "Inglês"}</span>
            <Tag
              style={{ ...inputStyle, ...(multiline ? { minHeight: 90, resize: "vertical" } : {}) }}
              value={value?.[lang] ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                set(lang, e.target.value)
              }
            />
          </label>
        ))}
      </div>
    );
  });
  return BilingualField;
}

const BilingualLine = makeBilingualComponent(false);
const BilingualText = makeBilingualComponent(true);

function bilingualValidate(label: string, maxLength?: number) {
  return (value: BilingualValue) => {
    if (!value?.pt?.trim()) return `Preencha "${label}" em Português.`;
    if (!value?.en?.trim()) return `Preencha "${label}" em Inglês.`;
    if (maxLength && value.pt.trim().length > maxLength)
      return `"${label}" em Português não pode passar de ${maxLength} caracteres.`;
    if (maxLength && value.en.trim().length > maxLength)
      return `"${label}" em Inglês não pode passar de ${maxLength} caracteres.`;
    return undefined;
  };
}

/**
 * Sub-campo `pt`/`en`. Clicar num texto da pré-visualização abre estes
 * sub-campos diretamente (sem passar pelo `BilingualField` do objeto), por
 * isso a validação também vive aqui — senão "Save" gravaria um idioma vazio.
 */
function subCampo(lang: "pt" | "en", label: string, required: boolean, multiline: boolean, maxLength?: number) {
  const idioma = lang === "pt" ? "Português" : "Inglês";
  return {
    type: "string",
    name: lang,
    label: idioma,
    ui: {
      ...(multiline ? { component: "textarea" } : {}),
      ...(required
        ? {
            validate: (value: string | undefined) => {
              if (!value?.trim()) return `Preencha "${label}" em ${idioma}.`;
              if (maxLength && value.trim().length > maxLength)
                return `"${label}" em ${idioma} não pode passar de ${maxLength} caracteres.`;
              return undefined;
            },
          }
        : {}),
    },
  };
}

/** Texto curto traduzível `{ pt, en }`. */
export function bil(name: string, label: string, opts: FieldOpts = {}, multiline = false): TinaField {
  const required = opts.required ?? true;
  return {
    type: "object",
    name,
    label,
    description: opts.description,
    fields: [
      subCampo("pt", label, required, multiline, opts.maxLength),
      subCampo("en", label, required, multiline, opts.maxLength),
    ],
    ui: {
      component: BilingualLine,
      ...(required ? { validate: bilingualValidate(label, opts.maxLength) } : {}),
    },
    // O tipo de `ui.component` da Tina para objetos não prevê um componente
    // próprio que receba o objeto inteiro; em runtime é suportado.
  } as unknown as TinaField;
}

/** Texto longo traduzível `{ pt, en }` (caixa de várias linhas). */
export function bilText(name: string, label: string, opts: FieldOpts = {}): TinaField {
  const field = bil(name, label, opts, true) as TinaField & { ui: Record<string, unknown> };
  field.ui.component = BilingualText;
  return field;
}

/** Lista traduzível `{ pt: string[], en: string[] }` (duas listas, formato atual). */
export function bilList(name: string, label: string, opts: FieldOpts = {}): TinaField {
  return {
    type: "object",
    name,
    label,
    description:
      opts.description ??
      "Mesma ordem e mesmo número de pontos em Português e em Inglês.",
    fields: [
      { type: "string", name: "pt", label: "Português", list: true },
      { type: "string", name: "en", label: "Inglês", list: true },
    ],
  } as TinaField;
}

// ── Campos simples ──────────────────────────────────────────────────────────

/** Interruptor "Mostrar no site". */
export function visivel(name = "visible", label = "Mostrar no site", description?: string): TinaField {
  return { type: "boolean", name, label, description } as TinaField;
}

export function texto(name: string, label: string, opts: FieldOpts = {}): TinaField {
  return {
    type: "string",
    name,
    label,
    description: opts.description,
    required: opts.required ?? true,
  } as TinaField;
}

/** Campo técnico: mantém-se no ficheiro (a Tina só grava campos declarados)
 *  mas não aparece ao editor. */
export function oculto(name: string, label: string, description?: string): TinaField {
  return {
    type: "string",
    name,
    label,
    description,
    required: true,
    ui: { component: "hidden" },
  } as TinaField;
}

/**
 * Formatos que o editor pode carregar/escolher: só raster, os mesmos que o
 * `media-guard` aceita em public/images/uploads/. É só conforto do
 * editor — o controlo real continua a ser o `media-guard`.
 */
export const RASTER_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const;

export function imagem(name: string, label: string, description?: string): TinaField {
  return {
    type: "image",
    name,
    label,
    description,
    required: true,
    accept: [...RASTER_EXTENSIONS],
  } as TinaField;
}

/** Ícones com nomes PT, pela ordem por temas. */
export const ICON_OPTIONS = [
  { value: "wheat", label: "Espiga (arroz, cereais)" },
  { value: "corn", label: "Maçaroca de milho" },
  { value: "leaf", label: "Folha" },
  { value: "landPlot", label: "Terreno" },
  { value: "tractor", label: "Trator" },
  { value: "factory", label: "Fábrica" },
  { value: "support", label: "Pessoa (apoio, equipa)" },
  { value: "handshake", label: "Aperto de mão (parceria)" },
  { value: "building", label: "Edifício (escritório)" },
  { value: "mapPin", label: "Localização" },
  { value: "calendar", label: "Calendário" },
  { value: "target", label: "Alvo (missão)" },
  { value: "eye", label: "Olho (visão)" },
  { value: "bolt", label: "Raio (inovação, energia)" },
  { value: "trophy", label: "Troféu (excelência)" },
];

export function icone(name = "icon", label = "Ícone", opts: FieldOpts = {}): TinaField {
  return {
    type: "string",
    name,
    label,
    description: opts.description,
    required: opts.required ?? true,
    options: ICON_OPTIONS,
  } as TinaField;
}

/** Imagem + descrição traduzível (`{ image, alt: {pt, en} }`). */
export function imagemComDescricao(name: string, label: string, description?: string): TinaField {
  return {
    type: "object",
    name,
    label,
    description,
    fields: [
      imagem("image", "Imagem"),
      bil("alt", "Descrição da imagem", {
        description: "Para quem não vê a imagem (leitores de ecrã e Google).",
      }),
    ],
  } as TinaField;
}

/** Rótulo de item de lista a partir de um campo `{pt}` ou texto. */
export function rotulo(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object" && "pt" in value) {
    const pt = (value as { pt?: string }).pt;
    if (pt?.trim()) return pt;
  }
  return fallback;
}
