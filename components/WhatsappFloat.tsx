import { contacts } from "@/content";
import { IconWhatsapp } from "./icons";

export function WhatsappFloat() {
  return (
    <a
      href={contacts.whatsapp.url}
      target="_blank"
      rel="noopener"
      className="whatsapp-float"
      aria-label="WhatsApp"
    >
      <IconWhatsapp width={28} height={28} color="white" />
    </a>
  );
}
