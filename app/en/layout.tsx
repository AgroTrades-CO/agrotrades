import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFloat } from "@/components/WhatsappFloat";
import { buildTitle, meta } from "@/content";
import { siteIcons } from "@/content/seo";
import "../globals.css";

// Root layout EN — "en" é uma pasta real (não um grupo de rotas), logo
// introduz o prefixo "/en" exigido pela decisão D-4. É um "root layout"
// próprio (padrão "multiple root layouts" do App Router), irmão do grupo
// "(pt)", para poder emitir <html lang="en">.
export const metadata: Metadata = {
  // Ver comentário equivalente em app/(pt)/layout.tsx.
  metadataBase: new URL(meta.siteUrl),
  title: buildTitle(meta.defaultTitle.en),
  description: meta.defaultDescription.en,
  // Ver comentário equivalente em app/(pt)/layout.tsx.
  icons: siteIcons,
};

export default function EnRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header lang="en" />
        {children}
        <Footer lang="en" />
        <WhatsappFloat />
      </body>
    </html>
  );
}
