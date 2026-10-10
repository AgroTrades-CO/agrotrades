"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/content";
import { alternatePath } from "@/content/routes";
import { IconChevronDown, IconMenu } from "./icons";

/** Item simples do menu, já resolvido no idioma da página. */
export type HeaderNavLink = { href: string; label: string };

/** Dropdown "Serviços": rótulos e a grelha de serviços, na ordem canónica. */
export type HeaderServicesMenu = {
  label: string;
  viewAllLabel: string;
  /** Página de listagem — destino do "Ver todos" e base do estado activo. */
  href: string;
  items: { id: string; href: string; image: string; label: string }[];
};

/** Dados do cabeçalho, já resolvidos no servidor (lib/view-data/header.ts). */
export type HeaderViewData = {
  /** Destino do logótipo (a homepage existe sempre, mesmo sem item de menu). */
  homeHref: string;
  /** Item "Início" do menu, ou `null` se estiver oculto. */
  home: HeaderNavLink | null;
  /** Dropdown "Serviços", ou `null` se estiver oculto. */
  services: HeaderServicesMenu | null;
  /** Restantes itens, pela ordem do menu, já filtrados por `visible`. */
  links: HeaderNavLink[];
};

/**
 * Vista do cabeçalho: toda a interação (menu do telemóvel, dropdown de
 * serviços, navegação por teclado) vive aqui, mas o conteúdo entra por props e
 * deste módulo só sai o tipo `Lang` de @/content — por isso o Zod e os
 * ficheiros de `content/` não vão para o bundle de nenhuma página.
 *
 * O seletor de idioma precisa do caminho actual em tempo de execução, logo
 * `alternatePath` continua a correr no browser (`content/routes.ts` não
 * carrega conteúdo).
 */
export function HeaderView({ data, lang }: { data: HeaderViewData; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const pathname = usePathname() ?? data.homeHref;

  const servicesLiRef = useRef<HTMLLIElement>(null);
  const servicesTriggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const services = data.services;
  const servicesActive = services ? pathname.startsWith(services.href) : false;

  const otherLangHref = alternatePath(pathname, lang);

  const panelItems = (services?.items.length ?? 0) + 1; // serviços + "Ver todos os serviços"

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

  return (
    <nav>
      <Link href={data.homeHref} className="nav-logo">
        <Image src="/images/logo.png" alt="AGRO TRADES LDA" width={52} height={52} priority />
      </Link>

      {/* No telemóvel este invólucro é o painel do menu: a lista e o seletor de
          idioma empilham-se dentro dele, em vez de serem posicionados cada um
          por si. No ecrã grande tem `display: contents`, por isso desaparece da
          disposição e os dois filhos continuam a ser itens flex de <nav>. */}
      <div className={`nav-panel${open ? " open" : ""}`}>
        <ul className={`nav-links${open ? " open" : ""}`}>
          {data.home && (
            <li>
              <Link href={data.home.href} className={pathname === data.home.href ? "active" : undefined}>
                {data.home.label}
              </Link>
            </li>
          )}

          {services && (
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
              <span>{services.label}</span>
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
                {services.items.map((service, index) => (
                  <Link
                    key={service.id}
                    href={service.href}
                    className="nav-services-link"
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    onClick={closeServices}
                  >
                    <Image
                      src={service.image}
                      alt=""
                      width={36}
                      height={36}
                      className="nav-services-thumb"
                    />
                    <span>{service.label}</span>
                  </Link>
                ))}
              </div>
              <Link
                href={services.href}
                className="nav-services-viewall"
                ref={(el) => {
                  itemRefs.current[services.items.length] = el;
                }}
                onClick={closeServices}
              >
                {services.viewAllLabel} &rarr;
              </Link>
            </div>
          </li>
          )}

          {data.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "active" : undefined}
              >
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
      </div>

      <button
        type="button"
        className="nav-menu-btn"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => {
          // Fechar o menu hambúrguer principal reseta também a sublista de serviços,
          // para não reabrir já expandida da próxima vez.
          if (open) setServicesOpen(false);
          setOpen((v) => !v);
        }}
        style={{ display: open ? "flex" : undefined }}
      >
        <IconMenu width={22} height={22} />
      </button>
    </nav>
  );
}
