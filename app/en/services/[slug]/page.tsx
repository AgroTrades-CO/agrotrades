import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailContent } from "@/components/pages/ServiceDetailContent";
import { buildTitle, services } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { serviceDetailPath } from "@/content/routes";
import { SERVICE_EN_SLUGS, serviceIdFromEnSlug } from "@/content/service-slugs";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return Object.values(SERVICE_EN_SLUGS).map((slug) => ({ slug }));
}

// Ver comentário equivalente e detalhado em
// app/(pt)/servicos/[id]/page.tsx — mesma correção do bug reportado no
// handoff-10 do Tester (corpo vazio nos 404 desta rota dinâmica).
export const dynamicParams = false;

function findService(slug: string) {
  const id = serviceIdFromEnSlug(slug);
  return id ? services.find((s) => s.id === id) : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return {};
  return buildPageMetadata({
    lang: "en",
    pathPt: serviceDetailPath(service.id, "pt"),
    pathEn: serviceDetailPath(service.id, "en"),
    title: buildTitle(service.title.en),
    description: service.summary.en,
  });
}

export default async function ServiceDetailPageEn({ params }: { params: Params }) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) notFound();
  return <ServiceDetailContent service={service} lang="en" />;
}
