/**
 * Ligação opcional "clicar para editar" da TinaCMS (task-017; vem do
 * protótipo da task-009).
 *
 * Os componentes de página aceitam uma função `tf` OPCIONAL que devolve o
 * valor do atributo `data-tina-field` de um elemento. Só as rotas de
 * pré-visualização (/editor-preview, /en/editor-preview) a passam.
 *
 * `tinaAttr` devolve `{}` sem `tf`: o elemento não recebe prop nenhuma (nem
 * `data-tina-field={undefined}`, que o React 19 serializa como "$undefined"
 * no payload RSC). Assim o HTML e o payload das páginas públicas ficam byte
 * a byte iguais (AC-1). Usar sempre como ÚLTIMO atributo do elemento, para
 * não mudar a ordem das props existentes.
 *
 * Este ficheiro não importa nada da Tina, para não pesar no site público.
 */
export type TinaFieldFn = (object: object, property?: string, index?: number) => string | undefined;

export type TinaAttr = { "data-tina-field"?: string };

export function tinaAttr(
  tf: TinaFieldFn | undefined,
  object: object,
  property?: string,
  index?: number
): TinaAttr {
  return tf ? { "data-tina-field": tf(object, property, index) } : {};
}
