import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailContent } from "@/components/pages/ServiceDetailContent";
import { buildTitle, services } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { serviceDetailPath } from "@/content/routes";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return services.map((service) => ({ id: service.id }));
}

// CORREÇÃO (handoff-10 do Tester): a lista de serviços é finita e
// conhecida em build-time (8 serviços em content/index.ts) — não há
// necessidade de negócio de suportar "ids" fora desta lista. Sem esta
// linha (dynamicParams volta ao valor implícito "true"), o Next.js 16
// tenta renderizar sob-demanda (em runtime) qualquer "id" desconhecido, e
// QUALQUER chamada a notFound() feita em runtime (confirmado com
// Turbopack e com Webpack, com generateStaticParams e sem, com
// dynamic="force-dynamic"/"force-static", com e sem User-Agent de bot)
// devolve uma "shell" cujo <body> só contém um placeholder de streaming
// — o conteúdo visível do 404 (heading, texto, botão) só existe dentro do
// payload RSC do <script>, nunca como HTML estático visível sem
// JavaScript. `dynamicParams = false` resolve este 404 em build-time
// (mesmo mecanismo, sem streaming, que já funciona para /servicos/arroz
// etc.), eliminando a shell. Ver NOTA no handoff sobre o efeito colateral
// desta decisão para o título/idioma deste caso específico.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const service = services.find((s) => s.id === id);
  if (!service) return {};
  return buildPageMetadata({
    lang: "pt",
    pathPt: serviceDetailPath(service.id, "pt"),
    pathEn: serviceDetailPath(service.id, "en"),
    title: buildTitle(service.title.pt),
    description: service.summary.pt,
  });
}

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const service = services.find((s) => s.id === id);
  if (!service) notFound();
  return <ServiceDetailContent service={service} lang="pt" />;
}
