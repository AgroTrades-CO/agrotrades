import type { Metadata } from "next";
import { ProductsListContent } from "@/components/pages/ProductsListContent";
import { buildTitle, productsPage } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "en",
  pathPt: path("products", "pt"),
  pathEn: path("products", "en"),
  title: buildTitle(productsPage.sectionHeading.title.en),
  description: productsPage.intro.en,
});

export default function ProductsPageEn() {
  return <ProductsListContent lang="en" />;
}
