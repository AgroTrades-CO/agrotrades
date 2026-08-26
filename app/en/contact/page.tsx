import type { Metadata } from "next";
import { ContactContent } from "@/components/pages/ContactContent";
import { buildTitle, contacts } from "@/content";
import { buildPageMetadata } from "@/content/seo";
import { path } from "@/content/routes";

export const metadata: Metadata = buildPageMetadata({
  lang: "en",
  pathPt: path("contact", "pt"),
  pathEn: path("contact", "en"),
  title: buildTitle(contacts.title.en),
  description: contacts.intro.en,
});

export default function ContactPageEn() {
  return <ContactContent lang="en" />;
}
