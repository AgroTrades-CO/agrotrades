import type { Metadata } from "next";
import { buildTitle, notFoundContent } from "@/content";
import { siteIcons } from "@/content/seo";
import { fontVariables } from "./fonts";
import "./globals.css";

/**
 * Fallback de topo, fora de "(pt)" e "en". Sem app/layout.tsx partilhado,
 * este ficheiro é a rota interna "/_not-found", usada para caminhos que
 * nenhum dos dois grupos reconhece (ex.: "/xyz", e caminhos desconhecidos
 * sob "/en/...", incluindo serviços inexistentes em "/en/services/[slug]").
 *
 * O Next.js já envolve esta rota num <html><body> próprio. Por isso o
 * componente devolve só o conteúdo do corpo: tags <html>/<body> aqui dariam
 * dois <html> aninhados.
 *
 * Idioma: mostra sempre PT. Sem middleware não há forma fiável de saber o
 * caminho original para escolher PT/EN. Um catch-all em "app/en" resolveria
 * o idioma, mas um notFound() em runtime devolve uma página sem conteúdo
 * estático (Next.js 16), por isso foi descartado. As rotas fixas em inglês
 * usam app/en/not-found.tsx, com texto em inglês.
 */
export const metadata: Metadata = {
  title: buildTitle(notFoundContent.title.pt),
  robots: { index: false, follow: false },
  // Sem root layout próprio: repete o favicon dos dois layouts.
  icons: siteIcons,
};

export default function GlobalNotFound() {
  return (
    <div className={`page-hero ${fontVariables}`} style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div className="page-hero-content" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <span className="hero-tag">{notFoundContent.tag.pt}</span>
        <h1>{notFoundContent.title.pt}</h1>
        <p style={{ margin: "0 auto 28px" }}>{notFoundContent.text.pt}</p>
        {/* Esta rota não tem root layout próprio: ir para "/" muda de root
            layout e exige carregamento completo, por isso <a> e não <Link>. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="btn-primary" style={{ display: "inline-flex" }}>
          {notFoundContent.backHome.pt}
        </a>
      </div>
    </div>
  );
}
