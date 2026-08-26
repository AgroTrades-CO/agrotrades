STATUS: COMPLETED

SUMMARY: Confirmadas (com ajustes pontuais) as extensões ao modelo de conteúdo exigidas pelo
redesign da página de serviço e do Quem Somos. Todas as extensões são **aditivas** dentro do modelo
já fechado (ficheiros JSON versionados, todo o campo traduzível `{pt,en}` no mesmo ficheiro,
validação Zod no build, sem base de dados, sem serviço externo novo). Não há alteração à
arquitetura de sistema, à CSP, ao routing por locale nem ao hosting. Decisões-chave: (1) referências
a imagens são sempre **caminhos root-relative a partir de `public/`** (ex.
`/images/services/arroz/banner.jpg`), validados por regex no schema — mesmo padrão já usado em
`team.foto` e `meta.ogImage`, nunca nomes de ficheiro soltos nem URLs externas; (2) `sections` e
`gallery` são arrays **opcionais** por serviço, o que não quebra nenhum dos 8 serviços existentes;
(3) `bannerImage`/`bannerImageAlt` são **obrigatórios** (o build falha até os 8 ficheiros serem
preenchidos — é intencional, conforme AC-1.2, e obriga a criar os 8 placeholders no mesmo commit);
(4) os 6 valores institucionais ficam em `content/site/aboutPage.json` (chrome específico da página
Quem Somos), não em `about.json` (conteúdo partilhado com a homepage); (5) `teamSchema` perde o
`.max(3)` e baixa para `.min(1)`; (6) 4 novos valores no enum `iconName` (`target`, `eye`, `bolt`,
`trophy`) com os 4 componentes SVG correspondentes — zero emojis em qualquer ponto da proposta.

ARTIFACTS: este handoff (contém a definição exata dos schemas). Não foi criado `architecture.md`
novo nem `api-spec` — não se aplica: não há API nem fronteira de sistema nova, é extensão de
modelo de conteúdo estático dentro da arquitetura v5 já aprovada.

---

## 1. Referência a imagens locais — padrão único (decisão fechada)

**Decisão:** todo o campo de imagem no conteúdo é uma **string com o caminho root-relative a partir
de `public/`, começando por `/images/`**, incluindo extensão. Nunca nome de ficheiro solto, nunca
caminho relativo (`../`), nunca URL absoluta.

**Razão:** é exatamente o que já existe hoje (`team.foto = "/images/team/placeholder.svg"`,
`meta.ogImage = "/images/logo.jpeg"`) e é o que o `next/image`/`<img>` consome diretamente sem
concatenação em código. Um "nome de ficheiro" obrigaria a espalhar a pasta base por vários
componentes (duplicação de conhecimento) e a inventar convenção por coleção. Um URL absoluto
exigiria alterar a CSP (`img-src 'self' data:`) — restrição vinculativa da Fase 4 que não se toca.

**Alternativas rejeitadas:**
- *Nome de ficheiro + pasta base hardcoded no componente*: rejeitada — quebra a regra de fonte única
  de verdade em `content/`, e o Decap CMS grava o caminho completo do media folder de qualquer forma.
- *URL externo (Unsplash)*: já rejeitada na decisão de imagens (placeholders locais); implicaria
  alterar a CSP. O schema passa a **impedir** isto tecnicamente, não apenas por convenção.

**Convenção de pastas (vinculativa para o developer):**
```
public/images/services/<service-id>/banner.<ext>
public/images/services/<service-id>/gallery-1.<ext> … gallery-6.<ext>
```
`<service-id>` = campo `id` do serviço (arroz, cereais, moageira, terras, campanha, mecanizacao,
apoio-tecnico, comercializacao). Extensões permitidas: `.svg`, `.jpg`, `.jpeg`, `.png`, `.webp`.

**Novo helper de schema** (colocar junto de `bilingualStringList`, antes de `iconName`):

```ts
/**
 * Caminho de imagem local, root-relative a partir de public/ — mesmo padrão
 * já usado em team.foto e meta.ogImage. Bloqueia URLs externas (que exigiriam
 * alterar a CSP img-src, restrição vinculativa da Fase 4) e caminhos relativos.
 */
export const localImagePath = z
  .string()
  .trim()
  .regex(
    /^\/images\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(svg|jpg|jpeg|png|webp)$/,
    "o caminho tem de ser local e começar por '/images/' (ex.: '/images/services/arroz/banner.jpg'), com extensão svg/jpg/jpeg/png/webp — URLs externas não são permitidas (CSP img-src 'self')"
  )
  .refine((v) => !v.includes(".."), "o caminho não pode conter '..'");
export type LocalImagePath = z.infer<typeof localImagePath>;
```

Aplicar também a `teamMemberSchema.foto` (os 3 valores atuais já passam) e **não** alterar
`metaSchema.ogImage` nesta tarefa (é conteúdo da Fase 4 já validado; alterá-lo é ruído fora de
âmbito — fica como recomendação de limpeza futura).

## 2. Serviços — novos campos

Definição exata a acrescentar/alterar em `content/schemas/index.ts`:

```ts
/** Uma imagem de conteúdo: caminho local + alt obrigatório e traduzível. */
export const contentImageSchema = z.object({
  image: localImagePath,
  alt: bilingualString,
});
export type ContentImage = z.infer<typeof contentImageSchema>;

/** Bloco temático opcional da descrição de um serviço (FR-2). */
export const serviceSectionSchema = z.object({
  /** Ausente = usar o `icon` do próprio serviço (fallback definido no design-spec 2b). */
  icon: iconName.optional(),
  title: bilingualString,
  text: bilingualString,
});
export type ServiceSection = z.infer<typeof serviceSectionSchema>;
```

Acréscimos ao `serviceSchema` existente (mantendo tudo o resto igual, incluindo `highlights`, que
não é tocado — FR-7):

```ts
  /** FR-1/FR-4: imagem do hero do detalhe E capa do cartão em /servicos — o mesmo campo, uma só fonte de verdade. */
  bannerImage: localImagePath,
  bannerImageAlt: bilingualString,
  /** FR-2: quando ausente/omisso, a página usa `description` como bloco único (fallback). */
  sections: z.array(serviceSectionSchema).min(1).max(6).optional(),
  /** FR-3: quando ausente/omisso, a secção de galeria não é renderizada de todo. */
  gallery: z.array(contentImageSchema).min(1).max(6).optional(),
```

Notas vinculativas:
- `bannerImage`/`bannerImageAlt` **obrigatórios** (AC-1.2). Consequência aceite: o build falha até
  os 8 `content/services/*.json` terem o campo — o developer tem de criar os 8 placeholders e
  preencher os 8 ficheiros **no mesmo commit** da alteração de schema. Alternativa rejeitada:
  torná-los opcionais com fallback visual — rejeitada porque criaria um estado "hero sem imagem"
  que o design não especifica e que passaria despercebido em produção.
- `sections` e `gallery` usam `.optional()` (campo ausente) e **não** `.default([])`: manter a
  distinção "não preenchido" vs "vazio" é irrelevante para a UI (ambos caem no fallback), e
  `.optional()` é o que garante que os 8 JSON atuais continuam válidos sem edição. No componente,
  testar `service.sections?.length` / `service.gallery?.length` — nunca `!== undefined` isolado.
- `.min(1)` dentro do array impede o caso patológico `"sections": []` / `"gallery": []` ficar
  ambíguo no CMS; `.max(6)` é o limite do design (3-6 imagens; permitimos 1-6 para não bloquear
  conteúdo parcial durante a migração serviço a serviço).
- `servicesSchema.length(8)` mantém-se inalterado.
- Não usar `.strict()` no `serviceSchema` (não é o padrão do ficheiro; introduzi-lo agora mudaria
  o comportamento de validação de todas as coleções).

## 3. Quem Somos — texto institucional e valores

- `aboutSchema.fullText` já é `bilingualStringList` (array de parágrafos, `min(1)`): **enriquecer o
  texto em `content/site/about.json` não exige qualquer alteração de schema**. Confirmado.
- Os 6 valores ficam em `content/site/aboutPage.json` (não em `about.json`).
  **Razão:** `about.json` é consumido pela homepage *e* pela página Quem Somos; `aboutPage.json` já
  é, por desenho, o conteúdo exclusivo da página Quem Somos (`teamTag`/`teamHeading`). Pôr os
  valores em `about.json` arrastaria conteúdo de uma página só para o bundle/mental model da
  homepage. *Alternativa rejeitada:* ficheiro novo `values.json` — rejeitada por fragmentar o
  conteúdo de uma única página por três ficheiros sem ganho (não é uma coleção que o Decap trate
  como lista independente).

```ts
export const valueItemSchema = z.object({
  icon: iconName,
  title: bilingualString,
  text: bilingualString,
});
export type ValueItem = z.infer<typeof valueItemSchema>;

export const aboutPageSchema = z.object({
  teamTag: bilingualString,
  teamHeading: bilingualString,
  /** Cabeçalho da nova secção de valores institucionais (FR-5.2). */
  valuesTag: bilingualString,
  valuesHeading: bilingualString,
  /** Exactamente 6 blocos: Missão, Visão, Sustentabilidade, Parceria, Inovação, Excelência. */
  values: z.array(valueItemSchema).length(6, "têm de existir exactamente 6 valores institucionais"),
});
```

`.length(6)` (e não `.min(1)`) porque o design trata os 6 valores como conteúdo estrutural fixo da
secção, não como lista que cresce (ao contrário da equipa). Ícones fechados pelo design:
`target`, `eye`, `leaf`, `handshake`, `bolt`, `trophy`, por essa ordem.

## 4. Equipa — novos campos e remoção do limite

```ts
export const teamMemberSchema = z.object({
  nome: z.string().trim().min(1),
  cargo: bilingualString,
  /** Caminho local para a foto; o `alt` renderizado é o `nome` (AC-6.3). */
  foto: localImagePath,
  /** Bio curta, usada nos cartões do grid (mantém-se; itálico, .team-quote). */
  frase: bilingualString.optional(),
  /** Bio longa, usada no cartão destacado (primeiro membro). Opcional: placeholders atuais não a têm. */
  bio: bilingualString.optional(),
  /** Badges de especialidade (.about-tag). Traduzíveis, para consistência com o resto do schema. */
  badges: z.array(bilingualString).min(1).max(5).optional(),
});

export const teamSchema = z
  .array(teamMemberSchema)
  .min(1, "a equipa precisa de pelo menos um membro (o primeiro é o cartão destacado)");
```

- `.max(3)` **removido**: era uma restrição de fase placeholder, não uma restrição real de layout —
  o grid é `auto-fit` e suporta N membros. Manter o limite obrigaria a uma alteração de código
  sempre que a empresa contratasse alguém, o que contraria o objetivo do CMS.
- `.min(2)` baixa para `.min(1)`: o design especifica explicitamente o caso "só o cartão destacado,
  sem grid abaixo".
- `badges` como `array de {pt,en}` (não `array de string`): decisão pedida pelo UX. **Razão:**
  "Produção de arroz"/"Rice production" são termos traduzíveis; usar string simples criaria a
  primeira exceção à regra "todo o campo traduzível é `{pt,en}`" para texto que é visivelmente
  traduzível. *Alternativa rejeitada:* string simples por simplicidade de edição no Decap — o custo
  (conteúdo em PT visível na versão EN) é maior do que o ganho.
- Os 3 membros placeholder em `team.json` continuam válidos sem edição.

## 5. Ícones — 4 novos valores

```ts
export const iconName = z.enum([
  "wheat", "corn", "tractor", "factory", "landPlot", "support",
  "handshake", "calendar", "mapPin", "building", "leaf",
  // Novos (valores institucionais da página Quem Somos):
  "target", "eye", "bolt", "trophy",
]);
```

Confirmado: **sim, são precisos 4 componentes SVG novos** em `components/icons.tsx`
(`IconTarget`, `IconEye`, `IconBolt`, `IconTrophy`), seguindo o wrapper `Base` já existente
(24x24, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.6}`), mais as 4 entradas
correspondentes em `components/icon-map.tsx`. O tipo `Record<IconName, ...>` do `iconMap` garante
que o TypeScript falha o build se algum ficar por mapear — não é preciso guarda adicional.

**Zero emojis:** nenhum campo, valor de enum, placeholder ou nome de ficheiro desta proposta contém
emoji; os equivalentes visuais dos 🎯🌟🌱🤝⚡🏆 do site de referência são os 6 nomes SVG acima.

## 6. Ordem de implementação (para o build nunca ficar vermelho a meio)

1. `content/schemas/index.ts` (helper + enum + campos) **e** os JSON afetados no mesmo commit
   (8 serviços com `bannerImage`/`bannerImageAlt`, `aboutPage.json` com os 6 valores).
2. `components/icons.tsx` + `components/icon-map.tsx` (senão o build falha por `Record` incompleto).
3. Placeholders em `public/images/services/<id>/`.
4. Componentes de página e CSS.

VALIDATIONS:
- Verificado que `sections`/`gallery` como `.optional()` deixam os 8 `content/services/*.json`
  atuais válidos sem edição (nenhum campo novo obrigatório além de `bannerImage`/`bannerImageAlt`,
  cuja obrigatoriedade é deliberada e coberta pelo passo 1 da ordem de implementação).
- Verificado que os 3 membros de `content/site/team.json` continuam válidos com `bio`/`badges`
  opcionais e com `foto` a passar o regex de `localImagePath` (`/images/team/placeholder.svg`).
- Verificado que `meta.ogImage` (`/images/logo.jpeg`) também passaria o regex, caso se decida
  reutilizar o helper no futuro — nenhuma incompatibilidade latente.
- Verificado que `iconMap` é `Record<IconName, ...>`, pelo que os 4 valores novos do enum forçam
  falha de compilação até serem mapeados — a validação não depende de disciplina do developer.
- Alternativas rejeitadas documentadas em cada secção (nome de ficheiro vs caminho; URL externo;
  `values.json` separado; `badges` como string simples; `bannerImage` opcional; `.default([])`).

ISSUES (riscos identificados):
1. **`bannerImage` obrigatório parte o build entre commits.** Mitigação já prescrita: schema + 8
   JSON + placeholders no mesmo commit. Se o developer separar, o `main` fica com build vermelho.
2. **Peso do repositório.** As imagens são commitadas no Git (decisão de arquitetura existente).
   8 banners + até 48 imagens de galeria. Restrição: usar placeholders SVG leves ou JPEG/WebP
   comprimidos (**máx. ~200 KB por ficheiro, ~150 KB para os banners**); nunca originais de câmara.
   Git não tem "apagar" — um binário grande fica no histórico para sempre.
3. **Otimizador de imagens da Vercel.** O `context.md` desaconselha serviços proprietários da
   Vercel, incluindo o otimizador; as fases anteriores já usam `next/image` sem
   `images.unoptimized`. Esta tarefa multiplica o número de imagens e, portanto, o consumo dessa
   quota. **Não altero isto aqui** (está fora do âmbito de uma confirmação de schema e afetaria
   páginas já validadas), mas fica sinalizado ao Orchestrator como decisão a tomar antes do cutover
   de produção (Fase 7): ou `images: { unoptimized: true }`, ou aceitar o uso do otimizador
   explicitamente.
4. **`.length(6)` nos valores** significa que remover um valor via Decap parte o build. É
   deliberado (é uma secção estrutural), mas tem de ser comunicado a quem editar conteúdo.
5. Abuso do próprio mecanismo: não aplicável — não há autenticação, pagamentos, dados pessoais de
   clientes nem schema de produção nesta alteração. O único vetor de "abuso" plausível seria um
   caminho de imagem apontar para fora do site; o regex de `localImagePath` fecha-o à partida.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: `developer` implementa, seguindo a ordem da secção 6 acima e o
`design-spec-redesign.md` para todo o detalhe visual (dimensões, cores, classes CSS a reaproveitar):
(a) `content/schemas/index.ts` com `localImagePath`, `contentImageSchema`, `serviceSectionSchema`,
`valueItemSchema`, os 4 valores novos de `iconName`, os campos novos de `serviceSchema`,
`aboutPageSchema` e `teamMemberSchema`, e o novo `teamSchema` sem `.max`; (b) preenchimento dos 8
`content/services/*.json` com `bannerImage`/`bannerImageAlt` (e `sections`/`gallery` em pelo menos
um serviço, para provar ambos os caminhos do fallback); (c) `aboutPage.json` com `valuesTag`,
`valuesHeading` e os 6 valores na ordem/ícones fixados; (d) enriquecimento de `about.json.fullText`
(sem alteração de schema); (e) 4 SVGs novos em `components/icons.tsx` + `icon-map.tsx`;
(f) placeholders em `public/images/services/<id>/`; (g) componentes de página e CSS.

CONTEXT_FOR_NEXT_AGENT (restrições que o developer não pode violar):
1. Nenhum caminho de imagem externo, em nenhum campo — a CSP (`img-src 'self' data:`) e as
   `remotePatterns` do `next.config.mjs` **não são alteradas** nesta tarefa.
2. Nenhum emoji em código, conteúdo, nomes de ficheiro, commits ou UI. Ícones sempre via
   `iconName` + `components/icons.tsx`.
3. Todo o campo de texto traduzível é `{pt,en}` no mesmo ficheiro, ambos obrigatórios — incluindo
   `bannerImageAlt`, `alt` de cada imagem de galeria, títulos/textos de `sections`, `values` e
   `badges`. Nada de ficheiros paralelos por idioma.
4. `highlights` e a sua renderização não são tocados (FR-7) — nem schema, nem conteúdo, nem CSS.
5. Fallbacks obrigatórios, sem exceção: serviço sem `sections` → `description` como bloco único;
   serviço sem `gallery` → secção de galeria inteira ausente do DOM; membro sem `bio`/`badges` →
   campo simplesmente não renderizado, sem placeholder textual; `sections[].icon` ausente →
   `service.icon`.
6. Não introduzir base de dados, CMS alternativo, biblioteca de imagens/lightbox de terceiros nem
   qualquer dependência nova sem voltar ao `software-architect`. O zoom da galeria é CSS
   (`transform: scale`), não uma lib.
7. Não introduzir `.strict()` nem `.default()` nos schemas desta coleção — só `.optional()` como
   especificado, para não alterar o comportamento de validação já existente.
8. Placeholders de imagem leves (ver ISSUE 2) — nada de binários grandes no histórico Git.

HIGH_RISK_AREA: false — não há autenticação, tokens/sessões, integração bancária/pagamentos,
schema de base de dados de produção nem dados pessoais de clientes. As fotos/bios da equipa são
conteúdo institucional da própria empresa, já aprovado desde a Fase 3. Classificação MEDIUM
confirmada.
