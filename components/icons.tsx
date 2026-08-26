import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Base wrapper so every icon shares the same stroke style. */
function Base({ children, ...props }: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Rice / wheat production. */
export function IconWheat(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 22V8" />
      <path d="M12 8c0-2.5-1.8-4-4-4 0 2.5 1.8 4 4 4Z" />
      <path d="M12 8c0-2.5 1.8-4 4-4 0 2.5-1.8 4-4 4Z" />
      <path d="M12 12c0-2.5-1.8-4-4-4 0 2.5 1.8 4 4 4Z" />
      <path d="M12 12c0-2.5 1.8-4 4-4 0 2.5-1.8 4-4 4Z" />
      <path d="M12 16c0-2.5-1.8-4-4-4 0 2.5 1.8 4 4 4Z" />
      <path d="M12 16c0-2.5 1.8-4 4-4 0 2.5-1.8 4-4 4Z" />
    </Base>
  );
}

/** Cereals and vegetables. */
export function IconCorn(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2c3.5 0 5 4 5 9s-1.5 11-5 11-5-6-5-11 1.5-9 5-9Z" />
      <path d="M8.5 7.5h7" />
      <path d="M8 11h8" />
      <path d="M8 14.5h8" />
      <path d="M8.7 18h6.6" />
    </Base>
  );
}

/** Agricultural mechanisation (tractor). */
export function IconTractor(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="2" />
      <path d="M7 17V9h3l3 4h3.5a1.5 1.5 0 0 1 1.5 1.5V17" />
      <path d="M10 9V5h2" />
      <path d="M13 13h4" />
    </Base>
  );
}

/** Milling / industrial processing. */
export function IconFactory(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 21V11l6 4v-4l6 4v-4l6 4v6H3Z" />
      <path d="M7 21v-4" />
      <path d="M12 21v-4" />
      <path d="M17 21v-4" />
    </Base>
  );
}

/** Land preparation. */
export function IconLandPlot(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 20h18" />
      <path d="M4 20c0-5 3-8 8-8s8 3 8 8" />
      <path d="M8 20c0-3 1.8-5 4-5s4 2 4 5" />
    </Base>
  );
}

/** Field technical support. */
export function IconSupport(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      <path d="M12 4.5V2" />
    </Base>
  );
}

/** Agricultural marketing (handshake). */
export function IconHandshake(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2 12l4-4 4 3 4-3 4 4" />
      <path d="M6 8v6l4 3 4-3V8" />
      <path d="M2 12l3 6" />
      <path d="M22 12l-3 6" />
    </Base>
  );
}

/** Campaign / calendar. */
export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Base>
  );
}

/** Location pin. */
export function IconMapPin(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.4" />
    </Base>
  );
}

/** Head office building. */
export function IconBuilding(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" />
    </Base>
  );
}

/** Farm / field (leaf). */
export function IconLeaf(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20c8 0 16-6 16-16-8 0-16 6-16 16Z" />
      <path d="M4 20c0-4 2-8 6-11" />
    </Base>
  );
}

/** Mission (target). */
export function IconTarget(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Vision (eye). */
export function IconEye(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  );
}

/** Innovation (lightning bolt). */
export function IconBolt(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />
    </Base>
  );
}

/** Excellence (trophy). */
export function IconTrophy(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 14v3" />
      <path d="M9 21h6" />
      <path d="M9.5 17.5h5l.6 3.5h-6.2l.6-3.5Z" />
    </Base>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </Base>
  );
}

/**
 * Chrome de navegação (não é conteúdo editável via CMS) — export solto, fora
 * do enum `iconName`/`icon-map.tsx`, por decisão do software-architect
 * (handoff-26, Fase 2). Convenção do projeto: ícones de conteúdo -> enum
 * `iconName` + `icon-map.tsx`; ícones estruturais de UI -> export solto.
 */
export function IconChevronDown(props: IconProps) {
  return (
    <Base width={12} height={12} {...props}>
      <path d="M5 8l7 8 7-8" />
    </Base>
  );
}

/** Setas de navegação do slider do hero (FR-1, design-spec-fase3 1.3). */
export function IconChevronLeft(props: IconProps) {
  return (
    <Base width={20} height={20} {...props}>
      <path d="M15 4l-8 8 8 8" />
    </Base>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Base width={20} height={20} {...props}>
      <path d="M9 4l8 8-8 8" />
    </Base>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="6" width="18" height="2" rx="1" />
      <rect x="3" y="11" width="18" height="2" rx="1" />
      <rect x="3" y="16" width="18" height="2" rx="1" />
    </svg>
  );
}

export function IconWhatsapp(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
