STATUS: COMPLETED

SUMMARY: Implementado o redesign de imagens/conteúdo para /servicos, detalhe de serviço e Quem
Somos, seguindo à letra os schemas do software-architect (handoff-19) e o design-spec do
ux-ui-designer. (1) `content/schemas/index.ts`: novo helper `localImagePath` (bloqueia URLs
externas e `..`), `contentImageSchema`, `serviceSectionSchema`, `valueItemSchema`, 4 novos valores
de `iconName` (`target`, `eye`, `bolt`, `trophy`), `bannerImage`/`bannerImageAlt` obrigatórios +
`sections`/`gallery` opcionais em `serviceSchema`, `aboutPageSchema` com `valuesTag`/
`valuesHeading`/`values` (`.length(6)`), `teamMemberSchema` com `bio`/`badges` opcionais e `foto`
agora validado por `localImagePath`, `teamSchema` sem `.max(3)` (`.min(1)`). Acrescentei também
`galleryHeading` a `servicePageSchema` (título traduzível da secção de galeria — não hardcoded).
(2) Os 8 `content/services/*.json` ganharam `bannerImage`/`bannerImageAlt` no mesmo commit lógico
do schema (build nunca fica vermelho); `arroz` e `mecanizacao` ganharam também `sections` (3 blocos
cada) e `gallery` (3 imagens cada) para provar os dois caminhos do fallback; os restantes 6 ficam
sem esses campos para confirmar o fallback de bloco único / galeria ausente. (3) 4 ícones SVG novos
em `components/icons.tsx` (`IconTarget`, `IconEye`, `IconBolt`, `IconTrophy`, mesmo wrapper `Base`
24x24/stroke 1.6) + entradas em `components/icon-map.tsx` (o `Record<IconName,...>` obrigou o
TypeScript a falhar até eu mapear os 4 — confirmado). (4) `ServicesListContent.tsx`: cartões
ganharam imagem de capa 640x360 (16:9) via `next/image`, com o ícone existente sobreposto como
badge (`.service-icon--badge`, margem negativa sobre a imagem, sem `position:absolute`). (5)
`ServiceDetailContent.tsx`: hero com imagem de fundo (`fill`) + overlay em gradiente verde
(reaproveita os tons do `.hero`, não preto); descrição com fallback duplo — bloco único quando
`sections` ausente, ou parágrafo intro + blocos com fundo alternado off-white/white quando
presente (`icon` de cada secção cai para `service.icon` se ausente); galeria condicional
(`gallery.length > 0`), grid `auto-fit`, hover com leve zoom via CSS puro; "Destaques" não tocado
(confirmado por curl — HTML idêntico). (6) `AboutContent.tsx`: nova secção de 6 valores
reaproveitando `.pillar`/`.pillar-grid` (ícone circular `.pillar-icon-circle`); equipa redesenhada
com `team[0]` em cartão destacado (`.team-featured`, foto 200px, bio longa, badges via
`.about-tag`) e `team.slice(1)` no `.team-grid` existente (cargo em caps pequenas via
`.team-role--grid`, badges menores); layout funciona com qualquer N >= 1 (`team.length > 1` guarda
o grid; sem grid órfão se só houver 1 membro). Placeholders SVG locais leves (sem texto, sem
emoji) gerados em `public/images/services/<id>/` (banners ~1-2 KB cada, gradiente verde/laranja/
terra + padrão geométrico simples por categoria) e reaproveitando `public/images/team/
placeholder.svg` já existente para as fotos de equipa — nenhuma dependência externa, CSP e
`next.config.mjs` inalterados.

ARTIFACTS:
- content/schemas/index.ts (schema — ver secção acima)
- content/index.ts (exporta novos tipos `ContentImage`, `ServiceSection`, `ValueItem`)
- content/services/arroz.json, cereais.json, moageira.json, terras.json, mecanizacao.json,
  apoio-tecnico.json, comercializacao.json, campanha.json (todos com bannerImage/bannerImageAlt;
  arroz e mecanizacao também com sections + gallery)
- content/site/aboutPage.json (valuesTag/valuesHeading/values — 6 blocos)
- content/site/about.json (fullText enriquecido, 5 parágrafos por idioma)
- content/site/team.json (bio+badges no membro 1, badges no membro 2, membro 3 sem alterações —
  para testar degradação graceful)
- content/site/servicePage.json (novo campo galleryHeading)
- components/icons.tsx (+IconTarget, IconEye, IconBolt, IconTrophy)
- components/icon-map.tsx (mapeamento dos 4 novos ícones)
- components/pages/ServicesListContent.tsx (cartões com imagem de capa + badge de ícone)
- components/pages/ServiceDetailContent.tsx (hero com imagem, secções, galeria)
- components/pages/AboutContent.tsx (secção de valores + equipa destaque/grid)
- app/globals.css (novas classes: .service-card--with-cover/.service-card-cover/
  .service-card-body/.service-icon--badge, .sd-hero/.sd-hero-image/.sd-hero-overlay,
  .sd-sections/.sd-section-card(--alt/--base)/.sd-section-head/.sd-section-icon,
  .sd-gallery-section/.sd-gallery-title/.sd-gallery-grid/.sd-gallery-item, .pillar--value/
  .pillar-icon-circle, .team-featured(-photo/-name/-bio)/.team-grid--rest/.team-role--grid)
- public/images/services/{arroz,cereais,moageira,terras,mecanizacao,apoio-tecnico,
  comercializacao,campanha}/banner.svg (8 placeholders leves, ~1-2 KB cada)
- public/images/services/arroz/gallery-{1,2,3}.svg, mecanizacao/gallery-{1,2,3}.svg

VALIDATIONS:
- `npm run build` passa (Next.js 16.3.2, TypeScript sem erros, 30 páginas geradas), a partir do
  commit lógico schema+conteúdo+placeholders, tal como exigido pelo architect (ordem da secção 6
  do handoff-19) — nunca ficou vermelho a meio.
- Servidor de produção local (`npm run start`) + `curl`, confirmando por página:
  - `/servicos`: 8 cartões com `service-card-cover`, cada um a carregar
    `/images/services/<id>/banner.svg`.
  - `/servicos/arroz`: `sd-hero-image` presente (hero com imagem de fundo), 3×
    `sd-section-card` (variante B — secções temáticas), 3× `sd-gallery-item` (galeria).
  - `/servicos/terras`: `sd-section-card` e `sd-gallery-section` ausentes (0 ocorrências),
    `sd-description` presente 1x — fallback de bloco único e ausência de galeria confirmados sem
    quebrar.
  - `/servicos/arroz`: bloco `.sd-highlights-box` extraído do HTML é byte-a-byte igual ao texto
    "Destaques" + lista de `highlights` já existente — FR-7 confirmado.
  - `/en/services`, `/en/services/rice`: cartões e hero com imagem também presentes na versão EN.
  - `/quem-somos`: 6 blocos de valores (confirmado via contagem de títulos únicos no HTML, o dobro
    do valor bruto porque o Next.js RSC embebe o payload de hidratação duplicado no `<script>`,
    comportamento já documentado no `next.config.mjs` existente), `team-featured` e
    `team-grid--rest` ambos presentes.
- Scan automatizado (Node) a todos os `.json`/`.ts`/`.tsx` de `content/`, `components/`, `app/`:
  zero caracteres emoji encontrados (intervalo Unicode 1F300-1FAFF e 2600-27BF).
- Confirmado visualmente (Browser pane ao gravar os ficheiros) que os 14 SVGs novos renderizam
  gradiente + padrão geométrico sem texto, na paleta do projeto.
- Servidor de teste parado no fim (processo Node terminado, porta 3000 libertada).

ISSUES (fora de âmbito, não corrigidos, para o Orchestrator/futuro developer):
1. Os placeholders SVG são genéricos/abstratos (gradiente + padrão geométrico), não fotos reais —
   consistente com a decisão já tomada pelo utilizador; ficam prontos a substituir via Decap CMS
   sem qualquer alteração de código quando houver fotos reais.
2. `sections`/`gallery` só foram preenchidos em 2 dos 8 serviços (arroz, mecanizacao), conforme
   pedido explícito da tarefa ("pelo menos 2-3 serviços como exemplo... deixar os restantes sem") —
   os outros 6 continuam só com `description`/`highlights`, a preencher depois via CMS.
3. `galleryHeading` foi um campo novo que não estava explicitamente listado no handoff-19, mas é
   aditivo, `{pt,en}` obrigatório, e segue o mesmo padrão de `highlightsHeading`/`backToServices`
   já existentes em `servicePageSchema` — necessário para não hardcodar o texto "Galeria"/
   "Gallery" no componente (restrição vinculativa do context.md). Nenhuma decisão de arquitetura
   nova, só uma extensão de conteúdo dentro do modelo já fechado.
4. Não corrigi nem toquei em nada relacionado com Decap CMS, GitHub App ou gestão de utilizadores
   — fora do âmbito desta tarefa.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: Próximo agente é o `tester`. Deve validar: (a) os 3 AC de cada FR-1 a FR-7 do
handoff-17 (product-analyst), com foco especial em FR-7 (Destaques inalterado — bit-a-bit) e nos
fallbacks graceful (FR-2.3, FR-3.3, AC-6.2); (b) que os 8 `content/services/*.json` e o novo
`aboutPage.json`/`team.json` passam a validação Zod sem exceção; (c) que remover/alterar campos
opcionais (`sections`, `gallery`, `bio`, `badges`, `frase`) não quebra o build nem a renderização;
(d) que `teamSchema` aceita 1, 2, 3 ou mais membros sem alterar CSS; (e) `npm run build` limpo; (f)
zero emojis em qualquer novo artefacto.

CONTEXT_FOR_NEXT_AGENT: Para não repetir investigação — os ficheiros-chave a inspecionar são
`content/schemas/index.ts` (schemas exatos), `content/services/arroz.json` e `mecanizacao.json`
(exemplos com sections+gallery preenchidos, para testar a variante B), `content/services/terras.json`
(exemplo sem sections/gallery, para testar o fallback/variante A), `content/site/team.json` (3
membros com graus diferentes de preenchimento: membro 1 tem bio+badges+frase, membro 2 tem
badges+frase mas não bio, membro 3 não tem nenhum dos três — cobre todas as combinações de
degradação graceful pedidas). Os componentes relevantes são
`components/pages/ServicesListContent.tsx`, `components/pages/ServiceDetailContent.tsx` e
`components/pages/AboutContent.tsx`. Rotas a testar: `/servicos`, `/servicos/arroz`,
`/servicos/terras`, `/en/services`, `/en/services/rice`, `/quem-somos`, `/en/about`. Nenhuma
alteração foi feita a `app/layout.tsx`, routing, CSP, ou qualquer ficheiro fora do âmbito listado
no pedido do Orchestrator.
