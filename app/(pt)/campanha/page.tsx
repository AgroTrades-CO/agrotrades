import type { Metadata } from "next";
import { CampaignContent } from "@/components/pages/CampaignContent";
import { buildTitle, campanha } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "pt",
  pathPt: path("campaign", "pt"),
  pathEn: path("campaign", "en"),
  title: buildTitle(campanha.banner.title.pt),
  description: campanha.hero.intro.pt,
});

export default function CampanhaPage() {
  return <CampaignContent lang="pt" />;
}
