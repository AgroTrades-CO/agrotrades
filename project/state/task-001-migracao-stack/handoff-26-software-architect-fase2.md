# Handoff 26 — Software Architect (Fase 2, feedback pós-preview)

STATUS: COMPLETED

SUMMARY: Confirmadas as extensões de schema pedidas pelo `ux-ui-designer` (design-spec-fase2.md),
todas **aditivas** e dentro do modelo de conteúdo já fechado (JSON versionado em `content/`, todo
campo traduzível como `{pt,en}`, validação Zod no build — nenhuma alteração a CSP, hosting,
routing por locale ou persistência). Decisões tomadas: (1) `serviceSectionSchema` ganha `image`
(reutiliza `contentImageSchema`), `layout` (`z.enum(["split","feature"]).optional()`) e `bullets`
(`bilingualStringList.optional()`), com **validação cruzada por `.superRefine()`** a recusar
`layout` sem `image` — validado no schema, não deixado como convenção; (2) `"card"` **não** entra
no enum (o layout-cartão é a ausência de imagem, não um valor editável); (3) `relatedHeading`
entra em `servicePageSchema` / `content/site/servicePage.json`; (4) `servicesViewAll` entra em
`navSchema` / `content/site/nav.json`; (5) `IconChevronDown` fica **fora** do enum `iconName` —
concordo com o designer; (6) serviços relacionados ficam como lógica pura de apresentação, **sem**
campo `relatedIds`.

ARTIFACTS (a alterar pelo developer — este handoff é a especificação, não alterei código):
- `content/schemas/index.ts` (extensões abaixo, secção "Definição exata")
- `content/site/servicePage.json`, `content/site/nav.json` (novos campos, PT+EN)
- `content/services/*.json` (1-2 serviços com `sections[].image`, um com `layout: "feature"` + `bullets`)
- `components/icons.tsx` (novo `IconChevronDown`, **não** registado em `components/icon-map.tsx`)

---

## Definição exata dos schemas (implementar tal como está)

### 1. `serviceSectionSchema` (substitui a definição atual)

```ts
/** Variantes de layout de uma secção COM imagem. Sem imagem, a secção é sempre
 *  o cartão de texto (`.sd-section-card`) — por isso "card" não é um valor do enum. */
export const serviceSectionLayout = z.enum(["split", "feature"]);
export type ServiceSectionLayout = z.infer<typeof serviceSectionLayout>;

/** Bloco temático opcional da descrição de um serviço (redesign FR-2, estendido na Fase 2). */
export const serviceSectionSchema = z
  .object({
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
```

Notas vinculativas:
- `image` usa `contentImageSchema` (`{ image: localImagePath, alt: bilingualString }`) — mesmo
  helper de `gallery`. Isto satisfaz automaticamente o estado obrigatório 6 do design-spec
  (`alt` nunca vazio) e mantém a CSP `img-src 'self'` intacta (só caminhos `/images/...`).
- `bullets` usa `bilingualStringList` (min 1 item em cada idioma) — mesmo tipo de `highlights`.
- **Não usar `z.default()`** para o layout: o default depende de outro campo (`image`), e um
  default no schema escreveria `"split"` em secções sem imagem. A resolução é do lado da
  apresentação, num helper puro que o developer deve criar e usar em **um único sítio**:

```ts
// derivação única, sem duplicar a regra por componente
export type ResolvedSectionLayout = "card" | "split" | "feature";
export function resolveSectionLayout(section: ServiceSection): ResolvedSectionLayout {
  if (!section.image) return "card";
  return section.layout ?? "split";
}
```

- O contador de alternância da variante "split" (design-spec 1b) incrementa **apenas** quando
  `resolveSectionLayout(section) === "split"`.

### 2. `servicePageSchema`

```ts
export const servicePageSchema = z.object({
  highlightsHeading: bilingualString,
  backToServices: bilingualString,
  galleryHeading: bilingualString,
  /** Título da secção de serviços relacionados no detalhe (Fase 2). Obrigatório. */
  relatedHeading: bilingualString,
});
```

Ficheiro correto, confirmado contra o padrão já estabelecido: **`content/site/servicePage.json`**
(um ficheiro por schema de página em `content/site/`, carregado e validado em `content/index.ts`).
Texto sugerido (ajustável pelo Product Analyst sem impacto estrutural):
`{"pt": "Outros serviços", "en": "Other services"}`.

### 3. `navSchema`

```ts
export const navSchema = z.object({
  home: bilingualString,
  services: bilingualString,
  campaign: bilingualString,
  contact: bilingualString,
  about: bilingualString,
  /** Rótulo do último item do dropdown "Serviços" (desktop) e da sublista mobile. */
  servicesViewAll: bilingualString,
});
```

Ficheiro: **`content/site/nav.json`**. Texto sugerido:
`{"pt": "Ver todos os serviços", "en": "View all services"}`.
O `→` do design **não** entra no conteúdo — é decoração, aplicada no componente (ou via CSS
`::after`), para não poluir o texto traduzível nem o campo do CMS.

O destino do link continua a vir de `content/routes.ts` (`path("services", lang)`), nunca
hardcoded no Header — restrição já vigente desde a Fase 3.

### 4. `IconChevronDown` — fora do enum `iconName` (concordo, sem objeção)

Razão: `iconName` é o vocabulário fechado de ícones **escolhíveis em campos de conteúdo**
(`service.icon`, `aboutTag.icon`, `pillar.icon`, `valueItem.icon`, `location.icon`) e, mais à
frente, o conjunto de opções de um widget `select` do Decap CMS. Um chevron de disclosure é chrome
de navegação: nunca aparecerá em `content/`, e pô-lo no enum criaria um valor oferecido ao editor
que produz uma UI sem sentido num cartão de serviço. Implementar como export normal em
`components/icons.tsx`, importado diretamente pelo `Header`, **sem** entrada em `icon-map.tsx`
(que deve continuar a ser `Record<IconName, ...>` exaustivo e 1:1 com o enum).

Convenção a fixar para o futuro (o developer deve deixar um comentário curto em `icons.tsx`):
*ícones de conteúdo → enum `iconName` + `icon-map.tsx`; ícones estruturais de UI → export solto.*

### 5. Serviços relacionados — sem campo de schema novo (decisão)

Confirmado: "os 3 próximos na ordem canónica de `services`, com wrap-around" é lógica pura de
apresentação sobre a ordem já existente. **Não** se acrescenta `relatedIds`.
Razões: (a) o catálogo é fixo em 8 (`servicesSchema.length(8)`) e a regra cobre todo o catálogo
sem manutenção; (b) `relatedIds` seria a primeira referência cruzada por id dentro de `content/`,
obrigando a validação de integridade referencial no build (ids inexistentes, auto-referência,
duplicados) e a mantê-la sincronizada sempre que um serviço for renomeado/removido — custo real
para zero ganho de UX hoje; (c) é um campo que um editor no Decap pode partir facilmente sem
perceber; (d) continua a ser aditivo mais tarde, sem migração de conteúdo, se o catálogo crescer.
A ordem canónica passa a ser um facto com significado editorial — o developer deve documentá-lo
com um comentário em `content/index.ts` (a ordem do array `services` determina os relacionados).

---

VALIDATIONS (alternativas consideradas e porquê rejeitadas):
1. **`"card"` dentro do enum `layout`** (sugestão recebida) — rejeitado: criaria estados
   contraditórios a validar (`layout: "card"` + `image` presente: renderiza cartão e ignora a
   imagem? mostra split?) e duplicaria a fonte de verdade sobre "esta secção tem imagem?". Com o
   enum limitado a `["split","feature"]`, a presença de `image` é o único discriminador e o estado
   inválido único é `layout` sem `image` — barrado pelo `.superRefine()`. O valor "card" continua
   a existir onde é útil: no tipo derivado `ResolvedSectionLayout`, do lado da apresentação.
2. **`layout` com `z.default("split")`** — rejeitado: aplicaria `"split"` também a secções sem
   imagem, invalidando a própria regra cruzada e escrevendo dados enganadores no objeto validado.
3. **Regra layout↔image só documentada como convenção** — rejeitado: o conteúdo será editado por
   não-programadores via Decap; uma regra só documentada é uma regra que se perde. A validação no
   schema falha o build com mensagem legível, que é exatamente a garantia definida na
   architecture-proposal (restrição 19). O custo é nulo.
4. **`relatedIds` opcional por serviço** — rejeitado por (a)-(d) acima.
5. **`IconChevronDown` no enum `iconName`** — rejeitado (secção 4).
6. **Verificar `bullets.pt.length === bullets.en.length` no schema** — não incluído, para manter
   coerência com `highlights`/`bilingualStringList`, que já não o fazem; introduzir a regra só
   aqui criaria inconsistência. Fica registado como possível melhoria transversal futura em
   `bilingualStringList` (aplicada a todos os campos de lista de uma vez, não a um só).

ISSUES / riscos:
- **Baixo.** Risco principal é conteúdo: `bullets` numa secção sem imagem passa a falhar o build
  (comportamento desejado, mas o developer tem de garantir que nenhum JSON existente fica nesse
  estado ao adicionar exemplos). Nenhum ficheiro atual usa estes campos, portanto não há migração.
- Fase 2 acrescenta imagens novas em `sections[].image`: manter o mesmo critério de peso/dimensão
  já usado na galeria (~480x360, 4:3) para não inflacionar o repositório Git, que também é o
  media store (decisão de arquitetura da Fase 0).
- Miniaturas do dropdown reutilizam `service.bannerImage` a 36x36 — sem campo novo, mas o
  developer deve passar `width`/`height` corretos ao `next/image` para não servir o banner
  completo 8 vezes no Header (o otimizador da Vercel está desativado por decisão de arquitetura).

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: `developer` implementa a Fase 2 seguindo `design-spec-fase2.md` e as
definições de schema **literais** acima: (1) estender `content/schemas/index.ts`
(`serviceSectionLayout`, `serviceSectionSchema` + `.superRefine()`, `relatedHeading`,
`servicesViewAll`) e criar o helper `resolveSectionLayout`; (2) acrescentar os campos a
`content/site/servicePage.json` e `content/site/nav.json` em PT e EN; (3) povoar `sections[].image`
em 1-2 serviços, um deles com `layout: "feature"` + `bullets`; (4) extrair o cartão de
`ServicesListContent.tsx` para `components/ServiceCard.tsx` e reutilizá-lo na secção "Outros
serviços" de `ServiceDetailContent.tsx`; (5) implementar as variantes split/feature/bullets;
(6) `IconChevronDown` em `components/icons.tsx` (fora do `icon-map`) e o dropdown do `Header`.

CONTEXT_FOR_NEXT_AGENT (restrições que o developer não pode violar):
- Nenhuma dependência nova; nenhum CSS/cor fora de `app/globals.css`; sem emojis.
- Todo o texto visível novo vem de `content/` como `{pt,en}` — nada de strings hardcoded em
  componentes, incluindo o rótulo "Ver todos os serviços" e o título "Outros serviços".
- URLs de páginas sempre via `content/routes.ts` / `service-slugs.ts`, nunca literais.
- Caminhos de imagem só locais sob `/images/...` (CSP `img-src 'self'`); `alt` sempre preenchido
  em imagens de conteúdo (a miniatura decorativa do dropdown é a única exceção, `alt=""`).
- `icon-map.tsx` mantém-se `Record<IconName, ...>` exaustivo — não acrescentar o chevron lá.
- A regra layout↔image é validada no schema; o componente **também** não deve renderizar
  split/feature sem imagem (defesa em profundidade via `resolveSectionLayout`, ponto único).
- A ordem do array `services` passa a ter significado (relacionados) — não reordenar sem intenção.

HIGH_RISK_AREA: false — site institucional estático, sem autenticação, pagamentos, schema de
produção ou dados pessoais. Alterações puramente aditivas ao modelo de conteúdo versionado.
