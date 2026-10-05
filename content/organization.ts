/**
 * JSON-LD `Organization` — os dados de contacto vêm de
 * `content/site/contacts.json` (incluindo o campo "locations"), nunca
 * escritos à mão aqui.
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
  taxID: contacts.nuit,
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
