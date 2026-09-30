import type { Metadata } from "next";
import { ProductsListContent } from "@/components/pages/ProductsListContent";
import { buildTitle, productsPage } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "pt",
  pathPt: path("products", "pt"),
  pathEn: path("products", "en"),
  title: buildTitle(productsPage.sectionHeading.title.pt),
  description: productsPage.intro.pt,
});

export default function ProdutosPage() {
  return <ProductsListContent lang="pt" />;
}
