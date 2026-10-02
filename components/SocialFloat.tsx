import { contacts, visibleSocialLinks } from "@/content";
import { SOCIAL_ICONS, SOCIAL_LABELS } from "./social";
import { IconWhatsapp } from "./icons";

export function SocialFloat() {
  return (
    <div className="social-float">
      <a
        href={contacts.whatsapp.url}
        target="_blank"
        rel="noopener"
        className="social-float-btn social-wa"
        aria-label="WhatsApp"
      >
        <IconWhatsapp width={22} height={22} />
      </a>
      {visibleSocialLinks.map(({ network, url }) => {
        const Icon = SOCIAL_ICONS[network];
        return (
          <a
            key={network}
            href={url}
            target="_blank"
            rel="noopener"
            className={`social-float-btn social-${network}`}
            aria-label={SOCIAL_LABELS[network]}
          >
            <Icon width={22} height={22} />
          </a>
        );
      })}
    </div>
  );
}
