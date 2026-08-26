STATUS: COMPLETED

SUMMARY: Fechado o contrato de dados da Fase 3 (ronda de ajustes pós-redesign) sobre o schema Zod já
existente em `content/schemas/index.ts`, sem introduzir tecnologia nova nem sair da stack fechada
(Next.js + JSON validado por Zod no build). Quatro decisões estruturais: (1) cada slide do hero é uma
**união discriminada** por `type: "image" | "video"`, com `youtubeId` (ID de 11 caracteres, nunca URL
livre) no caso vídeo — o URL de embed é construído em código sobre `youtube-nocookie.com` com
parâmetros fixos, o editor nunca controla o domínio; (2) a regra "sempre pelo menos 1 slide visível" é
validada **no schema** (`.refine` sobre o array completo, depois de aplicados os defaults), não por
fallback de aplicação — justificação detalhada em VALIDATIONS; (3) os 4 banners novos reutilizam
exactamente o par `bannerImage` + `bannerImageAlt` (`localImagePath` + `bilingualString`) já usado em
`serviceSchema`, **obrigatórios e sem toggle de visibilidade** (ajuste deliberado ao FR-6.2 do
product-analyst, justificado abaixo); (4) o campo transversal chama-se `visible` quando é item de uma
coleção e `<bloco>Visible` quando é o interruptor de um bloco inteiro cujo conteúdo é um array irmão —
convenção uniforme, sempre `z.boolean().default(true)`, sempre o primeiro campo do objeto. Todas as
alterações são **retrocompatíveis**: nenhum dos ficheiros JSON existentes precisa de ser editado por
causa do campo `visible` (AC-6.4), só por causa dos banners novos e dos slides (conteúdo novo).

ARTIFACTS (a alterar pelo developer — nenhum ficheiro foi alterado por este agente):
- `content/schemas/index.ts` — alterações especificadas em CONTEXT_FOR_NEXT_AGENT, secções A a E.
- `content/index.ts` — derivações únicas (`visibleHeroSlides`) e re-export dos novos tipos/helpers.
- `content/site/hero.json` — novo bloco `slider`.
- `content/site/campanha.json`, `content/site/contacts.json`, `content/site/servicesPage.json`,
  `content/site/aboutPage.json` — novos `bannerImage`/`bannerImageAlt`.
- `public/images/banners/*` — 4 imagens placeholder, commitadas no MESMO commit do schema.
- `next.config.mjs` — alteração pontual e específica da CSP (secção F). Não implementar mais nada aí.
- Este handoff é o documento de arquitetura desta ronda (mesmo padrão dos handoffs 19/26).

VALIDATIONS (alternativas consideradas e porque foram rejeitadas):

1. **Slide: união discriminada vs. objeto único com campos opcionais.** Rejeitado o objeto único
   (`image?`, `youtubeId?`, ambos opcionais + `superRefine` a proibir os dois em simultâneo): produz um
   tipo TypeScript em que ambos os campos são `| undefined` no componente, obrigando a narrowing manual
   e a um `else` impossível; e permite o estado "slide sem nada" ser expresso no ficheiro antes de o
   refine o apanhar. A união discriminada torna o estado inválido **inexprimível no tipo**, dá ao Decap
   CMS (Fase 5) um mapeamento directo para o widget `list` com `types:` (variantes), e dá mensagens de
   erro de build que apontam para o tipo errado, não para um campo em falta.

2. **Vídeo: `youtubeId` vs. `youtubeUrl` vs. URL de embed completo.** Rejeitado `youtubeUrl`/URL
   completo. Aceitar um URL editável significa que o valor que acaba dentro do `src` de um `<iframe>` é
   controlado por conteúdo — se amanhã a CSP for relaxada, ou se alguém aceitar outro domínio "só desta
   vez", passa a haver um caminho para embutir um frame arbitrário de terceiros no site institucional a
   partir de uma edição de conteúdo. Com `youtubeId` (regex `^[A-Za-z0-9_-]{11}$`), o domínio e todos os
   parâmetros do embed são **código**, não conteúdo; o pior caso de um editor malicioso ou distraído é
   um vídeo errado do YouTube, nunca um domínio novo. Custo aceite: o editor tem de colar o ID e não o
   URL — mitigado com `hint` no Decap e com uma mensagem de erro de validação que explica onde encontrar
   o ID. (Nota de conveniência opcional, não obrigatória: o developer pode aceitar cola de URL e extrair
   o ID **no widget do Decap**, nunca alargando o regex do schema.)

3. **"Pelo menos 1 slide visível": refine no schema vs. fallback na aplicação.** Escolhido o **refine no
   schema**. Razão: a convenção já fechada e implementada neste projeto é falhar o build de forma legível
   quando o conteúdo é inválido (`parseContent` em `content/index.ts`, restrição 19 da arquitetura), e o
   deploy da Vercel não publica um build que falha — o site em produção fica no último build bom. Um
   fallback silencioso ("se todos estiverem desactivados, mostra na mesma o primeiro") faz exactamente o
   contrário do que o editor pediu, sem lhe dizer nada, e cria um estado que o design nunca especificou
   (um slide marcado como desligado a aparecer ao público). Alternativa rejeitada explicitamente:
   `min(1)` só no array bruto — insuficiente, porque `visible: false` em todos os slides passaria essa
   validação e deixaria o hero sem fundo em runtime.
   **Risco assumido e mitigação obrigatória** (ver ISSUES): um editor pode partir o build a partir do
   Decap desligando todos os slides. Mitigações vinculativas: (a) a mensagem de erro tem de dizer
   literalmente o que fazer ("pelo menos um slide do hero tem de ter 'Secção visível' ligado"); (b) o
   componente do hero consome **apenas** a lista já filtrada exportada de `content/index.ts`, nunca
   filtra por si; (c) na Fase 5, o Decap fica em editorial workflow/PR para que a falha apareça antes
   do merge, não depois.

4. **Banners novos: obrigatórios sem toggle vs. opcionais/desligáveis (FR-6.2, último ponto).**
   **Ajuste deliberado ao requisito** — os banners de página ficam **obrigatórios e sem campo de
   visibilidade**. Razões: (i) precedente já fechado no handoff-19 para `serviceSchema.bannerImage`
   (obrigatório + placeholder no mesmo commit, para não existir o estado "banner sem imagem" não
   especificado); (ii) permitir desligar obrigaria a manter, testar e manter acessível **dois** layouts
   de topo por página (com imagem e o gradiente antigo), duplicando estados visuais sem ganho editorial
   real — o editor que não gosta da imagem troca a imagem, não desliga o banner; (iii) o design-spec da
   Fase 3 (secção 2) especifica um único padrão de banner, idêntico ao hero de serviço, e não desenhou o
   estado "página com banner desligado" com o mesmo detalhe. Esta é uma alteração a um requisito
   aprovado pelo product-analyst: **o Orchestrator deve confirmá-la com o utilizador** (não é área de
   risco elevado, é só âmbito). Se o utilizador insistir no toggle, a implementação é aditiva e
   compatível (acrescentar `bannerVisible` por página e manter as classes `.page-hero` sem imagem).

5. **Toggle de bloco: campo irmão `<bloco>Visible` vs. envolver o array num objeto
   `{ visible, items[] }`.** Rejeitado o objeto envolvente: mudaria a forma de `gallery` em 8
   `content/services/*.json` e de `values` em `aboutPage.json`, quebrando ficheiros existentes e
   violando AC-6.4 ("os ficheiros já existentes continuam válidos sem edição manual"), além de exigir
   reescrever a configuração correspondente do Decap. O campo irmão é aditivo e tem default.

6. **`visible` vs. `enabled` como nome.** Escolhido `visible`, alinhado com o rótulo "Secção visível"
   já fixado pelo ux-ui-designer (design-spec-fase3, secção 4) — um nome só, do schema ao formulário do
   editor. `enabled` sugeriria funcionalidade ligada/desligada, não presença no render.

7. **Cartões de serviço da homepage.** Confirmado: **nenhum schema novo, nenhum campo novo**. Os 4
   cartões passam a usar `<ServiceCard>` sobre os mesmos `content/services/*.json` (campo `bannerImage`
   já existente e obrigatório nos 8 serviços desde o redesign). Rejeitada a hipótese de um campo
   `homeCoverImage` separado: criaria uma segunda fonte de verdade para a mesma capa e contraria AC-3.2.
   O override `homeTitle`/`homeBlurb` é resolvido **antes** de entrar no componente (opção (a) do
   design-spec), sem props novas no `ServiceCard`.

8. **Fonte do fundo de vídeo: YouTube vs. ficheiro commitado.** Já decidido pelo utilizador (YouTube);
   registo aqui apenas para o Developer não reabrir: vídeo binário no Git contraria a decisão de
   arquitetura já fechada (context.md, "Imagens e vídeo").

ISSUES (riscos identificados, incluindo abuso do próprio mecanismo):

- **[RISCO-1 — abuso do mecanismo, médio] Toggle de visibilidade como vetor de negação de serviço ao
  build.** O mecanismo introduzido nesta ronda (desligar blocos) pode ser usado, por engano ou de
  propósito, para partir o build: desligar todos os slides do hero viola o `.refine` e o `next build`
  falha, bloqueando **qualquer** publicação seguinte (incluindo correcções urgentes de outra pessoa),
  não só a alteração do slider. É o mesmo padrão de risco de um lockout mal desenhado. Mitigações
  vinculativas: (a) o refine é a **única** regra deste tipo — nenhum outro bloco pode falhar o build por
  estar desligado (galeria, valores, relacionados, secções: desligados = simplesmente não renderizam,
  nunca erro); (b) mensagem de erro accionável, em português, a indicar o ficheiro e o que ligar de
  volta; (c) Fase 5: Decap em editorial workflow (PR), para a falha ser visível antes do merge; (d) o
  último deploy bom mantém-se em produção — a Vercel não publica builds falhados.
- **[RISCO-2 — segurança/privacidade, baixo-médio] Domínio de terceiros no `frame-src`.** O embed do
  YouTube introduz o primeiro domínio externo executável do site. Mitigado por: `youtube-nocookie.com`
  (menos cookies de tracking), `youtubeId` validado por regex (o editor não escolhe domínio), CSP
  alargada **apenas** em `frame-src` e **apenas** para esse host, `img-src`/`script-src`/`connect-src`
  inalterados. Não usar miniaturas `i.ytimg.com` — obrigaria a alargar `img-src` (ver secção F).
- **[RISCO-3 — achado pré-existente, alto para funcionalidade, encontrado nesta análise] O iframe do
  Google Maps na página de contactos está actualmente bloqueado pela CSP.** `components/pages/
  ContactContent.tsx:119` renderiza um `<iframe src={contacts.mapEmbedUrl}>` para
  `https://www.google.com/maps/embed?...`, mas a CSP da Fase 4 não declara `frame-src` e o fallback é
  `default-src 'self'` — ou seja, o mapa não carrega em produção hoje. Como esta ronda passa a declarar
  `frame-src` explicitamente, o developer **tem** de incluir também `https://www.google.com`, senão o
  bug fica cristalizado. Sinalizar ao tester como caso de teste próprio (não é regressão introduzida
  agora; é um bug existente que esta alteração torna corrigível de graça).
- **[RISCO-4 — conteúdo, baixo] Placeholders de banner.** Se as 4 imagens de banner não forem
  commitadas no mesmo commit do schema, o build falha (campo obrigatório) ou serve um 404 de imagem.
  Requisito vinculativo: schema + JSON + ficheiros de imagem no mesmo commit.
- **[RISCO-5 — acessibilidade, baixo] Autoplay de vídeo.** `mute=1` é vinculativo (design-spec 1.5) e
  não é validado pelo schema porque o URL é construído em código — a garantia está no helper
  `youtubeEmbedUrl()`, que é o único sítio onde o URL pode ser construído. Não construir o URL inline
  em nenhum componente.

BLOCKERS: nenhum. Dependência única a confirmar pelo Orchestrator: o ajuste ao FR-6.2 descrito em
VALIDATIONS ponto 4 (banners de página obrigatórios, sem toggle).

REQUIRED_NEXT_ACTION: **developer** implementa, por esta ordem: (1) as alterações de
`content/schemas/index.ts` das secções A–E abaixo, literalmente como especificadas; (2) as derivações
únicas em `content/index.ts` (secção D.4); (3) os ficheiros de conteúdo + imagens placeholder (secção
G); (4) a alteração pontual da CSP em `next.config.mjs` (secção F), incluindo o `https://www.google.com`
do RISCO-3; (5) os componentes (slider, banners, `ServiceCard` na homepage, `visible` no render) segundo
o `design-spec-fase3.md` — o design é a fonte de verdade visual, este handoff é a fonte de verdade do
contrato de dados. FR-7 (favicon e logótipo transparente) entra no mesmo lote, é trabalho independente.

CONTEXT_FOR_NEXT_AGENT (contrato exacto — restrições que o developer não pode violar):

## A. Helper transversal de visibilidade

```ts
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
```

Nota Zod 4.4.3: `z.boolean().default(true)` deixa o campo **opcional no input** e `boolean` garantido no
output — é isto que dá a retrocompatibilidade exigida por AC-6.4 (nenhum JSON existente precisa de ser
editado). Nos `superRefine`/`refine` novos usar a forma `ctx.addIssue({ code: "custom", ... })`.

## B. Slider do hero (novo)

```ts
// ── HERO SLIDER (FR-1) ─────────────────────────────────────────────────────

/** ID de vídeo do YouTube (11 caracteres). NUNCA um URL: o domínio e os
 *  parâmetros do embed são código, não conteúdo (ver VALIDATIONS 2). */
export const youtubeVideoId = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9_-]{11}$/,
    "indique apenas o ID do vídeo do YouTube (11 caracteres, a parte depois de 'v=' no URL), não o endereço completo"
  );

export const heroImageSlideSchema = z.object({
  visible: visibleFlag,
  type: z.literal("image"),
  image: localImagePath,
  alt: bilingualString,
});

export const heroVideoSlideSchema = z.object({
  visible: visibleFlag,
  type: z.literal("video"),
  youtubeId: youtubeVideoId,
  /** Equivalente textual do vídeo (FR-1.4): usado como aria-label do iframe. */
  caption: bilingualString,
});

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
    "pelo menos um slide do hero tem de estar visível — ligue 'Secção visível' em pelo menos um slide de content/site/hero.json"
  );
```

Regras vinculativas:
- `type` é obrigatório e explícito em todos os slides (sem inferência por "tem imagem ou tem id").
- Um slide de imagem **não pode** ter `youtubeId` e vice-versa: garantido pela união discriminada
  (Zod rejeita chaves desconhecidas? não — mas o tipo torna-as invisíveis; se quiser rejeição dura,
  aplicar `.strict()` aos dois membros da união; **recomendado**, para apanhar erros de cola no Decap).
- O `.refine` corre **depois** dos defaults de `visible` — é por isso que a regra "pelo menos 1 visível"
  é fiável mesmo em ficheiros que não declaram o campo.

Bloco `slider` acrescentado a `heroSchema` (o resto de `heroSchema` fica **inalterado**, FR-1.5):

```ts
export const heroSchema = z.object({
  // ... campos existentes (tag, titleLine1, titleLine2, motto, text, buttons) INALTERADOS ...
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
```

Nenhum texto de UI do slider (setas, dots, aria-labels) pode ficar hardcoded em componentes — FR-6.1.

Helper único de construção do URL de embed (colocar em `content/schemas/index.ts`, junto de
`resolveSectionLayout`, ou em `lib/youtube.ts`; **um só sítio**, nunca inline num componente):

```ts
/** Único sítio onde o URL do embed é construído. `mute=1` é vinculativo. */
export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1", mute: "1", loop: "1", playlist: id,
    controls: "0", modestbranding: "1", rel: "0", playsinline: "1",
    disablekb: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
```
O `<iframe>` leva `allow="autoplay; encrypted-media; picture-in-picture"`, `title`/`aria-label` =
`caption` traduzida, `loading="lazy"` excepto se for o primeiro slide visível, e `tabIndex={-1}` quando
o slide não está activo (não deixar foco entrar num slide escondido).

## C. Banners novos (FR-2) — obrigatórios, mesmo par de campos do serviço

Acrescentar **exactamente** este par (nomes iguais aos de `serviceSchema`, para haver uma só forma no
projeto — não usar `contentImageSchema` aninhado aqui):

```ts
bannerImage: localImagePath,
bannerImageAlt: bilingualString,
```

Onde:
- `campanhaSchema.hero` — dentro do objeto `hero` (é o bloco de topo dessa página).
- `contactsSchema` — nível de topo.
- `servicesPageSchema` — nível de topo.
- `aboutPageSchema` — nível de topo.

Sem `visible`, sem `optional()`, sem fallback (ver VALIDATIONS 4). Caminhos sugeridos:
`/images/banners/campanha.jpg`, `/images/banners/contactos.jpg`, `/images/banners/servicos.jpg`,
`/images/banners/quem-somos.jpg` — `localImagePath` já obriga a `/images/...` e bloqueia URLs externas.
O hero do detalhe de serviço **não muda** (FR-2.3) e é a referência visual.

## D. Campo `visible` transversal — alterações pontuais

**D.1 `serviceSectionSchema`** (confirmação pedida: hoje **não** tem o campo). Acrescentar `visible:
visibleFlag` como **primeiro** campo do objeto, antes de `icon`. O `superRefine` existente fica
inalterado.

**D.2 Galeria (`serviceSchema.gallery`)** — item-level + bloco:
```ts
export const galleryImageSchema = contentImageSchema.extend({ visible: visibleFlag });
```
e em `serviceSchema`:
```ts
  /** Interruptor do bloco galeria inteiro (convenção `<bloco>Visible`). */
  galleryVisible: visibleFlag,
  gallery: z.array(galleryImageSchema).min(1).max(6).optional(),
```
Regra de render: a secção de galeria só é renderizada se `galleryVisible === true` **e** existir pelo
menos uma imagem com `visible === true`. Nunca é erro de build ficar sem nenhuma.

**D.3 Página Quem Somos (`aboutPageSchema`)** — o `.length(6)` de `values` **mantém-se** (restrição
estrutural já fechada no handoff-19); a visibilidade é ortogonal à contagem:
```ts
export const valueItemSchema = z.object({
  visible: visibleFlag,
  icon: iconName,
  title: bilingualString,
  text: bilingualString,
});
// em aboutPageSchema:
  valuesVisible: visibleFlag,
  values: z.array(valueItemSchema).length(6, "têm de existir exactamente 6 valores institucionais"),
```
Render: secção de valores só aparece se `valuesVisible` **e** houver ≥1 valor visível.

**D.4 Serviços relacionados (`servicePageSchema`)** — bloco inteiro (FR-6.2):
```ts
  relatedVisible: visibleFlag,
```
Render: `relatedServices()` só é chamada se `relatedVisible === true` (FR-6.5: nada do bloco é avaliado
quando está desligado).

**D.5 Derivações únicas — em `content/index.ts`, nunca nos componentes.** Mesmo princípio de
`resolveSectionLayout` (handoff-26): a regra de filtragem existe **uma vez**.
```ts
export const heroSlides = hero.slider.slides;                       // bruto, só para debug/CMS
export const visibleHeroSlides = heroSlides.filter((s) => s.visible); // garantido não-vazio pelo refine
export function visibleSections(service: Service) { return (service.sections ?? []).filter((s) => s.visible); }
export function visibleGallery(service: Service) {
  return service.galleryVisible ? (service.gallery ?? []).filter((i) => i.visible) : [];
}
export function visibleValues(page: AboutPage) {
  return page.valuesVisible ? page.values.filter((v) => v.visible) : [];
}
```
Proibido: `.filter(x => x.visible)` dentro de um componente. Proibido: `display:none` ou wrapper vazio —
`if (lista.length === 0) return null;` **antes** de ler qualquer outro campo do bloco (FR-6.5).
Atenção a uma regressão possível: `service.sections` já tem hoje o fallback "sem `sections` => usa
`description` como bloco único" — esse fallback passa a depender de `visibleSections(service).length === 0`,
não de `sections === undefined`. Caso de teste explícito para o tester.

## E. Cartões de serviço da homepage (FR-3) — sem schema novo

Confirmado: **nenhum campo de conteúdo novo**. `HomeContent.tsx` substitui o markup inline por
`<ServiceCard>` e resolve `homeTitle`/`homeBlurb` antes de o invocar (design-spec 3, opção (a)). O
`ServiceCard` não ganha props novas e não passa a conhecer o conceito de "override da homepage".

## F. CSP — alteração pontual e específica (NÃO é relaxamento geral)

Em `next.config.mjs`, na entrada `source: "/:path*"`, **acrescentar uma directiva nova** `frame-src`
(hoje inexistente, logo a herdar `default-src 'self'`):

```
"frame-src 'self' https://www.youtube-nocookie.com https://www.google.com",
```

Vinculativo:
- `https://www.youtube-nocookie.com` — domínio sem cookies de tracking; **não** usar `youtube.com`.
- `https://www.google.com` — corrige o RISCO-3 (o iframe do mapa em `ContactContent.tsx:119` está
  bloqueado hoje). Se a decisão for antes remover o mapa, então não incluir este host — mas não deixar
  o estado actual (iframe renderizado + CSP a bloquear).
- **Nada mais muda**: `default-src`, `script-src`, `style-src`, `font-src`, `img-src`, `connect-src`,
  `object-src`, `base-uri`, `form-action`, `frame-ancestors`, `upgrade-insecure-requests` ficam
  **exactamente** como estão. Em particular: `img-src` continua `'self' data:` — é proibido usar
  miniaturas do YouTube (`i.ytimg.com`); se for preciso um poster para o slide de vídeo, é uma imagem
  local commitada, com campo próprio no schema.
- Manter/actualizar o comentário do bloco a explicar porquê `frame-src` foi aberto e para que hosts —
  a CSP deste ficheiro é restrição vinculativa da arquitetura e cada excepção fica documentada no sítio.
- `frame-ancestors 'none'` **mantém-se**: é sobre quem nos pode embutir, não sobre quem embutimos.

## G. Ficheiros de conteúdo a criar/actualizar (mesmo commit do schema)

- `content/site/hero.json`: bloco `slider` completo (label/previousLabel/nextLabel/goToSlideLabel +
  ≥1 slide). Arrancar com 2-3 slides de imagem reutilizando imagens já commitadas em
  `public/images/services/`, e, se o utilizador ainda não tiver fornecido um ID de vídeo, **não**
  inventar um ID — arrancar só com imagens e acrescentar o slide de vídeo depois (o schema suporta).
- `content/site/campanha.json`, `contacts.json`, `servicesPage.json`, `aboutPage.json`: `bannerImage` +
  `bannerImageAlt` (`pt` e `en` preenchidos — build falha se faltar um).
- `public/images/banners/`: as 4 imagens. Podem ser reaproveitadas de imagens já existentes no repo se
  não houver fotografia nova; o que não pode é o campo ficar a apontar para ficheiro inexistente.
- Nenhum ficheiro existente precisa de ser editado por causa de `visible`/`galleryVisible`/
  `valuesVisible`/`relatedVisible` — se algum precisar, o default foi mal aplicado (AC-6.4).

HIGH_RISK_AREA: false — nada nesta ronda toca autenticação, tokens/sessões, integração bancária ou
pagamentos, schema de base de dados de produção ou dados pessoais de clientes; todo o conteúdo é
institucional e público, versionado em `content/`. Dois pontos que, mesmo não sendo área de risco
elevado, exigem atenção explícita do Orchestrator: (a) o RISCO-1 (toggle de visibilidade a poder
bloquear o build de toda a gente — desenho mitigado acima, mas é o mecanismo a poder ser usado contra o
próprio fluxo de publicação); (b) a alteração da CSP da Fase 4, que é restrição vinculativa da
arquitetura e por isso fica aqui documentada como excepção pontual, limitada a `frame-src` e a dois
hosts nomeados — o `security-engineer` deve validá-la no Gate 4 e o `code-reviewer` deve rejeitar
qualquer alargamento além destes dois hosts.
