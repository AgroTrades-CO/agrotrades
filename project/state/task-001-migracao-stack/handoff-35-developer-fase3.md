STATUS: COMPLETED

SUMMARY: Implementados os 6 pontos do âmbito da Fase 3 (ronda de ajustes pós-redesign), seguindo à
letra o contrato de dados do handoff-34 e o design visual do design-spec-fase3.md. (1) Schema: união
discriminada `heroSlideSchema` (`type: "image"|"video"`, `.strict()` em cada membro), `youtubeVideoId`
com regex de 11 caracteres, `heroSlidesSchema` com `.min(1).max(6)` + `.refine` a exigir pelo menos 1
slide visível, helper único `youtubeEmbedUrl()` (domínio `youtube-nocookie.com` e parâmetros fixados em
código — `mute=1`/`loop=1`/`controls=0` etc., nunca vindos de conteúdo); `visibleFlag` transversal
(`z.boolean().default(true)`) aplicado a `serviceSectionSchema.visible`, `galleryImageSchema.visible` +
`serviceSchema.galleryVisible`, `valueItemSchema.visible` + `aboutPageSchema.valuesVisible`,
`servicePageSchema.relatedVisible`; `bannerImage`/`bannerImageAlt` obrigatórios (sem toggle) em
`campanhaSchema.hero`, `contactsSchema`, `servicesPageSchema`, `aboutPageSchema`. (2) `HeroSlider.tsx`
(client component): carrossel com fade crossfade 600ms, autoplay 6s só em slides de imagem, pausa em
slide de vídeo/hover/foco/`prefers-reduced-motion`, setas+dots só com 2+ slides, swipe em mobile
(threshold 50px), vídeo sempre `youtube-nocookie.com` mudo+loop; texto do hero (`HomeContent.tsx`)
permanece fixo por cima, só o fundo muda. Consome exclusivamente `visibleHeroSlides` já filtrado. (3)
Banners novos em `CampaignContent.tsx`, `ContactContent.tsx`, `ServicesListContent.tsx`,
`AboutContent.tsx`, replicando literalmente `.page-hero.sd-hero`+`.sd-hero-image`+`.sd-hero-overlay` já
usado no hero de serviço (mesmo `alt=""` `aria-hidden` decorativo, mesmo precedente do handoff-19). (4)
`HomeContent.tsx`: os 4 cartões da homepage passam a usar `<ServiceCard>`, resolvendo
`homeTitle`/`homeBlurb` num objeto `Service` "resolvido" antes de mapear (opção (a) do design-spec) —
`ServiceCard` não ganhou props novas. (5) Filtragem de `visible` centralizada em `content/index.ts`:
`visibleHeroSlides`, `visibleSections()`, `visibleGallery()`, `visibleValues()` — os componentes
(`ServiceDetailContent.tsx`, `AboutContent.tsx`) só leem essas listas já filtradas e fazem
`if (lista.length === 0) return null`/condicional antes de qualquer outro campo do bloco (nunca
`display:none`). O fallback "sem `sections` -> usa `description`" passou a depender de
`visibleSections(service).length === 0`, conforme sinalizado pelo architect. (6) CSP: acrescentada
`frame-src 'self' https://www.youtube-nocookie.com https://www.google.com` em `next.config.mjs`,
corrigindo também o bug pré-existente do Google Maps (RISCO-3 do handoff-34) — confirmado por teste
manual que o iframe de `ContactContent.tsx` carrega.

ARTIFACTS:
- `content/schemas/index.ts` — `visibleFlag`, secção "HERO SLIDER" (novo: `youtubeVideoId`,
  `heroImageSlideSchema`, `heroVideoSlideSchema`, `heroSlideSchema`, `heroSlidesSchema`,
  `youtubeEmbedUrl()`), `heroSchema.slider`, `serviceSectionSchema.visible`, `galleryImageSchema`
  (novo) + `serviceSchema.galleryVisible`/`gallery: galleryImageSchema[]`, `campanhaSchema.hero.
  bannerImage/bannerImageAlt`, `contactsSchema.bannerImage/bannerImageAlt`, `servicesPageSchema.
  bannerImage/bannerImageAlt`, `servicePageSchema.relatedVisible`, `valueItemSchema.visible`,
  `aboutPageSchema.bannerImage/bannerImageAlt/valuesVisible`.
- `content/index.ts` — import/re-export `youtubeEmbedUrl`, `heroSlides`, `visibleHeroSlides`,
  `visibleSections()`, `visibleGallery()`, `visibleValues()`, tipos `GalleryImage`/`HeroSlide`
  exportados.
- `content/site/hero.json` — bloco `slider` novo (label/previousLabel/nextLabel/goToSlideLabel + 3
  slides: 2 imagens reaproveitadas de `public/images/services/{arroz,mecanizacao}/banner.svg` + 1
  vídeo com `youtubeId: "dQw4w9WgXcQ"`, marcado no `caption` PT/EN como placeholder de teste a
  substituir por vídeo institucional real via Decap CMS).
- `content/site/campanha.json`, `content/site/contacts.json`, `content/site/servicesPage.json`,
  `content/site/aboutPage.json` — `bannerImage`/`bannerImageAlt` PT/EN; `aboutPage.json` também
  `valuesVisible: true` (explícito, opcional pois é o default).
- `public/images/banners/campanha.svg`, `contactos.svg`, `servicos.svg`, `quem-somos.svg` — 4
  placeholders SVG novos, mesmo padrão gráfico dos banners de serviço já existentes.
- `components/HeroSlider.tsx` (novo) — carrossel client-side do hero.
- `components/icons.tsx` — `IconChevronLeft`/`IconChevronRight` (ícones estruturais de UI, fora do
  enum `iconName`, mesma convenção do `IconChevronDown`).
- `components/pages/HomeContent.tsx` — hero com `<HeroSlider>` + `.hero-slider-overlay` (removido
  `.hero-bg-pattern`), cartões de serviço via `<ServiceCard>`.
- `components/pages/CampaignContent.tsx`, `ContactContent.tsx`, `ServicesListContent.tsx`,
  `AboutContent.tsx` — banner `.sd-hero` novo; `AboutContent.tsx` também usa `visibleValues()` e
  esconde a secção de valores se vazia.
- `components/pages/ServiceDetailContent.tsx` — usa `visibleSections()`/`visibleGallery()` em vez de
  ler `service.sections`/`service.gallery` directamente; secção de relacionados condicionada a
  `servicePage.relatedVisible`.
- `app/globals.css` — classes novas `.hero-slider`, `.hero-slide(--active)`, `.hero-slide-media`,
  `.hero-slider-overlay`, `.hero-slider-arrow(--prev/--next)`, `.hero-slider-dots`, `.hero-slider-dot
  (--active)`; `.hero-bg-pattern` deixou de ser usada (regra CSS não removida, apenas sem consumidor).
- `next.config.mjs` — `frame-src` novo na CSP (secção F do handoff-34), comentário explicando os dois
  hosts e o RISCO-3.

VALIDATIONS:
- `npm run build` passa limpo (Next 16.3.2 / Turbopack), todas as 30 páginas estáticas geradas
  (incluindo as 4 páginas com banner e as 16 páginas de serviço PT/EN).
- Teste explícito de "quebrar o build": desliguei `visible: false` nos 3 slides de
  `content/site/hero.json` (com backup prévio) e corri `npm run build` — falhou com a mensagem exacta
  especificada no schema: `"pelo menos um slide do hero tem de estar visível — ligue 'Secção visível'
  em pelo menos um slide de content/site/hero.json"`, apontando para `slider.slides` e para o ficheiro
  certo. Restaurei o ficheiro a seguir e confirmei `npm run build` limpo outra vez.
- Servidor de dev (`npm run dev -p 3411`) + `curl`: confirmado que `/` tem `hero-slider`,
  `hero-slide--active` (1 slide activo), `hero-slider-arrow`×4 e `hero-slider-dot`×5 (3 slides × setas
  duplas em desktop/DOM + dots, número coerente com 3 slides > 1), e o iframe
  `youtube-nocookie.com/embed/dQw4w9WgXcQ` presente; `/`, `/campanha`, `/contactos`, `/servicos`,
  `/quem-somos` têm `sd-hero-image`; `/contactos` tem o iframe `google.com/maps/embed`. Cabeçalho
  `Content-Security-Policy` da resposta HTTP confirmado a conter
  `frame-src 'self' https://www.youtube-nocookie.com https://www.google.com`.
- Não corri testes automatizados novos (o projeto não tem framework de testes configurado — mesma
  situação de todas as fases anteriores, `project/context.md`). A validação foi feita por build +
  inspecção manual do HTML gerado, como nas fases anteriores.

ISSUES:
- `youtubeId: "dQw4w9WgXcQ"` em `content/site/hero.json` é um placeholder de teste explicitamente
  marcado como tal no `caption` (PT/EN) — não é conteúdo institucional real. Reportar ao utilizador
  para substituir por um vídeo institucional real via Decap CMS (Fase 5) antes do cutover de produção;
  não bloqueei a implementação por isso porque a tarefa autorizava explicitamente "qualquer vídeo
  público serve para teste".
- `.hero-bg-pattern` (CSS) ficou órfã em `app/globals.css` — já não é usada por nenhum componente
  (substituída pelo slider). Não a removi por estar fora do âmbito exacto pedido (só toquei CSS
  necessária para o slider/banners); é limpeza cosmética sem impacto funcional, para o Orchestrator
  decidir se vale a pena um follow-up.
- Os 4 SVGs novos de `public/images/banners/` são placeholders geométricos no mesmo estilo dos banners
  de serviço já existentes — não são fotografia real; ficam a aguardar substituição pelo utilizador via
  Decap CMS, mesma situação de todo o resto do conteúdo institucional desta migração.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: tester valida, por esta ordem: (1) `npm run build` limpo a partir de um checkout
limpo; (2) o teste de build-falha-legível repetindo o procedimento acima (desligar todos os slides,
confirmar mensagem de erro, restaurar); (3) comportamento do slider no browser real — autoplay 6s,
pausa em hover/foco/vídeo, `prefers-reduced-motion`, setas/dots, swipe mobile, foco de teclado não
entra em slide inactivo (`tabIndex=-1` no iframe inactivo); (4) as 4 páginas novas mostram banner
correctamente em PT e EN; (5) homepage mostra os 4 cartões com imagem de capa + badge de ícone; (6)
`/contactos` — confirmar visualmente (não só via CSP header) que o Google Maps carrega agora (antes
não carregava); (7) regressão: secção "Destaques" (`servicePage.highlightsHeading`) inalterada, secção
de valores institucionais em `/quem-somos` continua a mostrar os 6 valores (nenhum foi desligado),
detalhe de serviço com `sections`/`gallery` continua a funcionar como antes (fallback description).

CONTEXT_FOR_NEXT_AGENT: O contrato de dados exacto está no handoff-34 (secções A–G) — qualquer dúvida
sobre nomes de campos/convenção `visible` vs `<bloco>Visible` remete para lá. O design visual está no
design-spec-fase3.md secções 1–4. Pontos que exigem atenção redobrada do tester: (a) o `.refine` de
"pelo menos 1 slide visível" só existe no array de slides do hero — nenhum outro bloco (galeria,
valores, relacionados, secções) pode falhar o build por estar desligado, é comportamento esperado
(RISCO-1 do handoff-34), não confundir com bug; (b) o iframe de vídeo YouTube usa `tabIndex={isActive
? 0 : -1}` — testar com Tab que o foco de teclado nunca entra num slide que não está visível/activo;
(c) `ServiceCard` na homepage recebe um objeto `Service` clonado com `title`/`summary` já substituídos
por `homeTitle`/`homeBlurb` quando existem — os 4 IDs usados (`arroz`, `cereais`, `mecanizacao`,
`moageira`) são os mesmos de sempre, ordem preservada; (d) a CSP só abriu `frame-src` para os 2 hosts
nomeados — testar que nenhum outro domínio de iframe é aceite (ex.: tentar embutir algo de outro
domínio deve continuar bloqueado).
