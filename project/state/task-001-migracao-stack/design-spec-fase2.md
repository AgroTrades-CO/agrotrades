# Design Spec — Fase 2 (feedback pós-preview, 4 pontos)

Base: paleta/tipografia de `app/globals.css` (não se introduzem cores novas), reaproveitando ao
máximo classes já existentes do redesign anterior (`design-spec-redesign.md`, já implementado —
ver `components/pages/ServiceDetailContent.tsx`, `components/pages/ServicesListContent.tsx`,
`components/Header.tsx`). Sem emojis em nenhum ponto (ícones sempre via `iconName` +
`components/icons.tsx` / `components/icon-map.tsx`). Sem dependências novas.

---

## 0. Destaques — confirmação (sem alteração)

`.sd-highlights-box` mantém-se pixel-a-pixel igual ao estado atual. Nenhuma ação do developer
aqui — item incluído só porque o utilizador confirmou explicitamente ao ver o preview.

---

## 1. Secções do detalhe de serviço — imagem opcional + variação de layout

Estado atual (já implementado): `service.sections[]` é uma lista de `{icon?, title, text}`,
renderizada sempre como o mesmo cartão (`.sd-section-card`, fundo off-white/branco alternado por
índice, ícone circular 28px + título + texto). Este cartão **mantém-se como o layout por
omissão** para qualquer secção sem imagem — não muda.

### 1a. Novo campo: imagem opcional por secção

Cada secção pode, opcionalmente, ter uma imagem associada. Quando tem, a secção deixa de
renderizar como cartão de texto e passa a um dos dois layouts em bloco (1b/1c) — a decisão é
**por secção**, não por serviço: um serviço pode misturar secções com e sem imagem livremente,
na ordem em que estão definidas no conteúdo.

### 1b. Variante "split" — imagem + texto lado a lado, alternando o lado

Layout por omissão quando a secção tem imagem (equivalente ao bloco "imagem à esquerda + texto à
direita" da referência do utilizador).

- Grid de 2 colunas no desktop (`display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
  align-items: center`), empilhado no mobile (`grid-template-columns: 1fr`, imagem sempre
  primeiro no fluxo visual e no DOM).
- **Alternância do lado**: conta-se apenas entre as secções desta variante ("split"), não entre
  todas as secções do serviço — 1ª secção "split" encontrada = imagem à esquerda, 2ª = imagem à
  direita, 3ª = esquerda, etc. Implementação: um contador incrementado só quando
  `layout !== "feature"` e `image` presente; parcial (`contador % 2 === 0` → esquerda). A imagem
  fica sempre primeiro no DOM (para leitores de ecrã e para a ordem mobile ser sempre
  imagem→texto); o lado visual no desktop é controlado por `order` CSS na coluna de texto quando
  o contador é par (texto some para `order: -1`), nunca invertendo a ordem do DOM.
- **Imagem**: `aspect-ratio: 4/3`, `object-fit: cover`, `border-radius: 16px`, `border: 1px solid
  var(--border)`.
- **Coluna de texto**: cabeçalho igual ao cartão atual — ícone circular 28px (`background:
  var(--green-light); color: var(--green-dark)`) + título (`font-weight: 600; font-size: 16px`),
  `display: flex; align-items: center; gap: 10px; margin-bottom: 10px`; parágrafo no mesmo estilo
  tipográfico já usado (`font-size: 16px; color: var(--text-muted); line-height: 1.9`).
  Ícone: mesma regra de fallback já existente — `section.icon ?? service.icon`.
- **Bullets opcionais** (ver 1d): se presentes, lista logo a seguir ao parágrafo, dentro da mesma
  coluna de texto.
- Sem fundo/borda de cartão à volta do bloco inteiro (diferente do cartão atual) — a imagem já dá
  peso visual suficiente; separação entre secções feita só pelo `gap: 40px` do contentor
  `.sd-sections` (mantido).

### 1c. Variante "feature" — faixa de destaque, fundo verde-claro

Para uma secção "chave" (ex. missão), marcada explicitamente com `layout: "feature"` no conteúdo
— nunca automática/adivinhada. Equivalente ao bloco "faixa de largura total com fundo colorido +
texto + imagem" da referência do utilizador, adaptado à paleta do site (verde-claro em vez de uma
cor arbitrária).

- Full-width dentro do contentor `.sd-sections` (não respeita o grid 2 colunas dos irmãos —
  ocupa a largura toda do bloco de secções).
- `background: var(--green-light); border-radius: 20px; padding: 40px;` grid interno de 2
  colunas (`1fr 1fr`, `gap: 40px`, `align-items: center`), empilhado no mobile — mesma estrutura
  de coluna imagem/texto da variante split, mas sem alternância de lado (imagem sempre à direita
  no desktop, para diferenciar visualmente da variante split e não competir com a sua lógica de
  alternância); no mobile, imagem sempre acima do texto, igual à split.
- Título maior que o padrão das outras secções, para reforçar destaque: `font-family: 'Playfair
  Display', serif; font-size: 1.3rem; font-weight: 700; color: var(--green-dark)` (sem o ícone
  circular pequeno aqui — o próprio fundo colorido já assinala destaque; se `section.icon` vier
  definido, é ignorado nesta variante, para não sobrecarregar visualmente uma faixa que já tem
  cor de fundo).
- Texto: mesmo estilo tipográfico da split (`font-size: 16px; color: var(--text-muted) ou
  var(--green-dark) com opacidade reduzida` — usar `var(--text-muted)` por consistência, já tem
  contraste suficiente sobre `--green-light`).
- Imagem: `aspect-ratio: 4/3`, `object-fit: cover`, `border-radius: 16px`, sem borda (o fundo
  colorido já delimita).
- Bullets opcionais, mesma regra que a split (1d).

### 1d. Lista de bullets opcional (dentro de split ou feature)

Equivalente ao "bloco imagem+texto com lista de bullets" da referência.

- Novo campo opcional `bullets` (lista bilingue, mesmo tipo já usado em `highlights`), só
  significativo quando a secção tem `image` (split ou feature) — em secções sem imagem
  (variante-cartão atual) o campo não é lido, para não haver dois lugares a mostrar checklist
  parecida com "Destaques" na mesma página.
- Renderização: lista sem marcador nativo, cada item com um `check` verde igual ao já usado em
  `.sd-highlights-box li` mas sem o "box" à volta — reaproveita `.sd-check` (ícone/carácter) +
  `display: flex; gap: 10px; align-items: flex-start`, `font-size: 15px; color: var(--text);
  line-height: 1.6`, `margin-top: 14px` antes do primeiro item, `gap: 8px` entre itens.
- Nunca duplicar o mesmo conteúdo de `highlights` — é conteúdo diferente, específico da secção.

### 1e. Estados obrigatórios (sem exceção)

1. Secção sem `image` → layout cartão atual (`.sd-section-card`), inalterado — nunca tenta
   renderizar split/feature sem imagem.
2. Secção com `image` mas sem `layout` definido → assume `"split"` (default), nunca erro nem
   layout em branco.
3. `layout: "feature"` sem `image` → inválido a nível de schema (o `software-architect` deve
   decidir se bloqueia no schema ou o developer simplesmente ignora `layout` quando `image`
   ausente, caindo na variante cartão — recomendação deste agente: schema deve recusar
   `layout` presente sem `image`, para não deixar conteúdo ambíguo entra no CMS).
4. `bullets` ausente → nenhuma lista renderizada, sem espaço vazio reservado.
5. Serviço sem `sections` de todo → mantém-se o fallback já existente (bloco único
   `.sd-description`), sem alteração.
6. Nenhuma imagem de secção pode ter `alt` vazio (mesma regra já aplicada a `bannerImage`/
   `gallery`).
7. Ordem de leitura no DOM, em qualquer variante: imagem → título → texto → bullets — nunca
   invertida via CSS além do `order` documentado em 1b (que só afeta a posição visual da coluna
   de texto, nunca a da imagem).

### 1f. Placeholder de imagem

Mesmo critério já usado em galeria/banner (480x360 aprox., 4:3, tema ligado à secção) — pode
reaproveitar imagens já existentes de `gallery`/`bannerImage` do mesmo serviço como primeira
iteração, sem obrigar a gerar imagens novas exclusivas por secção.

---

## 2. Serviços relacionados na página de detalhe

Nova secção, inserida **depois** da galeria (2d do design anterior) — ou, se o serviço não tiver
`gallery`, logo depois de `.sd-body` (descrição + destaques) — sempre antes do fecho da página,
dentro do mesmo contentor `maxWidth: 1100px`.

### 2a. Critério de seleção (fechado, para não ficar em aberto para o developer)

**Decisão: os 3 próximos serviços na ordem canónica do array `services` (de `content/index.ts`),
com wrap-around, excluindo sempre o serviço atual.**

- Calcula-se `currentIndex = services.findIndex(s => s.id === service.id)`.
- Relacionados = os 3 elementos seguintes, em ciclo: `services[(currentIndex+1) % 8]`,
  `services[(currentIndex+2) % 8]`, `services[(currentIndex+3) % 8]`.
- **Razão da escolha, e alternativas rejeitadas:**
  - *Aleatório*: rejeitado — quebra o output determinístico do build estático (SSG/SSR
    consistente), dificulta testes automatizados (o `tester` teria de mockar aleatoriedade) e o
    conteúdo mudaria a cada rebuild sem motivo, sem benefício de UX real para 8 itens fixos.
    Também pior para SEO (crawlers veem "conteúdo instável" entre rebuilds).
  - *Todos exceto o atual (7 cartões)*: rejeitado — é a listagem inteira, redundante com
    `/servicos`; o pedido do utilizador é "2-4 cartões", não a lista toda.
  - *Curadoria manual por serviço (campo `relatedIds` no schema)*: seria mais preciso
    editorialmente, mas obriga a preencher/manter 8 listas manualmente sem ganho de UX visível
    (8 serviços é um catálogo pequeno, "próximos 3" já cobre naturalmente todo o catálogo em 3
    visitas). Fica como melhoria futura possível, não necessária agora.
  - **"Próximos 3, com wrap"** dá sempre exatamente 3 cartões, sem depender de nenhum novo campo
    de conteúdo, é determinístico, testável e garante que, navegando serviço a serviço através
    dos relacionados, o utilizador acaba por percorrer o catálogo inteiro.

### 2b. Estrutura visual

- Título de secção, mesmo padrão reduzido já usado na galeria (`section-title`, `font-size:
  1.4rem`) — tag pequena + título, ex. "SERVIÇOS RELACIONADOS" / "OUTROS SERVIÇOS" (texto exato
  fica ao critério do Product Analyst/conteúdo; recomendação: **"Outros serviços"**, mais direto
  que "relacionados" dado que o critério não é semântico).
- Grid: reaproveita `.services-grid` já existente (`repeat(auto-fit, minmax(260px, 1fr))`,
  `gap: 20px`), **sem alteração de CSS** — com só 3 itens, o `auto-fit` já os distribui bem em 3
  colunas no desktop, 1-2 no mobile, sem precisar de uma classe nova.
- Cada cartão: **exatamente o mesmo componente/markup do cartão em `/servicos`**
  (`.service-card.service-card--with-cover`, imagem de capa + ícone sobreposto + título + resumo
  clamp + "Saiba mais"). Recomendação de implementação: extrair o JSX do cartão de
  `ServicesListContent.tsx` para um componente partilhado (ex. `components/ServiceCard.tsx`),
  usado em ambos os locais — evita duplicar markup/estilo entre a listagem e o detalhe (nota de
  implementação, não uma decisão de UX nova).
- `margin-top: 56px` acima da secção (consistente com o espaçamento já usado entre `.sd-body` e
  a galeria).

### 2c. Estados

- Como a seleção é sempre determinística e o catálogo tem 8 serviços fixos (`servicesSchema`
  `.length(8)`), **nunca há estado vazio** aqui — sempre exatamente 3 cartões. Não é necessário
  desenhar um estado "sem relacionados".

---

## 3. Dropdown "Serviços" no menu principal

### 3a. Desktop

O item "Serviços" do `Header` deixa de ser um `<Link>` direto e passa a ser um **botão-gatilho**
(`<button type="button">`) que abre um painel dropdown com os 8 serviços — a navegação direta
para `/servicos` continua disponível através do último item do painel ("Ver todos os serviços →"),
nunca perdida.

**Gatilho:**
- Mesmo estilo visual do link de nav atual (`.nav-links a`), acrescido de um pequeno chevron SVG
  (▾, ícone novo `IconChevronDown` — 12x12, seguindo o padrão `Base` de `components/icons.tsx`)
  à direita do texto, `gap: 4px`, chevron roda 180° quando aberto (`transform: rotate(180deg)`,
  `transition: transform 0.2s`).
- `aria-haspopup="true"`, `aria-expanded={open}`, `aria-controls="services-dropdown"`.
- Estado "ativo" (classe `.active`, mesma lógica que os outros links) quando `pathname` começa
  por `/servicos` ou `/en/services` (`pathname.startsWith(...)`), em vez de igualdade exata —
  única alteração à lógica de active já existente, só para este item.

**Abertura/fecho (comportamento combinado, conforme pedido "rato / clicar / teclado"):**
- `onMouseEnter` no `<li>` que envolve o gatilho e o painel → abre; `onMouseLeave` do mesmo `<li>`
  → fecha (sem delay artificial — não é necessário dado que o painel está imediatamente abaixo,
  sem gap que cause perda de hover).
- `onClick` no gatilho → alterna (`toggle`) o estado — cobre ecrãs táteis onde não há
  `mouseenter` fiável, e permite reabrir por clique mesmo que o hover já tenha fechado.
- Teclado: gatilho é um `<button>` focável por `Tab`; `onFocus`/`onKeyDown` — ao receber foco,
  não abre sozinho automaticamente só por foco (evita abrir sem intenção ao tabular por cima),
  mas `Enter`/`Espaço` (comportamento nativo de `<button>`) aciona o `onClick` já existente e
  abre. Uma vez aberto, `Tab` continua a percorrer os 9 links do painel (8 serviços + "Ver
  todos") como itens de foco normais (não é necessário padrão ARIA `menu`/`menuitem` com
  roving-tabindex — é um "disclosure" com uma lista de links simples, mais simples e mais robusto
  para leitores de ecrã do que simular um menu de aplicação).
- `Escape`, com o painel aberto e o foco dentro dele (gatilho ou qualquer link do painel) →
  fecha o painel e devolve o foco ao gatilho.
- Clique fora do `<li>` (documento) → fecha o painel (listener `mousedown` no `document`,
  removido no cleanup do `useEffect`, comparando `event.target` via `ref` do `<li>`).
- Painel permanece aberto ao mover o rato/foco de um item do painel para outro (está todo dentro
  do mesmo `<li>` com o listener de `mouseleave`).

**Painel:**
- `position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%)` relativo ao
  `<li>` (`position: relative`), `z-index: 110` (acima do `nav` que é 100).
- `background: white; border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 12px
  40px rgba(0,0,0,0.12); padding: 12px;`
- Grid interno de 2 colunas: `display: grid; grid-template-columns: repeat(2, minmax(200px, 1fr));
  gap: 4px; min-width: 420px;` (8 itens → 4 linhas × 2 colunas, painel compacto e não
  excessivamente alto).
- Cada item de serviço: `<Link>` para `serviceDetailPath(service.id, lang)`, layout
  `display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px;
  text-decoration: none; color: var(--text);`, `:hover`/`:focus-visible` → `background:
  var(--green-light); color: var(--green-dark)`.
  - Miniatura: `<Image>` de `service.bannerImage`, `36x36`, `border-radius: 8px; object-fit:
    cover; flex-shrink: 0;` — reaproveita o campo já existente, sem pedir imagem nova. `alt=""`
    aqui (decorativa; o texto do link ao lado já identifica o serviço, evita duplicação para
    leitores de ecrã).
  - Título: `font-size: 13px; font-weight: 500; line-height: 1.3;` (sem resumo — o pedido do
    utilizador foi explicitamente "sem sobrecarregar visualmente", texto+miniatura já chega).
- Último item, "Ver todos os serviços →": `grid-column: 1 / -1` (ocupa a largura toda, fora do
  padrão 2 colunas), separado por `border-top: 1px solid var(--border); margin-top: 8px; padding-
  top: 12px;`, `color: var(--orange); font-weight: 600; font-size: 13px;` — visualmente
  distinguido dos 8 itens acima (é a saída para a listagem completa, não mais um serviço).
- Texto do rótulo: novo campo de conteúdo (ver secção de schema no handoff) — recomendação:
  **"Ver todos os serviços"** / **"View all services"**.

### 3b. Mobile (dentro do menu hambúrguer já existente)

Sem painel flutuante — expansão inline, seguindo o padrão comum de submenu em menus mobile.

- Dentro de `.nav-links.open` (lista vertical já existente), o item "Serviços" mantém-se como
  `<button>` (mesmo componente, comportamento adaptado por `matchMedia`/CSS — ver nota técnica
  abaixo), mas em vez de abrir um painel posicionado, alterna a visibilidade de uma sublista
  **inline**, logo abaixo do próprio item, empurrando os itens seguintes do menu para baixo (sem
  overlay, sem posição absoluta) — comportamento padrão de "acordeão".
- Chevron roda da mesma forma (180°) para indicar o estado aberto/fechado.
- Sublista: `padding-left: 16px`, mesma tipografia dos links de nav mobile mas `font-size: 13px`,
  sem miniaturas (evitar poluição visual em ecrã estreito e poupar peso/pedidos de imagem no
  menu mobile) — só texto, um por linha, `padding: 8px 0`.
- Último item "Ver todos os serviços →" mantém-se, mesmo estilo destacado (cor laranja) que no
  desktop.
- Tocar fora do menu mobile (ou no botão hambúrguer) fecha tudo, incluindo a sublista aberta —
  reaproveita o estado `open` já existente do menu mobile inteiro (ao fechar o menu principal,
  reset do estado da sublista para fechada, para não reabrir já expandida da próxima vez).
- **Nota técnica para o developer**: não é necessário detetar mobile via JS — o mesmo componente
  React com o mesmo estado (`open`) pode renderizar de forma diferente por CSS
  (`@media (max-width: 768px)`), escondendo o painel absoluto do desktop e mostrando a variante
  inline em mobile, ambos condicionados à mesma variável de estado `servicesOpen`. Evita duplicar
  lógica de abertura/fecho entre duas implementações.

### 3c. Acessibilidade (resumo)

- `aria-haspopup="true"` + `aria-expanded` no gatilho, sempre sincronizado com o estado real.
- Painel/sublista só fica no DOM (ou visível) quando `servicesOpen === true` — não depender só de
  `display:none` sem also controlar o foco: quando fechado por `Escape`, o foco tem de voltar
  sempre ao gatilho (nunca perdido no `body`).
- Miniatura de imagem no painel desktop é decorativa (`alt=""`); o link à volta é que carrega a
  informação acessível (nome do serviço).
- Contraste dos itens do painel (`--text` sobre `white`, `--green-dark` sobre `--green-light` no
  hover) já cumpre AA — mesma paleta usada em todo o site, sem cor nova.

---

## Resumo de novos campos de conteúdo (para o `software-architect`/`developer`)

- `content/schemas/index.ts`:
  - `serviceSectionSchema`: acrescentar `image: contentImageSchema.optional()`,
    `layout: z.enum(["split", "feature"]).optional()`, `bullets: bilingualStringList.optional()`.
    Regra de validação cruzada a confirmar com o `software-architect`: `layout` só pode estar
    presente se `image` também estiver (recomendação: `.refine()` no `serviceSectionSchema`).
  - `servicePageSchema`: acrescentar `relatedHeading: bilingualString` (título da secção de
    serviços relacionados — obrigatório, mesmo padrão dos outros campos deste ficheiro).
  - `navSchema`: acrescentar `servicesViewAll: bilingualString` (rótulo "Ver todos os serviços",
    usado no dropdown desktop e na sublista mobile).
  - `components/icons.tsx` + `components/icon-map.tsx`: 1 ícone novo, `IconChevronDown` (12x12 ou
    reaproveitável a 16x16 conforme o resto do enum, `stroke="currentColor"`, `strokeWidth
    {1.6}`), acrescentado a `iconName` só se o padrão do projeto exigir que todo o SVG passe pelo
    enum — alternativa aceitável: `IconChevronDown` como componente solto (não em `iconName`),
    já que é elemento de chrome de navegação, não conteúdo editável via CMS. Recomendação: **não
    entra no enum `iconName`** (não é escolhível em nenhum campo de conteúdo, é puramente
    estrutural do Header), evitando um valor de enum que nunca aparece em `content/`.
- `content/site/servicePage.json`: novo campo `relatedHeading`.
- `content/site/nav.json`: novo campo `servicesViewAll`.
- `content/services/*.json`: pelo menos 1-2 serviços devem ganhar `sections[].image` (e um deles
  `layout: "feature"` + `bullets`) para provar os 3 caminhos (cartão sem imagem / split / feature)
  em produção — mesma lógica já seguida no redesign anterior para `sections`/`gallery`.

BLOCKERS: nenhum. Todas as decisões de UX em aberto foram fechadas neste documento (critério de
seleção dos relacionados, alternância de lado da variante split, texto do rótulo "Ver todos",
comportamento de abertura combinado hover+click+teclado).
