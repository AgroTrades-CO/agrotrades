# Design Spec — Redesign (task-001, incremento pós-Fase 4)

Base visual: paleta e tipografia já estabelecidas em `app/globals.css` (não se introduzem cores
novas). Playfair Display para títulos, DM Sans para corpo de texto. Ícones sempre SVG do padrão
já usado em `components/icons.tsx` / `components/icon-map.tsx` — nunca emoji, em nenhuma secção.

Origem de imagens (decisão já tomada, não reabrir): placeholders locais estáticos/gerados,
commitados em `public/images/...`, sem dependência externa nem alteração à CSP. Cada placeholder
tem de ter dimensões e proporção definidas abaixo para o developer gerar/obter ficheiros
consistentes (evitar layout shift).

---

## 1. Cartões da lista de serviços (`/servicos`, `/en/services`)

Estrutura atual do `.service-card`: ícone (52x52, fundo `--green-light`) → título → resumo
(clamp 3 linhas) → "Saiba mais". Adiciona-se uma imagem de banner ao TOPO do cartão, acima do
ícone, sem remover nenhum elemento existente.

- **Imagem de capa**: full-width do cartão, altura fixa `160px`, `object-fit: cover`,
  `border-radius: 16px 16px 0 0` (só os cantos de cima, para acompanhar o `border-radius: 16px`
  do cartão). Fica colada às margens do cartão (o `padding: 28px` atual do `.service-card` deixa
  de se aplicar à imagem — a imagem ocupa a largura total do cartão, o padding volta a aplicar-se
  só ao conteúdo textual abaixo dela).
- **Overlay/ícone**: o ícone de serviço (52x52, fundo `--green-light`) passa a ficar sobreposto ao
  canto inferior esquerdo da imagem, meio a sair dela — um "badge" circular/quadrado arredondado
  branco com sombra suave (`box-shadow: 0 4px 12px rgba(0,0,0,0.12)`), posicionado com
  `margin-top: -26px` (metade da sua altura) e `margin-left: 20px`, para criar sobreposição
  imagem/conteúdo tal como em cartões de blog/portefólio comuns. Isto substitui a posição atual do
  ícone (que ficava solto no topo do padding) sem alterar o seu estilo (cor, tamanho, fundo).
- Resto do cartão (título, resumo, link "Saiba mais") mantém-se exatamente como está hoje, só que
  agora começa logo a seguir ao espaço criado pela sobreposição do ícone (`padding-top` do bloco
  de texto ligeiramente maior, ex. `36px` em vez de `16px`, para dar respiro ao ícone sobreposto).
- **Estado de loading/vazio**: como o conteúdo é estático (build-time, vindo de `content/`), não
  há estado de loading em runtime. Estado de fallback: se a imagem placeholder não carregar (erro
  de rede/ficheiro em falta), o navegador mostra o `alt` — por isso `alt` nunca pode ser vazio
  (ver FR-1.3). Não é necessário skeleton.
- **Acessibilidade**: imagem de capa tem `alt` descritivo por serviço (campo `bannerImageAlt`),
  nunca `alt=""` (não é decorativa, transmite informação sobre o serviço). O ícone sobreposto
  mantém-se puramente decorativo (`aria-hidden`, como já é hoje via SVG sem `role`).
- **Placeholder**: imagem 640x360px (proporção 16:9), uma por serviço, tema visual genérico
  ligado à área (campo/plantação para arroz e cereais, maquinaria para mecanização/terras,
  armazém/silo para moageira, mãos/aperto de mão para comercialização, pessoa em campo para apoio
  técnico) — mesmo que sejam ilustrações/fotos de stock genéricas locais, não fotos reais.

## 2. Página de detalhe de serviço (`/servicos/[slug]`, `/en/services/[slug]`)

### 2a. Hero/banner de topo

Substitui o `.page-hero` atual (gradiente verde liso) nesta página específica por uma variante
com imagem de fundo:

- Container com altura mínima `380px` (desktop) / `320px` (mobile), `position: relative`.
- Imagem de fundo: `object-fit: cover`, ocupa todo o container, `position: absolute; inset: 0;
  z-index: 0`.
- **Overlay escuro**: gradiente `linear-gradient(160deg, rgba(13,61,6,0.88) 0%, rgba(26,92,16,0.72)
  40%, rgba(42,122,26,0.55) 100%)` sobreposto à imagem (`z-index: 1`) — reutiliza os tons do
  gradiente `.hero` já existente em vez de um preto genérico, para manter a identidade visual
  também quando há imagem de fundo. Garante contraste suficiente para o texto branco por cima
  (WCAG AA — testar contraste do título sobre a zona mais clara da imagem, ajustar opacidade do
  overlay se necessário).
- Conteúdo (breadcrumb "Voltar", ícone do serviço, título, resumo) mantém-se `position: relative;
  z-index: 2`, mesma tipografia/hierarquia atual (`page-hero-content`, `h1`, `p`).
- Ícone do serviço: mantém-se como está hoje (cor branca, 44x44), sem badge/fundo adicional aqui
  (contexto diferente do cartão da lista — aqui já há imagem de fundo, um badge extra poluiria).
- **Fallback**: se um serviço não tiver `bannerImage` preenchido — não deve acontecer em produção
  porque o build falha sem o campo (AC-1.2) — mas para o ambiente de preview/dev antes de todos os
  8 ficheiros serem migrados, definir que o schema torna `bannerImage` obrigatório desde já
  (nenhum estado "sem imagem" a desenhar na hero, para não branquear a decisão AC-1.2).
- **Placeholder**: imagem 1600x600px (proporção ~2.7:1), pode reutilizar a mesma imagem do cartão
  da lista em maior resolução, ou uma imagem distinta mais larga — decisão de implementação, não
  bloqueia o design (ambas cumprem o requisito de "imagem de fundo").

### 2b. Descrição estruturada por secções

Layout atual: `.sd-description` é um único bloco branco com padding 32px e texto corrido. Passa a
suportar duas variantes, com fallback automático:

**Variante A — fallback (sem secções definidas para o serviço):** mantém-se exatamente como hoje
— bloco único `.sd-description` com o parágrafo de `description`. Nenhuma alteração visual aqui.

**Variante B — com secções (`sections` preenchido):**
- Bloco introdutório: primeiro parágrafo (`description` original, ou um resumo curto) continua a
  aparecer no topo, no mesmo estilo de texto corrido atual (`.sd-description`, sem numeração/
  título), a funcionar como "abertura" antes dos tópicos.
- Abaixo, cada secção (tipicamente 2–3) é um bloco distinto, empilhado verticalmente com
  `gap: 24px` entre si. Cada bloco:
  - Card com `background: var(--off-white)` alternando com `background: white` a cada secção
    (a primeira `off-white`, a segunda `white`, a terceira `off-white`, etc.) para criar a
    "variação visual" pedida sem depender de imagens — border `1px solid var(--border)`,
    `border-radius: 14px`, `padding: 24px 28px`.
  - Cabeçalho da secção: ícone pequeno (28x28, círculo `background: var(--green-light)`, cor
    `var(--green-dark)`) + título da secção (`font-weight: 600, font-size: 15px`) lado a lado
    (`display: flex; align-items: center; gap: 10px`), com `margin-bottom: 10px`.
  - Texto da secção: mesmo estilo tipográfico do `.sd-description` (`font-size: 16px; color:
    var(--text-muted); line-height: 1.9`), sem o `background`/`border`/`padding` próprios (esses
    já estão no card da secção).
  - Ícone da secção: reaproveita o enum `iconName` existente (não é obrigatório ser um ícone novo)
    — cada secção pode indicar um `icon` do mesmo enum usado nos serviços, à escolha de quem edita
    o conteúdo; se não vier definido, usar o mesmo ícone do serviço (`service.icon`) como default,
    para nunca ficar sem ícone.
- Este bloco de secções substitui o `.sd-description` original nesta variante (não coexistem os
  dois na mesma página) — ver FR-2.3, é uma escolha de "ou/ou" por serviço, não acumulativo.
- **Estado vazio**: uma secção sem `text` preenchido não deve existir (obrigatório no schema); não
  há estado vazio a desenhar aqui.

### 2c. Destaques (checklist verde)

Sem alterações — `.sd-highlights-box` mantém-se pixel-a-pixel igual ao estado atual (FR-7).

### 2d. Galeria de imagens

Nova secção, abaixo do bloco `.sd-body` (descrição + destaques), full-width dentro do mesmo
container `maxWidth: 1100px`:

- Título de secção pequeno, estilo consistente com outros títulos de secção do site
  (`section-tag` + `section-title`, mas em tamanho reduzido já que é uma subsecção — usar
  `font-size` do `section-title` reduzido para `1.4rem`, ou reaproveitar diretamente o padrão
  existente se o developer preferir consistência estrita).
- Grid responsivo: `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px`. Suporta de 3 a 6 imagens (conforme FR-3), sem quebrar com números diferentes.
- Cada imagem: `aspect-ratio: 4/3`, `object-fit: cover`, `border-radius: 12px`, `border: 1px solid
  var(--border)`. Hover (desktop): leve zoom (`transform: scale(1.03)` dentro de um container
  `overflow: hidden` para não vazar) — consistente com a interatividade sutil já usada nos
  `.service-card` (`hover: translateY`).
- **Estado vazio (galeria não preenchida)**: a secção inteira (título + grid) não é renderizada —
  nenhum título "Galeria" órfão sem imagens, nenhum grid vazio com placeholders cinzentos (FR-3.3).
  Esta é uma regra de apresentação condicional simples: `gallery.length > 0`.
- **Acessibilidade**: cada imagem da galeria tem `alt` próprio e não vazio (`{pt,en}`), nunca
  reaproveitando o `alt` da imagem de banner.
- **Placeholder**: imagens 480x360px (proporção 4:3), 3 a 6 por serviço, mesmo critério temático
  do banner (ver secção 1).

## 3. Página "Quem Somos" (`/quem-somos`, `/en/about`)

### 3a. Texto institucional

Sem alteração estrutural — `about.fullText` continua a ser renderizado como está hoje (lista de
parágrafos `.section-sub` dentro de `maxWidth: 800px`). O enriquecimento é só de conteúdo (mais
parágrafos), não de layout. Não requer trabalho do developer além de garantir que o layout atual
suporta mais parágrafos sem quebrar (já suporta, é só um `.map`).

### 3b. Secção de valores institucionais (nova)

Inserida entre o bloco de texto institucional (3a) e a secção de Equipa (3c) atual, dentro do
mesmo padrão de `section` + `section-tag` + `section-title` já usado nas outras páginas (ex.
"Serviços", "Localizações").

- Título de secção: tag pequena (ex. "OS NOSSOS VALORES") + `section-title` (ex. "O que nos
  guia").
- Grid: `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;
  margin-top: 40px` — mesmo padrão de gap/responsividade do `.pillar-grid` já existente na página
  Campanha (reaproveitar essa classe ou uma equivalente, para não introduzir um quarto padrão de
  grid de cartões no site).
- Cada cartão de valor (reaproveita o estilo `.pillar` já existente: fundo branco, borda,
  `border-radius: 14px`, `padding: 24px`, texto centrado):
  - Ícone SVG centrado no topo, círculo `56x56`, fundo `var(--green-light)`, cor
    `var(--green-dark)` (mesmo tratamento do `.service-icon`, mas circular e centrado em vez de
    alinhado à esquerda, para diferenciar visualmente de cartões de serviço).
  - Título do valor (`font-size: 15px; font-weight: 600`), `margin-top: 14px; margin-bottom: 6px`.
  - Texto curto (`font-size: 13px; color: var(--text-muted); line-height: 1.6`).
- **Os 6 valores e ícones a usar** (mapeamento definido, para o developer não ter de escolher):
  | Valor | Ícone | Novo no enum? |
  |---|---|---|
  | Missão | alvo/target (círculos concêntricos) | Sim — adicionar `"target"` a `iconName` |
  | Visão | olho (elipse + pupila) | Sim — adicionar `"eye"` a `iconName` |
  | Sustentabilidade | folha | Não — reaproveita `"leaf"` já existente |
  | Parceria | aperto de mãos | Não — reaproveita `"handshake"` já existente |
  | Inovação | raio/lightning bolt | Sim — adicionar `"bolt"` a `iconName` |
  | Excelência | troféu (taça) | Sim — adicionar `"trophy"` a `iconName` |

  Os 3 ícones novos (`target`, `eye`, `bolt`, `trophy` — 4 no total) seguem exatamente o mesmo
  padrão do `Base` wrapper em `components/icons.tsx` (24x24 viewBox, `stroke="currentColor"`,
  `strokeWidth={1.6}`, sem preenchimento sólido exceto onde já é esse o padrão, ex. `IconMenu`/
  `IconWhatsapp`). Confirmar com o `software-architect`/`developer` a adição destes 4 valores ao
  enum `iconName` em `content/schemas/index.ts` antes da implementação — sinalizado no handoff do
  Product Analyst, este design já fecha os nomes para não haver ambiguidade.
- **Estado vazio**: não aplicável — os 6 valores são conteúdo fixo estrutural desta secção (FR-5.2
  não os torna opcionais), sempre presentes.

### 3c. Secção de Equipa (redesenho)

Mantém-se o título de secção atual (`aboutPage.teamTag` + `aboutPage.teamHeading`). Estrutura
interna muda de "grid uniforme de N cartões iguais" para "destaque + grid", suportando qualquer
número de membros ≥ 1 (não assume exatamente 3):

- **Regra de agrupamento**: primeiro elemento do array `team` (ordem já definida em
  `content/site/team.json`) = cartão destacado. Todos os restantes (`team.slice(1)`, 0 a N
  elementos) = grid de cartões pequenos. Se só existir 1 membro no total, mostra-se só o cartão
  destacado, sem grid vazio abaixo (nenhuma secção "resto da equipa" órfã).

**Cartão destacado (CEO / primeiro membro):**
- Largura total do container (`maxWidth: 1100px`), layout em duas colunas no desktop
  (`display: grid; grid-template-columns: 280px 1fr; gap: 40px; align-items: center` — foto à
  esquerda, texto à direita), empilhado verticalmente no mobile (`grid-template-columns: 1fr`,
  foto centrada acima do texto).
- Fundo `white`, borda `1px solid var(--border)`, `border-radius: 20px`, `padding: 40px`, sombra
  suave (`box-shadow: 0 12px 40px rgba(0,0,0,0.06)`) para reforçar destaque face aos cartões do
  grid (que não têm sombra por defeito, só no hover).
- Foto: `200x200px`, `border-radius: 50%` (mantém o padrão circular do `.team-photo` atual, só
  maior — hoje é 96px), `object-fit: cover`, `border: 4px solid var(--green-light)`.
- Texto: nome (`font-family: 'Playfair Display'`, `font-size: 1.6rem`, `font-weight: 700` — maior
  que o `h3` atual dos cartões pequenos, para reforçar hierarquia), cargo logo abaixo
  (`.team-role`, mesmo estilo atual: `color: var(--green-dark); font-weight: 500`), depois a bio
  longa (`font-size: 15px; color: var(--text-muted); line-height: 1.8; margin: 14px 0 18px`, sem
  itálico — diferente da `.team-quote` atual que é itálica, porque aqui é uma bio descritiva, não
  uma citação), depois as badges de especialidade.
- Badges: reaproveita exatamente o estilo `.about-tag` já existente (pill `background: var(--green-
  light); color: var(--green-dark); border-radius: 100px; padding: 6px 14px; font-size: 13px`,
  com `display: flex; flex-wrap: wrap; gap: 8px` no container) — mantém consistência com as tags
  já usadas na secção "Sobre a empresa" acima nesta mesma página, sem inventar um quarto padrão de
  badge.

**Grid de cartões pequenos (restantes membros):**
- Mesma classe `.team-grid` já existente (`repeat(auto-fit, minmax(220px, 1fr))`, `gap: 24px`),
  colocada abaixo do cartão destacado com `margin-top: 32px`.
- Cada cartão pequeno mantém a estrutura atual do `.team-card` (foto 96px circular, nome, cargo)
  com dois acrescentos opcionais:
  - Cargo passa a maiúsculas pequenas com letter-spacing (`.team-role` ganha
    `text-transform: uppercase; font-size: 12px; letter-spacing: 0.04em` nesta variante de grid —
    o cartão destacado mantém o cargo em case normal, para diferenciar hierarquia tipográfica).
  - Bio curta: reaproveita o campo `frase` já existente (renderizado como está hoje, `.team-quote`,
    itálico) — não obriga a um campo novo só para o grid, conforme já permitido no requisito
    (FR-6.2 deixa a decisão em aberto; aqui fecha-se: reaproveitar `frase`).
  - Badges (se o membro tiver): mesma pill `.about-tag`, versão mais pequena (`font-size: 12px;
    padding: 4px 10px`), `flex-wrap: wrap; justify-content: center` (o cartão pequeno é
    centralizado, ao contrário do destacado).
- **Estado de dados incompletos** (placeholder sem bio/badges): cada campo é condicional — mostra-
  se só o que existir. Nenhum "—" ou texto vazio a preencher espaço; o cartão simplesmente fica
  mais curto (AC-6.2). Isto já é o padrão usado hoje para `frase` (`member.frase &&
  <p>...</p>`), estender a mesma lógica a `bio` e `badges`.
- **Crescimento futuro**: o grid usa `auto-fit`, já preparado para qualquer número de membros
  adicionais sem alteração de CSS — só o schema `teamSchema` precisa de deixar de ter `.max(3)`
  (confirmar com `software-architect`, já sinalizado no handoff do Product Analyst).

**Acessibilidade (equipa):**
- `alt` de cada foto = nome do membro (já é o padrão atual, mantém-se).
- Badges são texto simples dentro de `<span>`, sem semântica de lista interativa (não são links).
- Ordem de leitura no destaque: foto (imagem com alt) → nome (heading) → cargo → bio → badges,
  coerente com a ordem visual, sem inversões via CSS que quebrem a ordem do DOM.

**Placeholder de fotos**: destacado 400x400px (quadrada, recortada em círculo via CSS), restantes
192x192px — mesmo critério de "placeholder local genérico" já usado em
`public/images/team/placeholder.svg`, sem necessidade de fotos reais nesta fase.

---

## Resumo de novos campos de conteúdo (para o `software-architect`/`developer`, não é decisão de UX)

- `content/services/*.json`: `bannerImage` (string, caminho), `bannerImageAlt` ({pt,en}),
  `sections` (array opcional de `{icon?: iconName, title: {pt,en}, text: {pt,en}}`), `gallery`
  (array opcional de `{image: string, alt: {pt,en}}`).
- `content/schemas/index.ts` → `iconName`: adicionar `"target"`, `"eye"`, `"bolt"`, `"trophy"`.
- `content/site/aboutPage.json` (ou novo ficheiro `values.json`): 6 blocos fixos de valores
  `{icon: iconName, title: {pt,en}, text: {pt,en}}` — pode ser um array de tamanho fixo 6 no
  schema (`.length(6)`), já que não é um conteúdo que cresce como a equipa.
- `content/site/team.json` → `teamSchema`: `bio` ({pt,en}, opcional), `badges` (array opcional de
  `{pt,en}` ou de string simples — recomenda-se `{pt,en}` para consistência com o resto do
  schema), remoção do `.max(3)`.
