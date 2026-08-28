import { z } from "zod";

/**
 * Todo o campo traduzível do site é um objeto { pt, en } no mesmo ficheiro
 * (nunca ficheiros/pastas paralelos por idioma) — restrição vinculativa da
 * arquitetura (architecture-proposal.md, secção 2.1 e 12.18).
 *
 * `pt` e `en` são ambos obrigatórios e não podem estar vazios: se faltar
 * uma tradução, o build falha aqui, de forma legível, antes de chegar a
 * produção (restrição 19).
 */
export const bilingualString = z.object({
  pt: z.string().trim().min(1, "o campo 'pt' é obrigatório e não pode estar vazio"),
  en: z.string().trim().min(1, "o campo 'en' é obrigatório e não pode estar vazio"),
});
export type BilingualString = z.infer<typeof bilingualString>;

export const bilingualStringList = z.object({
  pt: z.array(z.string().trim().min(1)).min(1, "a lista 'pt' precisa de pelo menos um item"),
  en: z.array(z.string().trim().min(1)).min(1, "a lista 'en' precisa de pelo menos um item"),
});
export type BilingualStringList = z.infer<typeof bilingualStringList>;

/**
 * URL absoluto restrito a `http:`/`https:` — reforço recomendado pelo
 * security-engineer (SEC-P5-11/SEC-P5-15): `z.string().url()` sozinho aceita
 * esquemas como `javascript:`/`data:`. Aplicado aos campos que alimentam
 * `href`/`src`/JSON-LD (`whatsapp.url`, `mapEmbedUrl`, `mapsLink`,
 * `meta.siteUrl`). Defesa em profundidade — a garantia principal contra XSS
 * continua a ser o escape no ponto de saída (`components/OrganizationJsonLd.tsx`),
 * não esta validação de schema.
 */
export const httpUrl = z
  .string()
  .trim()
  .url()
  .regex(/^https?:/, "tem de começar por http:// ou https://");

/**
 * Nomes de ícones SVG já existentes em components/icons.tsx (Fase 1).
 * Nunca emojis — restrição vinculativa (context.md, architecture-proposal.md secção 12).
 *
 * "target"/"eye"/"bolt"/"trophy" acrescentados no redesign (handoff-19) para
 * os 6 valores institucionais da página Quem Somos.
 */
export const iconName = z.enum([
  "wheat",
  "corn",
  "tractor",
  "factory",
  "landPlot",
  "support",
  "handshake",
  "calendar",
  "mapPin",
  "building",
  "leaf",
  "target",
  "eye",
  "bolt",
  "trophy",
]);
export type IconName = z.infer<typeof iconName>;

/**
 * Caminho de imagem local, root-relative a partir de public/ — mesmo padrão
 * já usado em team.foto e meta.ogImage. Bloqueia URLs externas (que exigiriam
 * alterar a CSP img-src, restrição vinculativa da Fase 4) e caminhos relativos.
 */
export const localImagePath = z
  .string()
  .trim()
  .regex(
    /^\/images\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(svg|jpg|jpeg|png|webp|gif|avif)$/,
    "o caminho tem de ser local e começar por '/images/' (ex.: '/images/services/arroz/banner.jpg'), com extensão svg/jpg/jpeg/png/webp/gif/avif — URLs externas não são permitidas (CSP img-src 'self')"
  )
  .refine((v) => !v.includes(".."), "o caminho não pode conter '..'");
export type LocalImagePath = z.infer<typeof localImagePath>;

/** Uma imagem de conteúdo: caminho local + alt obrigatório e traduzível. */
export const contentImageSchema = z.object({
  image: localImagePath,
  alt: bilingualString,
});
export type ContentImage = z.infer<typeof contentImageSchema>;

/**
 * Campo de visibilidade transversal (FR-6, design-spec-fase3 secção 4).
 * Convenção vinculativa desta arquitetura, a replicar em QUALQUER bloco
 * opcional futuro (AC-6.5):
 *   - item de uma coleção  -> campo `visible` DENTRO do item;
 *   - bloco inteiro cujo conteúdo é um array irmão -> campo `<bloco>Visible`
 *     no objeto que contém esse array (ex.: `galleryVisible`, `valuesVisible`).
 * Sempre boolean, sempre default `true`, sempre o PRIMEIRO campo do objeto
 * (para o Decap o mostrar no topo do formulário — design-spec 4).
 * `visible: false` => o bloco NÃO é renderizado (ausência total do DOM).
 * Nunca `display:none`, nunca placeholder.
 */
export const visibleFlag = z.boolean().default(true);

/** Variantes de layout de uma secção COM imagem. Sem imagem, a secção é sempre
 *  o cartão de texto (`.sd-section-card`) — por isso "card" não é um valor do enum. */
export const serviceSectionLayout = z.enum(["split", "feature"]);
export type ServiceSectionLayout = z.infer<typeof serviceSectionLayout>;

/** Bloco temático opcional da descrição de um serviço (redesign FR-2, estendido na Fase 2). */
export const serviceSectionSchema = z
  .object({
    /** "Secção visível" (FR-6.2, design-spec-fase3 secção 4). Primeiro campo
     *  do objeto por convenção. `visible: false` => secção ausente do DOM. */
    visible: visibleFlag,
    /** Ausente = usar o `icon` do próprio serviço (fallback do design-spec 2b).
     *  Ignorado na variante "feature" (decisão de UX, design-spec-fase2 1c). */
    icon: iconName.optional(),
    title: bilingualString,
    text: bilingualString,
    /** Imagem opcional da secção. Presente => a secção deixa de ser cartão e passa a
     *  "split" (default) ou "feature". `alt` é obrigatório (contentImageSchema). */
    image: contentImageSchema.optional(),
    /** Só permitido quando `image` está presente. Ausente com `image` presente => "split". */
    layout: serviceSectionLayout.optional(),
    /** Lista de bullets da secção. Só é lida quando `image` está presente. */
    bullets: bilingualStringList.optional(),
  })
  .superRefine((section, ctx) => {
    if (section.layout && !section.image) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["layout"],
        message:
          "'layout' só pode ser usado numa secção que tenha 'image'; sem imagem a secção é sempre o cartão de texto",
      });
    }
    if (section.bullets && !section.image) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bullets"],
        message:
          "'bullets' só é renderizado em secções com 'image' (split/feature); remova o campo ou acrescente uma imagem",
      });
    }
  });
export type ServiceSection = z.infer<typeof serviceSectionSchema>;

/** Layout resolvido para apresentação — derivação única, sem duplicar a regra
 *  por componente (recomendação vinculativa do software-architect, handoff-26). */
export type ResolvedSectionLayout = "card" | "split" | "feature";
export function resolveSectionLayout(section: ServiceSection): ResolvedSectionLayout {
  if (!section.image) return "card";
  return section.layout ?? "split";
}

// ── HERO SLIDER (FR-1) ─────────────────────────────────────────────────────

/** ID de vídeo do YouTube (11 caracteres). NUNCA um URL: o domínio e os
 *  parâmetros do embed são código, não conteúdo (handoff-34, VALIDATIONS 2). */
export const youtubeVideoId = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9_-]{11}$/,
    "indique apenas o ID do vídeo do YouTube (11 caracteres, a parte depois de 'v=' no URL), não o endereço completo"
  );

export const heroImageSlideSchema = z
  .object({
    visible: visibleFlag,
    type: z.literal("image"),
    image: localImagePath,
    alt: bilingualString,
  })
  .strict();

export const heroVideoSlideSchema = z
  .object({
    visible: visibleFlag,
    type: z.literal("video"),
    youtubeId: youtubeVideoId,
    /** Equivalente textual do vídeo (FR-1.4): usado como aria-label do iframe. */
    caption: bilingualString,
  })
  .strict();

export const heroSlideSchema = z.discriminatedUnion("type", [
  heroImageSlideSchema,
  heroVideoSlideSchema,
]);
export type HeroSlide = z.infer<typeof heroSlideSchema>;

export const heroSlidesSchema = z
  .array(heroSlideSchema)
  .min(1, "o slider do hero precisa de pelo menos um slide")
  .max(6, "o slider do hero aceita no máximo 6 slides")
  .refine(
    (slides) => slides.some((s) => s.visible),
    "pelo menos um slide do hero tem de estar visível — ligue 'Secção visível' em pelo menos um slide de content/site/home.json (Hero)"
  );

/** Único sítio onde o URL do embed do YouTube é construído (handoff-34,
 *  secção B). `mute=1` é vinculativo — nunca construir este URL noutro sítio. */
export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    disablekb: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

// ── SERVICES ──────────────────────────────────────────────────────────────

/** Item de galeria com visibilidade individual (FR-6.2). */
export const galleryImageSchema = contentImageSchema.extend({ visible: visibleFlag });
export type GalleryImage = z.infer<typeof galleryImageSchema>;

export const serviceSchema = z.object({
  id: z.string().trim().min(1),
  icon: iconName,
  title: bilingualString,
  summary: bilingualString,
  description: bilingualString,
  highlights: bilingualStringList,
  /**
   * Override opcional, só para o cartão de pré-visualização da homepage,
   * quando o texto/título exibidos aí historicamente é mais curto do que o
   * `title`/`summary` "canónicos" do serviço (usados nas páginas de detalhe
   * da Fase 3). Ausente = usar `title`/`summary`. Existe apenas para
   * preservar a paridade pixel-a-pixel exigida nesta fase sem duplicar
   * texto igual em dois campos.
   */
  homeTitle: bilingualString.optional(),
  homeBlurb: bilingualString.optional(),
  /** Imagem do hero do detalhe E capa do cartão em /servicos — mesmo campo, uma só fonte de verdade. */
  bannerImage: localImagePath,
  bannerImageAlt: bilingualString,
  /** Quando ausente/omisso, a página usa `description` como bloco único (fallback). */
  sections: z.array(serviceSectionSchema).min(1).max(6).optional(),
  /** Interruptor do bloco galeria inteiro (convenção `<bloco>Visible`). */
  galleryVisible: visibleFlag,
  /** Quando ausente/omisso, a secção de galeria não é renderizada de todo. */
  gallery: z.array(galleryImageSchema).min(1).max(6).optional(),
});
export type Service = z.infer<typeof serviceSchema>;

export const servicesSchema = z
  .array(serviceSchema)
  .length(8, "têm de existir exactamente 8 serviços (contagem exibida em stats.json)");

// ── NAV ───────────────────────────────────────────────────────────────────

/** Item de menu com visibilidade própria — usado tanto no cabeçalho como na
 *  coluna "Links" do rodapé (mesma fonte, para nunca dessincronizar). */
export const navItemSchema = z.object({
  visible: visibleFlag,
  pt: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

export const navSchema = z
  .object({
    home: navItemSchema,
    services: navItemSchema,
    campaign: navItemSchema,
    contact: navItemSchema,
    /** "Quem Somos" — conteúdo já preparado; a rota só é construída na Fase 3. */
    about: navItemSchema,
    /** Rótulo do último item do dropdown "Serviços" (desktop) e da sublista mobile (Fase 2).
     *  Não é um item de menu por si só — não tem `visible` próprio. */
    servicesViewAll: bilingualString,
  })
  .refine(
    (nav) => [nav.home, nav.services, nav.campaign, nav.contact, nav.about].some((item) => item.visible),
    "pelo menos um item do menu tem de estar visível — ligue 'Visível' em pelo menos um item de content/site/nav.json"
  );
export type Nav = z.infer<typeof navSchema>;
export type NavItem = z.infer<typeof navItemSchema>;

// ── HERO ──────────────────────────────────────────────────────────────────

export const heroSchema = z.object({
  tag: bilingualString,
  titleLine1: bilingualString,
  titleLine2: bilingualString,
  motto: bilingualString,
  text: bilingualString,
  buttons: z.object({
    whatsapp: bilingualString,
    services: bilingualString,
  }),
  /** Carrossel do fundo do hero (FR-1). O texto acima (tag/título/motto/
   *  botões) fica fixo por cima de todos os slides — não varia por slide. */
  slider: z.object({
    /** aria-label da região do carrossel (design-spec 1.5). */
    label: bilingualString,
    previousLabel: bilingualString,
    nextLabel: bilingualString,
    /** aria-label de cada indicador; TEM de conter "{n}", substituído pelo nº do slide. */
    goToSlideLabel: bilingualString.refine(
      (v) => v.pt.includes("{n}") && v.en.includes("{n}"),
      "'goToSlideLabel' tem de conter '{n}' em 'pt' e 'en' (ex.: 'Ir para o slide {n}')"
    ),
    slides: heroSlidesSchema,
  }),
});
export type Hero = z.infer<typeof heroSchema>;

// ── STATS ─────────────────────────────────────────────────────────────────


export const statItemSchema = z.object({
  visible: visibleFlag,
  /** "2+", "∞", "8", "MZ" — não é texto traduzível, fica como está. */
  value: z.string().trim().min(1),
  label: bilingualString,
});
export type StatItem = z.infer<typeof statItemSchema>;

export const statsSchema = z
  .array(statItemSchema)
  .length(4, "têm de existir exactamente 4 estatísticas na stats-bar");

// ── ABOUT (expandida para a futura página "Quem Somos") ────────────────────

export const aboutTagSchema = z.object({
  visible: visibleFlag,
  icon: iconName,
  label: bilingualString,
});

/** Parágrafo individual de `about.fullText` (FR-6.2 estendido): `visible` por
 *  parágrafo, `pt`/`en` sempre emparelhados no mesmo item (não duas listas
 *  paralelas) para nunca desalinhar as traduções ao ativar/desativar. */
export const paragraphSchema = z.object({
  visible: visibleFlag,
  pt: z.string().trim().min(1),
  en: z.string().trim().min(1),
});
export type Paragraph = z.infer<typeof paragraphSchema>;

/**
 * Campos de "about" partilhados por duas páginas reais (Homepage e "Quem
 * Somos") — fisicamente vivem em content/site/quemSomos.json (entrada
 * "Quem Somos" do admin) e a Homepage lê os mesmos valores à distância
 * (nunca duplicados; ver plano "Uma entrada no admin por página real").
 */
export const aboutSchema = z.object({
  tag: bilingualString,
  title: bilingualString,
  /**
   * Parágrafo curto mostrado hoje na homepage (about_p). Reutilizado também
   * na intro do hero da página "Quem Somos" (AboutContent) — por isso NÃO
   * tem `visible` próprio (desativar na homepage apagaria a intro da outra
   * página); ver plano de implementação, secção "excluído".
   */
  summary: bilingualString,
  /**
   * Texto institucional completo para a página "Quem Somos". Cada parágrafo
   * tem o seu próprio `visible` (convenção de item de lista).
   */
  fullText: z.array(paragraphSchema).min(1),
  tags: z.array(aboutTagSchema).min(1),
});
export type About = z.infer<typeof aboutSchema>;

/**
 * Campos de "about" exclusivos da Homepage — segundo parágrafo, CEO e
 * "Saber mais" (não aparecem em "Quem Somos"). Vivem em
 * content/site/home.json, entrada "Homepage" do admin.
 */
export const homeAboutSchema = z.object({
  /** Segundo parágrafo mostrado hoje na homepage (about_p2). Só usado aqui. */
  extended: z.object({
    visible: visibleFlag,
    pt: z.string().trim().min(1),
    en: z.string().trim().min(1),
  }),
  ceo: z.object({
    visible: visibleFlag,
    name: z.string().trim().min(1),
    initials: z.string().trim().min(1),
    role: bilingualString,
  }),
  /**
   * Rótulo do link "Saber mais" da secção "Sobre a empresa" da homepage,
   * que aponta para a página "Quem Somos" (Fase 3). O destino em si é
   * calculado por idioma em content/routes.ts (path("about", lang)), não
   * aqui, para não duplicar URLs traduzidas fora do routing central.
   */
  learnMoreLabel: bilingualString,
});
export type HomeAbout = z.infer<typeof homeAboutSchema>;

// ── HOMEPAGE (entrada única "Homepage" do admin — hero + stats + cabeçalho
//    de localizações + parte exclusiva de "about") ─────────────────────────

export const homeSchema = z.object({
  hero: heroSchema,
  stats: z.object({ items: statsSchema }),
  /** Só o título/etiqueta — as localizações em si vivem em "Contactos". */
  locationsHeading: z.object({ tag: bilingualString, title: bilingualString }),
  about: homeAboutSchema,
});
export type Home = z.infer<typeof homeSchema>;

// ── TEAM (nova, para a futura página "Quem Somos") ─────────────────────────

export const teamMemberSchema = z.object({
  visible: visibleFlag,
  /** Nome próprio — não é campo traduzível. */
  nome: z.string().trim().min(1),
  cargo: bilingualString,
  /** Caminho para a foto — caminho local root-relative (mesmo padrão de localImagePath). */
  foto: localImagePath,
  /** Bio curta, usada nos cartões do grid (mantém-se; itálico, .team-quote). */
  frase: bilingualString.optional(),
  /** Bio longa, usada no cartão destacado (primeiro membro). Opcional: placeholders atuais não a têm. */
  bio: bilingualString.optional(),
  /** Badges de especialidade (.about-tag). Traduzíveis, para consistência com o resto do schema. */
  badges: z.array(bilingualString).min(1).max(5).optional(),
  /** Contactos opcionais — só aparecem no cartão se preenchidos no admin. */
  phone: z.string().trim().min(1).optional(),
  whatsapp: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamSchema = z
  .array(teamMemberSchema)
  .min(1, "a equipa precisa de pelo menos um membro (o primeiro é o cartão destacado)");

// ── CAMPANHA (banner da homepage + conteúdo da futura página /campanha) ────

export const pillarSchema = z.object({
  visible: visibleFlag,
  icon: iconName,
  title: bilingualString,
  text: bilingualString,
});

export const timelineItemSchema = z.object({
  visible: visibleFlag,
  title: bilingualString,
  text: bilingualString,
});

export const campanhaSchema = z.object({
  /**
   * Banner exibido hoje na homepage. `title` é reutilizado no hero da
   * própria página /campanha (CampaignContent) — por isso este bloco NÃO
   * tem `visible` próprio (ver plano de implementação, secção "excluído").
   */
  banner: z.object({
    tag: bilingualString,
    title: bilingualString,
    text: bilingualString,
    button: bilingualString,
  }),
  /** Conteúdo exclusivo da futura página /campanha (Fase 3). */
  hero: z.object({
    /** "2025 / 2026" — rótulo de período, não é texto traduzível. */
    tag: z.string().trim().min(1),
    intro: bilingualString,
    /** Banner de imagem do topo da página (FR-2), mesmo par já usado em
     *  serviceSchema — obrigatório, sem toggle (handoff-34, VALIDATIONS 4). */
    bannerImage: localImagePath,
    bannerImageAlt: bilingualString,
  }),
  /**
   * `author` é reutilizado na homepage (HomeContent) e na página /campanha
   * (CampaignContent) — por isso este bloco também NÃO tem `visible` próprio.
   */
  quote: z.object({
    /** Nome/título do autor da citação — não é campo traduzível. */
    author: z.string().trim().min(1),
    citeSuffix: bilingualString,
  }),
  /** Só usado na página /campanha — seguro ter `visible` próprio. */
  vision: z.object({
    visible: visibleFlag,
    tag: bilingualString,
    title: bilingualString,
    text: bilingualString,
  }),
  pillars: z.array(pillarSchema).min(1),
  timelineHeading: z.object({
    tag: bilingualString,
    title: bilingualString,
  }),
  /** Interruptor do bloco timeline inteiro (cabeçalho + lista), convenção
   *  `<bloco>Visible` — `timelineHeading` e `timeline` são irmãos aqui. */
  timelineVisible: visibleFlag,
  timeline: z.array(timelineItemSchema).min(1),
  /** Só usado na página /campanha — seguro ter `visible` próprio. */
  cta: z.object({
    visible: visibleFlag,
    title: bilingualString,
    text: bilingualString,
    button: bilingualString,
  }),
});
export type Campanha = z.infer<typeof campanhaSchema>;

// ── LOCATIONS ────────────────────────────────────────────────────────────

export const locationSchema = z.object({
  visible: visibleFlag,
  id: z.string().trim().min(1),
  icon: iconName,
  type: bilingualString,
  /** Nome de lugar — não é campo traduzível. */
  name: z.string().trim().min(1),
  /** Linhas de endereço — endereços/nomes próprios, não traduzíveis. */
  address: z.array(z.string().trim().min(1)).min(1),
});
export type Location = z.infer<typeof locationSchema>;

export const locationsSchema = z.array(locationSchema).min(1);

// ── CONTACTS ─────────────────────────────────────────────────────────────

/** Telefone individual com visibilidade própria (convenção de item de lista). */
export const phoneEntrySchema = z.object({
  visible: visibleFlag,
  number: z.string().trim().min(1),
});
export type PhoneEntry = z.infer<typeof phoneEntrySchema>;

/** Email individual com visibilidade própria (convenção de item de lista). */
export const emailEntrySchema = z.object({
  visible: visibleFlag,
  address: z.string().trim().email(),
});
export type EmailEntry = z.infer<typeof emailEntrySchema>;

export const contactsSchema = z.object({
  tag: bilingualString,
  title: bilingualString,
  intro: bilingualString,
  /** Banner de imagem do topo da página (FR-2) — obrigatório, sem toggle. */
  bannerImage: localImagePath,
  bannerImageAlt: bilingualString,
  whatsapp: z.object({
    number: z.string().trim().min(1),
    url: httpUrl,
    label: bilingualString,
  }),
  /** Título do bloco de telefones na página de contactos (ex. "Telefone / WhatsApp"). */
  phoneLabel: bilingualString,
  /** Título do bloco de emails na página de contactos. */
  emailLabel: bilingualString,
  phones: z.array(phoneEntrySchema).min(1),
  emails: z.array(emailEntrySchema).min(1),
  mapEmbedUrl: httpUrl,
  mapsLink: httpUrl,
  ceo: z.object({
    visible: visibleFlag,
    name: z.string().trim().min(1),
    initials: z.string().trim().min(1),
    role: bilingualString,
    company: z.string().trim().min(1),
  }),
  /** Também mostradas na Homepage — vivem aqui porque "Contactos" é a página
   *  onde faz mais sentido editá-las (ver plano "uma entrada por página"). */
  locations: locationsSchema,
  /** Formulário de contacto (envia email via Resend, app/api/contact/route.ts).
   *  `visible: false` esconde o formulário do site E faz a rota recusar
   *  submissões diretas — nunca só um `display:none`. */
  contactForm: z.object({
    visible: visibleFlag,
    recipientEmail: z.string().trim().email(),
    heading: bilingualString,
    nameLabel: bilingualString,
    emailLabel: bilingualString,
    phoneLabel: bilingualString,
    subjectLabel: bilingualString,
    messageLabel: bilingualString,
    submitLabel: bilingualString,
    successMessage: bilingualString,
    errorMessage: bilingualString,
  }),
});
export type Contacts = z.infer<typeof contactsSchema>;

// ── FOOTER ───────────────────────────────────────────────────────────────

/** Referência a um serviço real (coleção `services`) na lista "Serviços" do
 *  rodapé. O rótulo vem sempre do próprio serviço (`homeTitle`/`title`) —
 *  este item só guarda qual serviço mostrar, a ordem e a visibilidade. */
export const footerServiceLinkSchema = z.object({
  visible: visibleFlag,
  serviceId: z.string().trim().min(1),
});
export type FooterServiceLink = z.infer<typeof footerServiceLinkSchema>;

export const footerSchema = z.object({
  servicesHeading: bilingualString,
  linksHeading: bilingualString,
  /** Parágrafo por baixo do logótipo — próprio, não reutiliza `hero.text`. */
  description: bilingualString,
  serviceLinks: z.array(footerServiceLinkSchema),
  /** Texto legal, sem o "© <ano>" — o ano é calculado em runtime. */
  legalCopy: bilingualString,
  madeIn: bilingualString,
  /** Assinatura "by <nome>" a seguir aos direitos reservados, com link de WhatsApp. */
  signature: z.object({
    visible: visibleFlag,
    name: z.string().trim().min(1),
    whatsappNumber: z.string().trim().min(1),
  }),
});
export type Footer = z.infer<typeof footerSchema>;

// ── META (título/descrição por defeito, Fase 3 — routing por locale) ──────
//
// Corrige o achado do code-reviewer (handoff-08): metadata.title/description
// deixam de estar hardcoded em app/layout.tsx e passam a vir de content/,
// com par {pt,en}, consumidos via generateMetadata por página/locale.

export const metaSchema = z.object({
  /** Nome próprio da empresa — não é campo traduzível (ver Header/Footer). */
  titleSuffix: z.string().trim().min(1),
  /**
   * Origem canónica do site (sem barra final), usada como `metadataBase`
   * (Fase 4) para resolver `canonical`, `alternates.languages`, `og:url` e
   * `og:image` para URLs absolutos, e para construir `sitemap.xml`,
   * `robots.txt` e o `url`/`logo` do JSON-LD `Organization`. FR-15 —
   * domínio de produção atual, não é uma decisão nova desta fase.
   */
  siteUrl: httpUrl,
  /**
   * Imagem reutilizada para `og:image`/`twitter:card` em todas as páginas
   * (secção 4 do requirements.md: não há imagem dedicada, reutiliza-se o
   * logótipo existente — nenhuma imagem nova foi gerada nesta fase).
   * Caminho relativo a `public/`, resolvido para absoluto via `siteUrl`.
   */
  ogImage: z.string().trim().min(1),
  defaultTitle: bilingualString,
  defaultDescription: bilingualString,
});
export type SiteMeta = z.infer<typeof metaSchema>;

// ── NOT FOUND (página 404 por locale — FR-13/AC-07) ────────────────────────

export const notFoundSchema = z.object({
  tag: bilingualString,
  title: bilingualString,
  text: bilingualString,
  backHome: bilingualString,
});
export type NotFoundContent = z.infer<typeof notFoundSchema>;

// ── SERVICES PAGE (listagem /servicos, /en/services) ───────────────────────

export const servicesPageSchema = z.object({
  /** Banner de imagem do topo da listagem (FR-2) — obrigatório, sem toggle. */
  bannerImage: localImagePath,
  bannerImageAlt: bilingualString,
  /** Também mostrado na Homepage e nos cartões de serviço (ServiceCard). */
  sectionHeading: z.object({
    tag: bilingualString,
    title: bilingualString,
    /** Rótulo do link "Saiba mais" nos cartões de serviço (homepage e listagem). */
    learnMore: bilingualString,
  }),
  intro: bilingualString,
  ctaTitle: bilingualString,
  ctaText: bilingualString,
});
export type ServicesPage = z.infer<typeof servicesPageSchema>;

// ── SERVICE PAGE (detalhe de cada serviço) ──────────────────────────────────

export const servicePageSchema = z.object({
  highlightsHeading: bilingualString,
  backToServices: bilingualString,
  /** Título da secção de galeria de imagens (redesign FR-3), quando `gallery` está preenchida. */
  galleryHeading: bilingualString,
  /** Título da secção de serviços relacionados no detalhe (Fase 2). */
  relatedHeading: bilingualString,
  /** Interruptor do bloco "serviços relacionados" em TODAS as páginas de
   *  detalhe (FR-6.2, handoff-34 secção D.4). */
  relatedVisible: visibleFlag,
});
export type ServicePage = z.infer<typeof servicePageSchema>;

// ── ABOUT PAGE ("Quem Somos" — secção de equipa) ────────────────────────────

export const valueItemSchema = z.object({
  visible: visibleFlag,
  icon: iconName,
  title: bilingualString,
  text: bilingualString,
});
export type ValueItem = z.infer<typeof valueItemSchema>;

export const aboutPageSchema = z.object({
  /** Banner de imagem do topo da página "Quem Somos" (FR-2) — obrigatório, sem toggle. */
  bannerImage: localImagePath,
  bannerImageAlt: bilingualString,
  teamTag: bilingualString,
  teamHeading: bilingualString,
  /** Cabeçalho da secção de valores institucionais (redesign FR-5.2). */
  valuesTag: bilingualString,
  valuesHeading: bilingualString,
  /** Interruptor do bloco valores institucionais inteiro. A contagem
   *  estrutural de 6 mantém-se independente da visibilidade (handoff-34 D.3). */
  valuesVisible: visibleFlag,
  /** Exactamente 6 blocos: Missão, Visão, Sustentabilidade, Parceria, Inovação, Excelência. */
  values: z.array(valueItemSchema).length(6, "têm de existir exactamente 6 valores institucionais"),
});
export type AboutPage = z.infer<typeof aboutPageSchema>;

// ── QUEM SOMOS (entrada única "Quem Somos" do admin — junta about + aboutPage
//    + team num só ficheiro, content/site/quemSomos.json) ──────────────────

export const quemSomosSchema = z.object({
  ...aboutSchema.shape,
  ...aboutPageSchema.shape,
  team: z.object({ items: teamSchema }),
});
export type QuemSomos = z.infer<typeof quemSomosSchema>;
