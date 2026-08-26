import type { SVGProps } from "react";
import type { IconName } from "@/content/schemas";
import {
  IconBolt,
  IconBuilding,
  IconCorn,
  IconEye,
  IconFactory,
  IconHandshake,
  IconLandPlot,
  IconLeaf,
  IconMapPin,
  IconSupport,
  IconTarget,
  IconTractor,
  IconTrophy,
  IconWheat,
} from "@/components/icons";
import { IconCalendar } from "@/components/icons";

type IconProps = SVGProps<SVGSVGElement>;

/** Mapa de nome de ícone (conteúdo) -> componente SVG (Fase 1). Nunca emoji. */
export const iconMap: Record<IconName, (props: IconProps) => React.JSX.Element> = {
  wheat: IconWheat,
  corn: IconCorn,
  tractor: IconTractor,
  factory: IconFactory,
  landPlot: IconLandPlot,
  support: IconSupport,
  handshake: IconHandshake,
  calendar: IconCalendar,
  mapPin: IconMapPin,
  building: IconBuilding,
  leaf: IconLeaf,
  target: IconTarget,
  eye: IconEye,
  bolt: IconBolt,
  trophy: IconTrophy,
};

export function Icon({ name, ...props }: { name: IconName } & IconProps) {
  const Component = iconMap[name];
  return <Component {...props} />;
}
