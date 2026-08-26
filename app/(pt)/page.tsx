import type { Metadata } from "next";
import { HomeContent } from "@/components/pages/HomeContent";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { buildTitle, meta } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "pt",
  pathPt: path("home", "pt"),
  pathEn: path("home", "en"),
  title: buildTitle(meta.defaultTitle.pt),
  description: meta.defaultDescription.pt,
});

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <HomeContent lang="pt" />
    </>
  );
}
