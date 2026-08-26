import { timingSafeEqual } from "node:crypto";

/**
 * Compara duas strings em tempo constante (restrições 30/32/33 da
 * arquitetura). `timingSafeEqual` do Node exige buffers do MESMO
 * comprimento — se os comprimentos diferirem, ainda corremos uma comparação
 * de duração equivalente contra um buffer do mesmo tamanho de `a` antes de
 * devolver `false`, para não vazar o comprimento de `b` por temporização.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    // Comparação "dummy" de duração semelhante, só para não devolver
    // instantaneamente em caso de comprimentos diferentes.
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
