import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailContent } from "@/components/pages/ServiceDetailContent";
import { buildTitle, products, productsPage } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path, productDetailPath } from "@/content/routes";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.id }));
}

// Ver app/(pt)/produtos/[id]/page.tsx.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.id === slug);
  if (!product) return {};
  return buildPageMetadata({
    lang: "en",
    pathPt: productDetailPath(product.id, "pt"),
    pathEn: productDetailPath(product.id, "en"),
    title: buildTitle(product.title.en),
    description: product.summary.en,
  });
}

export default async function ProductPageEn({ params }: { params: Params }) {
  const { slug } = await params;
  const product = products.find((p) => p.id === slug);
  if (!product) notFound();
  return (
    <ServiceDetailContent
      service={product}
      lang="en"
      back={{ href: path("products", "en"), label: productsPage.backToProducts }}
      showRelated={false}
    />
  );
}
