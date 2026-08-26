import type { Metadata } from "next";
import { NotFoundContent } from "@/components/pages/NotFoundContent";
import { buildTitle, notFoundContent } from "@/content";

export const metadata: Metadata = {
  title: buildTitle(notFoundContent.title.en),
  robots: { index: false, follow: false },
};

export default function NotFoundEn() {
  return <NotFoundContent lang="en" />;
}
