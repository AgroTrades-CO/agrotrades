import type { Metadata } from "next";
import { ContactContent } from "@/components/pages/ContactContent";
import { buildTitle, contacts } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "pt",
  pathPt: path("contact", "pt"),
  pathEn: path("contact", "en"),
  title: buildTitle(contacts.title.pt),
  description: contacts.intro.pt,
});

export default function ContactosPage() {
  return <ContactContent lang="pt" />;
}
