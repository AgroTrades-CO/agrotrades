/**
 * JSON-LD `Organization` (Fase 4, FR-12/AC-06) — dados de contacto vindos
 * de `content/site/contacts.json` e `content/site/contacts.json (campo "locations")`, nunca
 * hardcoded aqui, conforme pedido. Corresponde ao bloco existente na
 * variante `AvaliacaoAgroTrades` (ver `index.html` dessa pasta), migrado
 * para dados estruturados em vez de JSON escrito à mão no HTML.
 */

import { contacts, locations, meta, visibleEmails, visiblePhones } from "./index";

const HEAD_OFFICE_ID = "escritorio";

const headOffice = locations.find((location) => location.id === HEAD_OFFICE_ID);

if (!headOffice) {
  throw new Error(
    `content/organization.ts: não encontrei a localização "${HEAD_OFFICE_ID}" em ` +
      `content/site/contacts.json (campo "locations") — necessária para o endereço do JSON-LD Organization.`
  );
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: contacts.ceo.company,
  url: meta.siteUrl,
  logo: `${meta.siteUrl}${meta.ogImage}`,
  telephone: visiblePhones[0]?.number ?? contacts.phones[0].number,
  email: visibleEmails[0]?.address ?? contacts.emails[0].address,
  address: {
    "@type": "PostalAddress",
    streetAddress: headOffice.address[0],
    addressLocality: headOffice.name,
    addressCountry: "MZ",
  },
} as const;
