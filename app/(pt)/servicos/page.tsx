import type { Metadata } from "next";
import { ServicesListContent } from "@/components/pages/ServicesListContent";
import { buildTitle, servicesHeading, servicesPage } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "pt",
  pathPt: path("services", "pt"),
  pathEn: path("services", "en"),
  title: buildTitle(servicesHeading.title.pt),
  description: servicesPage.intro.pt,
});

export default function ServicosPage() {
  return <ServicesListContent lang="pt" />;
}
