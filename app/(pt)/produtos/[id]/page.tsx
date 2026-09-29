import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailContent } from "@/components/pages/ServiceDetailContent";
import { buildTitle, products, productsPage } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path, productDetailPath } from "@/content/routes";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

// Mesmo motivo que em app/(pt)/servicos/[id]/page.tsx: ids desconhecidos dão
// 404 estático no build, em vez de uma página vazia renderizada em runtime.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) return {};
  return buildPageMetadata({
    lang: "pt",
    pathPt: productDetailPath(product.id, "pt"),
    pathEn: productDetailPath(product.id, "en"),
    title: buildTitle(product.title.pt),
    description: product.summary.pt,
  });
}

export default async function ProdutoPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  return (
    <ServiceDetailContent
      service={product}
      lang="pt"
      back={{ href: path("products", "pt"), label: productsPage.backToProducts.pt }}
      showRelated={false}
    />
  );
}
