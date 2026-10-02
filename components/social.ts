import type { SocialNetwork } from "@/content/schemas";
import { IconFacebook, IconInstagram } from "./icons";

/** Ícone e nome (marca, não traduzível) de cada rede social. */
export const SOCIAL_ICONS = {
  facebook: IconFacebook,
  instagram: IconInstagram,
} satisfies Record<SocialNetwork, typeof IconFacebook>;

export const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
} satisfies Record<SocialNetwork, string>;
