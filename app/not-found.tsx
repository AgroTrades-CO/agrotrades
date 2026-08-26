import type { Metadata } from "next";
import { buildTitle, notFoundContent } from "@/content";
import { siteIcons } from "@/content/seo";
import "./globals.css";

/**
 * Fallback de topo, fora dos grupos "(pt)"/"en". Com múltiplos root
 * layouts (sem app/layout.tsx partilhado), este ficheiro é a rota interna
 * especial "/_not-found" do Next.js, para caminhos verdadeiramente não
 * correspondidos por nenhum grupo (ex.: "/xyz", que não é nem uma rota PT
 * nem "/en/..."; e também qualquer caminho sob "/en/..." que não
 * corresponda a nenhuma página conhecida — ver decisão de idioma abaixo).
 *
 * IMPORTANTE (correção do bug reportado no handoff-10 do Tester): esta
 * rota interna "/_not-found" já é envolvida automaticamente pelo Next.js
 * num <html><body> próprio (visto não haver app/layout.tsx partilhado que
 * o faça). Se este componente devolver também as suas próprias tags
 * <html>/<body>, o resultado são DOIS elementos <html> aninhados (HTML
 * inválido — <html> não pode ser filho de <body>), confirmado por curl a
 * /random-xyz antes desta correção. Por isso devolve-se aqui apenas o
 * conteúdo do corpo (sem <html>/<body> próprios), deixando o wrapper
 * automático do Next.js ser o único <html> da resposta.
 *
 * DECISÃO DE IDIOMA (documentada explicitamente, conforme pedido do
 * Tester no handoff-10): este fallback de topo mostra sempre texto em PT,
 * mesmo para caminhos sob "/en/...". Isto é uma decisão consciente, não
 * um esquecimento: sem middleware (fora do âmbito, por decisão de
 * arquitetura), não há forma fiável de inspecionar o pathname original
 * dentro deste componente para escolher PT/EN — o próprio Next.js já
 * decidiu, ao chegar aqui, que o caminho não pertence a nenhuma das duas
 * árvores de rotas conhecidas. Foi avaliada a alternativa de um
 * catch-all "app/en/[...catchAll]/page.tsx" que forçaria estes casos a
 * cair dentro da árvore "en" (mostrando texto em inglês corretamente) —
 * mas essa alternativa foi descartada porque reintroduz exatamente o
 * mesmo bug do ponto 1 desta ronda (corpo vazio sem JS): qualquer
 * chamada a notFound() feita em runtime (não resolvida em build-time)
 * devolve, no Next.js 16.3.2, uma "shell" sem conteúdo visível estático
 * (confirmado com Turbopack e Webpack). Manter PT aqui evita esse
 * regresso, ao custo de mostrar texto em PT para 404s genuinamente
 * desconhecidos sob "/en/...". Este cenário é raro na prática — a grande
 * maioria dos 404 nas páginas conhecidas em inglês é apanhada por
 * app/en/not-found.tsx (rotas fixas), com texto em inglês correto; e o
 * 404 do segmento dinâmico de serviço em inglês (id desconhecido em
 * "/en/services/[slug]") é resolvido em build-time via `dynamicParams =
 * false` nesse page.tsx — ver comentário lá — mas cai também neste
 * fallback de topo (mesma limitação: sem middleware não há como saber
 * que o pedido original era "/en/...").
 */
export const metadata: Metadata = {
  title: buildTitle(notFoundContent.title.pt),
  robots: { index: false, follow: false },
  // Esta rota especial "/_not-found" não tem um root layout próprio (ver
  // comentário acima) — repete-se aqui a mesma entrada de favicon dos dois
  // root layouts (centralizada em content/seo.ts) para não ficar sem ícone
  // neste caso específico.
  icons: siteIcons,
};

export default function GlobalNotFound() {
  return (
    <div className="page-hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div className="page-hero-content" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <span className="hero-tag">{notFoundContent.tag.pt}</span>
        <h1>{notFoundContent.title.pt}</h1>
        <p style={{ margin: "0 auto 28px" }}>{notFoundContent.text.pt}</p>
        <a href="/" className="btn-primary" style={{ display: "inline-flex" }}>
          {notFoundContent.backHome.pt}
        </a>
      </div>
    </div>
  );
}
