# Design Spec — Fase 3 (ronda de ajustes pós-redesign)

Base: `handoff-30-product-analyst-fase3.md` (FR-1 a FR-7) + decisões já fechadas pelo utilizador
(ver mensagem da tarefa): slider sempre com pelo menos 1 slide, vídeo = embed do YouTube,
secção desativada = ausência total do DOM.

Reutiliza sempre o vocabulário visual existente (`--green`, `--orange`, `--earth`, Playfair
Display + DM Sans, classes `.page-hero`, `.service-card`, `.btn-primary`/`.btn-secondary`) — nada
disto introduz um novo sistema visual, é composição do que já existe.

---

## 1. Slider do hero da homepage

### 1.1 Estrutura
Substitui o fundo estático (`.hero` com `linear-gradient` + `.hero-bg-pattern`) por um carrossel
de slides posicionado em `position: absolute; inset: 0; z-index: 0` dentro de `.hero`. O
`.hero-content` (tag, h1, motto, texto, botões) mantém-se `position: relative; z-index: 2` — fica
**fixo, sobreposto a todos os slides**, sem variar por slide. É a opção mais simples e a única que
garante legibilidade constante do texto (contraste garantido pelo overlay, ver 1.5), independente
de o admin trocar imagens/vídeos no futuro sem coordenar com o texto.

Cada slide é um de dois tipos:
- **Imagem**: `<Image fill>` a cobrir `.hero`, mesmo tratamento visual de `sd-hero-image`.
- **Vídeo**: `<iframe>` do YouTube (`youtube-nocookie.com/embed/<id>?...`), também `fill`,
  `object-fit: cover` via wrapper (`aspect-ratio` forçado + `overflow: hidden`), sem controlos
  visíveis do player (`controls=0`), sem som (`mute=1`), `loop=1`, `playlist=<id>` (truque
  necessário do embed do YouTube para loop funcionar).

### 1.2 Overlay
Mantém-se o mesmo gradiente escuro/verde já usado (`linear-gradient(160deg, #0d3d06 0%, ...
rgba)`), agora como camada intermédia `z-index: 1` entre o slide (z-index 0) e o texto (z-index 2),
tal como já acontece em `.sd-hero-overlay`. Isto garante contraste do texto branco sobre qualquer
imagem/vídeo, sem ajustar overlay por slide.

### 1.3 Navegação
- **Setas** (esquerda/direita), estilo `.btn-secondary` circular pequeno, posicionadas nas margens
  verticais centrais do hero, visíveis em desktop; em mobile ficam mais discretas (opacidade
  reduzida) porque o swipe é o mecanismo principal.
- **Indicadores (dots)**, um por slide, centrados no fundo do hero, acima do fold da stats-bar.
  Dot ativo preenchido a `--orange`, inativos com opacidade reduzida (`rgba(255,255,255,0.4)`).
  Clicar num dot salta diretamente para esse slide.
- **Swipe em mobile**: gesto horizontal nativo (threshold ~50px) avança/recua um slide; não
  interfere com o scroll vertical da página.
- Com **1 slide apenas** (caso mínimo obrigatório), setas e dots não são renderizados — não faz
  sentido navegação para um único item; o slide único ainda passa pela mesma lógica de overlay e
  autoplay/pausa (se for vídeo, autoplay do YouTube ainda aplica, só sem avanço automático porque
  não há próximo slide).

### 1.4 Autoplay
- **Slides de imagem**: autoplay lento, intervalo de 6 segundos por slide, transição fade
  (opacity crossfade ~600ms, não slide horizontal, para não competir com o gesto de swipe).
- **Slides de vídeo**: quando o slide ativo é vídeo, o avanço automático **pausa** — o utilizador
  vê o vídeo (mudo, em loop) até navegar manualmente (seta/dot/swipe) para o slide seguinte. Isto
  evita cortar um vídeo a meio e evita que o vídeo comece a tocar som ou compita com a interação do
  utilizador (decisão do utilizador, já confirmada na tarefa).
- **Pausa em hover/foco**: passar o rato sobre o hero (desktop) ou qualquer elemento do slider
  receber foco de teclado pausa o autoplay de imagens, tal como recomienda WCAG 2.2.2 (conteúdo em
  movimento). Retomar ao sair o hover/foco.
- Sem imagem/vídeo novo a cada intervalo se o utilizador tiver `prefers-reduced-motion: reduce` no
  SO — nesse caso, autoplay desliga-se por completo (fica no primeiro slide, navegação só manual).

### 1.5 Acessibilidade
- Slider marcado com `role="region"` e `aria-label` traduzido (ex. "Destaques" / "Highlights"),
  `aria-roledescription="carousel"` no wrapper.
- Cada slide de imagem usa `alt` traduzível vindo do conteúdo (FR-1.3).
- Cada slide de vídeo tem uma legenda textual traduzível equivalente a `alt` (FR-1.4), usada como
  `aria-label` do `<iframe>` (o YouTube não aceita `alt`) e opcionalmente mostrada como legenda
  discreta sobre o canto inferior do slide, pequena, translúcida — decisão de nice-to-have, não
  bloqueante.
- Setas com `aria-label` ("Slide anterior"/"Próximo slide", traduzido); dots com
  `aria-label="Ir para o slide N"` e `aria-current="true"` no dot ativo.
- Autoplay pausa em hover/foco (já descrito) e respeita `prefers-reduced-motion`.
- Nenhum slide de vídeo arranca com som (mute=1 obrigatório no embed) — regra vinculativa, não
  opcional, porque autoplay de vídeo com som é uma violação de acessibilidade e de UX básica.

### 1.6 Estados
- **Vazio**: nunca ocorre — decisão do utilizador é sempre pelo menos 1 slide; o schema deve
  obrigar `min(1)` (nota para o software-architect). Não há necessidade de desenhar um estado de
  slider vazio.
- **Erro de carregamento de vídeo do YouTube** (ex. bloqueio de rede/ad-blocker): o `<iframe>`
  fica em branco dentro da área do slide — como o overlay + texto do hero não dependem do vídeo
  carregar, a página nunca fica "quebrada" visualmente, só esse slide fica com um retângulo verde
  escuro (cor do overlay) sem imagem de fundo. Não é necessário fallback adicional.
- **Loading inicial**: primeiro slide usa `priority` (como já acontece na imagem do logo no
  Header) para não haver flash de hero vazio no LCP.

---

## 2. Banners de imagem — campanha, contactos, servicos-lista, quem-somos

Replica exatamente o padrão já validado no hero de serviço (`.page-hero.sd-hero` +
`.sd-hero-image` + `.sd-hero-overlay` + `.page-hero-content`), sem nenhuma variação nova:

- Imagem de fundo full-bleed (`<Image fill>`), overlay gradiente verde escuro→claro idêntico ao
  já usado (`sd-hero-overlay`).
- Conteúdo textual sobreposto (`z-index: 2`): tag/eyebrow opcional + `<h1>` + parágrafo de
  resumo — mesma estrutura tipográfica de `.page-hero h1`/`.page-hero p` já existente, sem
  reinventar.
- Altura mínima igual à do hero de serviço (`min-height: 380px`, `320px` em mobile) — mantém
  proporção consistente entre todas as páginas internas.
- `alt` sempre traduzível, seguindo `contentImageSchema`.
- Este banner é **estático** (uma única imagem por página, não um slider) — só a homepage tem
  slider (FR-1); nada no FR-2 pede múltiplos slides aqui, e misturar os dois padrões
  desnecessariamente aumentaria a complexidade de manutenção sem pedido correspondente.
- Cada página mantém o resto do seu conteúdo abaixo do banner exatamente como está hoje — o banner
  substitui apenas o `.page-hero` atual (gradiente sólido, sem imagem) por este com imagem.

Aplicação por página (mesmo padrão, textos já existentes no schema de cada página):
- **Campanha**: banner com o `tag`/`intro` já existentes em `campanha.hero`.
- **Contactos**: banner com `contacts.tag`/`contacts.title`/`contacts.intro`.
- **Servicos (listagem)**: banner com título da secção + `servicesPage.intro`.
- **Quem Somos**: banner com o cabeçalho já existente da página (tag/título institucional).

---

## 3. Cartões de serviço da homepage com imagem

Substitui o bloco de `<div className="service-card">` inline em `HomeContent.tsx` (linhas
157-168) pelo componente `<ServiceCard service={service} lang={lang} />` já existente e já usado
em `/servicos` e nos relacionados do detalhe — zero markup novo, zero CSS novo.

Único ajuste necessário: o `ServiceCard` hoje usa sempre `service.title`/`service.summary`
"canónicos" (linhas 23-24 do componente); a homepage precisa do override `homeTitle`/`homeBlurb`
quando presente (FR-3.2/FR-3.3). Duas formas possíveis, ambas visualmente idênticas — decisão
técnica do developer/architect, não de UX:
(a) o `ServiceCard` passa a aceitar um `service` já "resolvido" (title/summary substituídos antes
de entrar no componente, tal como já é feito hoje em `servicePreview` do `HomeContent.tsx`), ou
(b) o `ServiceCard` ganha props opcionais `titleOverride`/`blurbOverride`.
Recomendo (a): mantém o componente `ServiceCard` simples e sem conhecimento do conceito
"homepage override", que é um detalhe só da homepage — passa-se um objeto `Service` com
`title`/`summary` já trocados por `homeTitle`/`homeBlurb` quando existentes, antes de mapear.

Resultado visual: os 4 cartões da homepage passam a ter a mesma imagem de capa + badge de ícone
sobreposto já usados em `/servicos` (classes `.service-card--with-cover`, `.service-card-cover`,
`.service-icon--badge`), preservando grelha `.services-grid` já existente.

---

## 4. Toggle "ativo/desativado" — especificação para o Decap CMS (Fase 5) e para o developer

Não é uma tela nova (o Decap gera a UI a partir do schema), mas define o contrato que o
software-architect deve fechar no schema Zod e no `config.yml` do Decap:

- **Tipo de campo**: um único booleano por bloco opcional, rotulado no editor como **"Secção
  visível"** (widget `boolean` do Decap, que já renderiza como um toggle/checkbox nativo — nenhum
  componente customizado necessário).
- **Valor por defeito**: `true` — introduzir o campo em conteúdo já existente nunca esconde nada
  que já estava publicado (AC-6.1/AC-6.4 do product-analyst).
- **Posicionamento no formulário do Decap**: o campo "Secção visível" deve aparecer **no topo do
  bloco/secção correspondente**, antes dos restantes campos desse bloco — sinaliza ao editor, antes
  de preencher texto/imagem, que aquele bloco tem um interruptor. Evita o editor preencher tudo e só
  no fim descobrir o toggle escondido a meio do formulário.
- **Comportamento público (decisão já fechada pelo utilizador)**: quando `visible=false`, o bloco
  não é renderizado — **ausência total do DOM**, não `display:none`, não placeholder, sem
  título/heading "fantasma", sem espaço em branco reservado. Isto é responsabilidade do
  componente de página (`if (!section.visible) return null`, avaliado antes de qualquer leitura
  dos restantes campos do bloco — FR-6.5), não de CSS.
- **Sem placeholder no admin**: como o utilizador já resolveu a ambiguidade 3 do product-analyst
  a favor de "ausência total", não há necessidade de desenhar um estado visual exclusivo do
  preview do Decap para blocos desativados — simplifica a implementação (não introduz o custo
  adicional que o product-analyst tinha sinalizado como risco).
- **Onde aplicar**: exatamente a lista já fechada em FR-6.2 do product-analyst (secções do
  detalhe de serviço, galeria, relacionados, valores institucionais da Quem Somos, cada slide do
  slider da homepage, cada banner de página novo do ponto 2 acima). Não se aplica a blocos
  estruturalmente obrigatórios (FR-6.3).
- **Nota especial para os slides do slider (FR-1)**: um slide com `visible=false` é simplesmente
  removido da rotação — o carrossel recalcula o número total de slides e os dots automaticamente,
  sem buraco nem slide em branco intermédio. Se todos os slides forem desativados, isso violaria a
  regra "sempre pelo menos 1 slide visível" — recomendo ao software-architect validar isto no
  build (mesmo princípio de validação Zod já usado no resto do schema): pelo menos 1 slide com
  `visible=true` tem de existir, falha de build clara se não.
- **Nota especial para os banners de página (ponto 2 acima)**: se o banner for desativado, a
  página usa o layout de topo "sem imagem" já existente hoje antes desta ronda (gradiente sólido
  `.page-hero`, sem `.sd-hero-image`/overlay) — não fica sem hero nenhum, só sem imagem (já
  confirmado em FR-6.2 do product-analyst).

---

## Resumo de decisões de UX tomadas nesta especificação (para transparência com o Architect)
1. Texto do hero fixo, só o fundo muda entre slides (não há variação de copy por slide).
2. Autoplay 6s só para imagens, crossfade; pausa automática em slide de vídeo, em hover, em foco,
   e com `prefers-reduced-motion`.
3. Vídeo sempre mudo/loop no embed — vinculativo, sem exceção.
4. Setas + dots só aparecem com 2+ slides.
5. Banners das 4 páginas novas replicam o padrão do hero de serviço sem variação — não são
   sliders.
6. Cartões de serviço da homepage reutilizam `ServiceCard` sem duplicar markup; overrides
   `homeTitle`/`homeBlurb` resolvidos antes do componente, não dentro dele.
7. Toggle "Secção visível" = boolean único, default `true`, topo do formulário no Decap,
   ausência total do DOM quando desativado — sem placeholder em lado nenhum.
