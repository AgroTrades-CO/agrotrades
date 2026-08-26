/**
 * Metadados por página e idioma — Fase 4 (SEO, hreflang, Open Graph).
 *
 * Centraliza a construção do objeto `Metadata` do Next.js para que cada
 * `page.tsx` só declare o que lhe é próprio (título, descrição, caminhos
 * PT/EN), sem repetir a estrutura de `canonical`/`alternates.languages`/
 * `openGraph`/`twitter` em cada ficheiro — e sem risco de uma página
 * esquecer um campo que outra tem (FR-12/AC-05).
 *
 * `metadataBase` (definido nos root layouts a partir de `meta.siteUrl`)
 * resolve os caminhos relativos usados aqui para URLs absolutos na saída
 * final; não é necessário construir URLs absolutos à mão neste ficheiro.
 */

import type { Metadata } from "next";
import type { Lang } from "./index";
import { meta } from "./index";

/**
 * Ícones do site (favicon + apple-touch-icon), centralizados aqui para que
 * os dois root layouts ("(pt)" e "en") e o fallback global `app/not-found.tsx`
 * usem exatamente o mesmo conjunto, sem repetir a lista em três sítios.
 *
 * Gerados a partir de `public/images/logo-square.png` (logótipo com fundo
 * removido, versão quadrada com padding). Substitui o `public/favicon.svg`
 * genérico herdado da variante AvaliacaoAgroTrades (Fase 4): esse SVG não
 * era a marca da AgroTrades, por isso foi removido de `public/` para não
 * haver dois favicons conflituosos — este conjunto de PNGs (+ `favicon.ico`
 * na raiz de `public/`, servido automaticamente pelo Next.js em
 * "/favicon.ico") é agora a única fonte de favicon do site.
 */
export const siteIcons: Metadata["icons"] = {
  icon: [
    { url: "/images/favicon-16.png", sizes: "16x16", type: "image/png" },
    { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
    { url: "/images/favicon-48.png", sizes: "48x48", type: "image/png" },
    { url: "/images/favicon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/images/favicon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: [{ url: "/images/favicon-180.png", sizes: "180x180", type: "image/png" }],
  shortcut: "/favicon.ico",
};

interface PageSeoInput {
  /** Idioma desta página (determina qual dos dois caminhos é o canonical). */
  lang: Lang;
  /** Caminho da versão PT desta página (ex.: "/servicos/arroz"). */
  pathPt: string;
  /** Caminho da versão EN desta página (ex.: "/en/services/rice"). */
  pathEn: string;
  /** Título já composto (normalmente via `buildTitle`). */
  title: string;
  description: string;
  /** `og:type` — "website" para todas as páginas institucionais atuais. */
  type?: "website" | "article";
}

/**
 * Constrói o `Metadata` completo de uma página: `title`, `description`,
 * `canonical` (a própria URL — FR-12), `alternates.languages` (hreflang
 * PT<->EN — D-4), `openGraph` e `twitter:card`, reutilizando
 * `meta.ogImage` (o logótipo existente — não há imagem dedicada, secção 4
 * do requirements.md).
 */
export function buildPageMetadata({
  lang,
  pathPt,
  pathEn,
  title,
  description,
  type = "website",
}: PageSeoInput): Metadata {
  const canonicalPath = lang === "pt" ? pathPt : pathEn;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        pt: pathPt,
        en: pathEn,
        // PT é o idioma por defeito, servido sem prefixo na raiz (D-4) —
        // é também o destino razoável de "x-default" para visitantes sem
        // preferência de idioma detetável pelo motor de busca.
        "x-default": pathPt,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type,
      siteName: meta.titleSuffix,
      locale: lang === "pt" ? "pt_MZ" : "en_US",
      images: [{ url: meta.ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [meta.ogImage],
    },
  };
}
