/**
 * Ramo do GitHub que a TinaCMS lê e grava.
 *
 * Fonte única: `tina/config.tsx` (o que o admin grava) e `lib/tina/client.ts`
 * (o que a pré-visualização lê) têm de apontar ao MESMO ramo. Se divergirem, o
 * editor grava num sítio e vê outro, sem erro nenhum a avisar.
 *
 * Módulo sem dependências de propósito: é importado pela CLI da Tina ao
 * construir o admin e pelo servidor do Next.
 */
export const CONTENT_BRANCH = "content";
