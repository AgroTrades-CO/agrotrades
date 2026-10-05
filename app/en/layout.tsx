import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SocialFloat } from "@/components/SocialFloat";
import { buildTitle, meta } from "@/content";
import { siteIcons } from "@/content/seo";
import { fontVariables } from "../fonts";
import "../globals.css";

// Root layout EN — "en" é uma pasta real (não um grupo de rotas), logo
// introduz o prefixo "/en" do idioma inglês. É um "root layout"
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
    <html lang="en" className={fontVariables}>
      <body>
        <Header lang="en" />
        {children}
        <Footer lang="en" />
        <SocialFloat />
      </body>
    </html>
  );
}
