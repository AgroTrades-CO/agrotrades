import type { Metadata } from "next";
import { AboutContent } from "@/components/pages/AboutContent";
import { about, buildTitle } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "en",
  pathPt: path("about", "pt"),
  pathEn: path("about", "en"),
  title: buildTitle(about.title.en),
  description: about.summary.en,
});

export default function AboutPageEn() {
  return <AboutContent lang="en" />;
}
