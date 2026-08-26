import type { Metadata } from "next";
import { HomeContent } from "@/components/pages/HomeContent";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { buildTitle, meta } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "en",
  pathPt: path("home", "pt"),
  pathEn: path("home", "en"),
  title: buildTitle(meta.defaultTitle.en),
  description: meta.defaultDescription.en,
});

export default function HomePageEn() {
  return (
    <>
      <OrganizationJsonLd />
      <HomeContent lang="en" />
    </>
  );
}
