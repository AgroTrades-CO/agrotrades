import { organizationJsonLd } from "@/content/organization";

/**
 * Dados estruturados JSON-LD `Organization`, só na homepage (PT e EN).
 * Os valores vêm de `content/site/*.json`, editáveis na TinaCMS sem
 * restrição de caracteres. `JSON.stringify` não escapa `<`: um valor como
 * `</script><script>...` fecharia este bloco e injetaria um script inline
 * (a CSP permite 'unsafe-inline'). Por isso escapa-se `<` (e U+2028/U+2029)
 * antes de injetar; o resultado continua a ser JSON válido.
 */
const U2028 = String.fromCharCode(0x2028);
const U2029 = String.fromCharCode(0x2029);

function escapeJsonLd(json: string): string {
  return json
    .split("<")
    .join("\\u003c")
    .split(U2028)
    .join("\\u2028")
    .split(U2029)
    .join("\\u2029");
}

export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      // JSON-LD escapado por escapeJsonLd() acima antes de injetar.
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(organizationJsonLd)) }}
    />
  );
}
