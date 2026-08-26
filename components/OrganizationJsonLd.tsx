import { organizationJsonLd } from "@/content/organization";

/**
 * Dados estruturados JSON-LD `Organization` — só na homepage, PT e EN
 * (FR-12/AC-06). Os valores vêm de `content/site/contacts.json`,
 * `locations.json` e `meta.json`, que **são** input de utilizador desde a
 * Fase 5 (editáveis pelo Decap CMS, sem restrição de caracteres nos campos
 * de texto). `JSON.stringify` não escapa `<`, `>` nem `/`; um valor como
 * `</script><script>...` fecharia este bloco `ld+json` e injetaria um
 * `<script>` inline a executar sob a CSP `script-src 'self' 'unsafe-inline'`
 * (SEC-P5-11). Por isso escapamos explicitamente `<` (e, por segurança
 * adicional, U+2028/U+2029) antes de injetar — `<` continua a ser JSON
 * válido e o `ld+json` mantém-se legível pelos motores de busca.
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
      // eslint-disable-next-line react/no-danger -- JSON-LD escapado por escapeJsonLd() acima antes de injetar; ver comentário do módulo (SEC-P5-11).
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(organizationJsonLd)) }}
    />
  );
}
