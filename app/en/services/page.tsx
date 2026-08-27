import type { Metadata } from "next";
import { ServicesListContent } from "@/components/pages/ServicesListContent";
import { buildTitle, servicesHeading, servicesPage } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "en",
  pathPt: path("services", "pt"),
  pathEn: path("services", "en"),
  title: buildTitle(servicesHeading.title.en),
  description: servicesPage.intro.en,
});

export default function ServicesPageEn() {
  return <ServicesListContent lang="en" />;
}
