/**
 * URL do embed do YouTube usado no slider do hero.
 *
 * Vive num módulo à parte, sem Zod e sem JSON, porque é a única coisa que o
 * `HeroSlider` (componente cliente) precisa do conteúdo. Se fosse importado
 * de `content/index.ts`, o browser receberia o Zod e todos os ficheiros de
 * `content/` em todas as páginas.
 */

/** Único sítio onde o URL do embed do YouTube é construído.
 *  `mute=1` é vinculativo — nunca construir este URL noutro sítio. */
export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    disablekb: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
