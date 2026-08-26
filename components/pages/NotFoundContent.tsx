import Link from "next/link";
import { notFoundContent, type Lang } from "@/content";
import { path } from "@/content/routes";

export function NotFoundContent({ lang }: { lang: Lang }) {
  return (
    <div className="page-hero" style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
      <div className="page-hero-content" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <span className="hero-tag">{notFoundContent.tag[lang]}</span>
        <h1>{notFoundContent.title[lang]}</h1>
        <p style={{ margin: "0 auto 28px" }}>{notFoundContent.text[lang]}</p>
        <Link href={path("home", lang)} className="btn-primary" style={{ display: "inline-flex" }}>
          {notFoundContent.backHome[lang]}
        </Link>
      </div>
    </div>
  );
}
