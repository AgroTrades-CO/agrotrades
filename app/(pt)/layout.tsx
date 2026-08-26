import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { buildTitle, meta } from "@/content";
import { siteIcons } from "@/content/seo";
import "../globals.css";

// Root layout PT (grupo de rotas "(pt)" — não introduz segmento na URL, logo
// estas páginas ficam na raiz do site: "/", "/servicos", etc., como exige
// a decisão D-4 da arquitetura (PT sem prefixo). É um "root layout" próprio
// (padrão "multiple root layouts" do App Router) porque só assim cada
// idioma pode emitir o seu próprio <html lang>.
export const metadata: Metadata = {
  // Resolve os caminhos relativos usados em `content/seo.ts` (canonical,
  // alternates.languages, og:url, og:image) para URLs absolutos (Fase 4).
  metadataBase: new URL(meta.siteUrl),
  title: buildTitle(meta.defaultTitle.pt),
  description: meta.defaultDescription.pt,
  // Favicon da AgroTrades (favicon.ico + PNGs gerados a partir do
  // logótipo), centralizado em `content/seo.ts` — substitui o
  // `public/favicon.svg` genérico herdado da Fase 4.
  icons: siteIcons,
};

export default function PtRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header lang="pt" />
        {children}
        <Footer lang="pt" />
        <WhatsappFloat />
      </body>
    </html>
  );
}
