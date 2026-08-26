"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav, services, type Lang } from "@/content";
import { alternatePath, path, serviceDetailPath } from "@/content/routes";
import { IconChevronDown, IconMenu } from "./icons";

export function Header({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const pathname = usePathname() ?? path("home", lang);

  const servicesLiRef = useRef<HTMLLIElement>(null);
  const servicesTriggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const servicesActive = pathname.startsWith(path("services", lang));

  const navLinksAfter = [
    { href: path("campaign", lang), label: nav.campaign[lang] },
    { href: path("contact", lang), label: nav.contact[lang] },
    { href: path("about", lang), label: nav.about[lang] },
  ];

  const otherLangHref = alternatePath(pathname, lang);

  const panelItems = services.length + 1; // 8 serviços + "Ver todos os serviços"

  function focusItem(index: number) {
    const clamped = (index + panelItems) % panelItems;
    itemRefs.current[clamped]?.focus();
  }

  function closeServices() {
    setServicesOpen(false);
  }

  // Fecha o dropdown (e devolve o foco ao gatilho) quando se clica fora do <li>.
  useEffect(() => {
    if (!servicesOpen) return;
    function onDocMouseDown(event: MouseEvent) {
      if (servicesLiRef.current && !servicesLiRef.current.contains(event.target as Node)) {
        closeServices();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [servicesOpen]);

  // Fechar o menu hambúrguer principal reseta também a sublista de serviços,
  // para não reabrir já expandida da próxima vez (design-spec-fase2 3b).
  useEffect(() => {
    if (!open) setServicesOpen(false);
  }, [open]);

  return (
    <nav>
      <Link href={path("home", lang)} className="nav-logo">
        <Image src="/images/logo.png" alt="AGRO TRADES LDA" width={52} height={52} priority />
      </Link>

      <ul className={`nav-links${open ? " open" : ""}`}>
        <li>
          <Link href={path("home", lang)} className={pathname === path("home", lang) ? "active" : undefined}>
            {nav.home[lang]}
          </Link>
        </li>

        <li
          className="nav-services-item"
          ref={servicesLiRef}
          onMouseEnter={() => setServicesOpen(true)}
          onMouseLeave={() => setServicesOpen(false)}
        >
          <button
            type="button"
            ref={servicesTriggerRef}
            className={`nav-services-trigger${servicesActive ? " active" : ""}`}
            aria-haspopup="true"
            aria-expanded={servicesOpen}
            aria-controls="services-dropdown"
            onClick={() => setServicesOpen((v) => !v)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setServicesOpen(true);
                focusItem(0);
              }
              if (event.key === "Escape" && servicesOpen) {
                closeServices();
              }
            }}
          >
            <span>{nav.services[lang]}</span>
            <IconChevronDown
              width={12}
              height={12}
              className="nav-services-chevron"
              style={{ transform: servicesOpen ? "rotate(180deg)" : undefined }}
              aria-hidden="true"
            />
          </button>

          <div
            id="services-dropdown"
            className={`nav-services-panel${servicesOpen ? " open" : ""}`}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeServices();
                servicesTriggerRef.current?.focus();
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                const current = itemRefs.current.findIndex((el) => el === document.activeElement);
                focusItem(current + 1);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                const current = itemRefs.current.findIndex((el) => el === document.activeElement);
                focusItem(current - 1);
              }
            }}
          >
            <div className="nav-services-grid">
              {services.map((service, index) => (
                <Link
                  key={service.id}
                  href={serviceDetailPath(service.id, lang)}
                  className="nav-services-link"
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={closeServices}
                >
                  <Image
                    src={service.bannerImage}
                    alt=""
                    width={36}
                    height={36}
                    className="nav-services-thumb"
                  />
                  <span>{service.title[lang]}</span>
                </Link>
              ))}
            </div>
            <Link
              href={path("services", lang)}
              className="nav-services-viewall"
              ref={(el) => {
                itemRefs.current[services.length] = el;
              }}
              onClick={closeServices}
            >
              {nav.servicesViewAll[lang]} &rarr;
            </Link>
          </div>
        </li>

        {navLinksAfter.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={pathname === link.href ? "active" : undefined}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Seletor de idioma: navegação para a página equivalente no outro
          idioma (nunca troca client-side), preservando a página atual. */}
      <div className={`lang-switcher${open ? " open" : ""}`}>
        {(["pt", "en"] as const).map((candidate) =>
          candidate === lang ? (
            <span key={candidate} className="lang-btn active" aria-current="true">
              {candidate.toUpperCase()}
            </span>
          ) : (
            <Link key={candidate} href={otherLangHref} className="lang-btn">
              {candidate.toUpperCase()}
            </Link>
          )
        )}
      </div>

      <button
        type="button"
        className="nav-menu-btn"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ display: open ? "flex" : undefined }}
      >
        <IconMenu width={22} height={22} />
      </button>
    </nav>
  );
}
