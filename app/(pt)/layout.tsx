import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SocialFloat } from "@/components/SocialFloat";
import { buildTitle, meta } from "@/content";
import { siteIcons } from "@/content/seo";
import { fontVariables } from "../fonts";
import "../globals.css";

// Root layout PT (grupo de rotas "(pt)" — não introduz segmento na URL, logo
// estas páginas ficam na raiz do site: "/", "/servicos", etc., como exige
// a arquitetura do site (PT sem prefixo). É um "root layout" próprio
// (padrão "multiple root layouts" do App Router) porque só assim cada
// idioma pode emitir o seu próprio <html lang>.
export const metadata: Metadata = {
  // Resolve os caminhos relativos usados em `content/seo.ts` (canonical,
  // alternates.languages, og:url, og:image) para URLs absolutos.
  metadataBase: new URL(meta.siteUrl),
  title: buildTitle(meta.defaultTitle.pt),
  description: meta.defaultDescription.pt,
  // Favicon da AgroTrades (favicon.ico + PNGs gerados a partir do
  // logótipo), centralizado em `content/seo.ts` — substitui o
  // `public/favicon.svg` genérico que existia antes.
  icons: siteIcons,
};

export default function PtRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className={fontVariables}>
      <body>
        <Header lang="pt" />
        {children}
        <Footer lang="pt" />
        <SocialFloat />
      </body>
    </html>
  );
}
