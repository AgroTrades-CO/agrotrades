import type { Metadata } from "next";
import { CampaignContent } from "@/components/pages/CampaignContent";
import { buildTitle, campanha } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "en",
  pathPt: path("campaign", "pt"),
  pathEn: path("campaign", "en"),
  title: buildTitle(campanha.banner.title.en),
  description: campanha.hero.intro.en,
});

export default function CampaignPageEn() {
  return <CampaignContent lang="en" />;
}
