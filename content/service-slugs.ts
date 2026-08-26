/**
 * Slugs em inglês para as páginas de serviço EN (Fase 3, decisão da tarefa:
 * `/en/services/rice/` em vez de `/en/services/arroz/`).
 *
 * Isto não é texto visível/traduzível gerido pelo Decap — é um identificador
 * de URL derivado do `id` do serviço, tal como o próprio `id` já é. Fica em
 * código, não em content/, pelo mesmo motivo por que o `id` também não é
 * "conteúdo": mudar aqui é uma decisão de routing, não uma edição de texto.
 */
export const SERVICE_EN_SLUGS: Record<string, string> = {
  arroz: "rice",
  cereais: "cereals",
  moageira: "milling",
  terras: "land-preparation",
  campanha: "campaign",
  mecanizacao: "mechanisation",
  "apoio-tecnico": "technical-support",
  comercializacao: "marketing",
};

/** Devolve o slug EN de um serviço, ou lança erro se não estiver mapeado. */
export function serviceEnSlug(id: string): string {
  const slug = SERVICE_EN_SLUGS[id];
  if (!slug) {
    throw new Error(
      `Serviço "${id}" não tem slug EN definido em content/service-slugs.ts — ` +
        `acrescente uma entrada antes de gerar rotas para este serviço.`
    );
  }
  return slug;
}

/** Devolve o `id` do serviço a partir do slug EN, ou undefined se não existir. */
export function serviceIdFromEnSlug(slug: string): string | undefined {
  const entry = Object.entries(SERVICE_EN_SLUGS).find(([, s]) => s === slug);
  return entry?.[0];
}
