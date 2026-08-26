import type { Metadata } from "next";
import { AboutContent } from "@/components/pages/AboutContent";
import { about, buildTitle } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "pt",
  pathPt: path("about", "pt"),
  pathEn: path("about", "en"),
  title: buildTitle(about.title.pt),
  description: about.summary.pt,
});

export default function QuemSomosPage() {
  return <AboutContent lang="pt" />;
}
