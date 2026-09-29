/**
 * Derivações puras sobre um serviço (task-017, A-12; architecture.md 18.1.2).
 *
 * Regra única de visibilidade e de layout das secções (handoff-34 secção
 * D.5): a filtragem por `visible`/`galleryVisible` e a resolução do layout
 * existem UMA VEZ aqui, nunca nos componentes. Proibido
 * `.filter(x => x.visible)` dentro de um componente.
 *
 * Este módulo corre também no browser (pré-visualização da TinaCMS, sobre os
 * dados em edição): só `import type`, nunca valores de ./schemas, ./index,
 * zod ou JSON — senão o bundle das páginas públicas muda (AC-15, R-VIEW).
 */
import type { Service, ServiceSection } from "./schemas";

/** Layout resolvido para apresentação — derivação única, sem duplicar a regra
 *  por componente (recomendação vinculativa do software-architect, handoff-26). */
export type ResolvedSectionLayout = "card" | "split" | "feature";

export function resolveSectionLayout(section: ServiceSection): ResolvedSectionLayout {
  if (!section.image) return "card";
  return section.layout ?? "split";
}

/** Secções do detalhe de serviço visíveis, na ordem do ficheiro. */
export function visibleSections(service: Service) {
  return (service.sections ?? []).filter((s) => s.visible);
}

/** Itens de galeria visíveis, só se o bloco galeria estiver ligado. */
export function visibleGallery(service: Service) {
  return service.galleryVisible ? (service.gallery ?? []).filter((i) => i.visible) : [];
}
