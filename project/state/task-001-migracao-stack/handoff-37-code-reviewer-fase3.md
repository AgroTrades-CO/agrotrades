STATUS: APPROVED
SUMMARY: Revisão de qualidade técnica da ronda Fase 3 (slider do hero, visibilidade transversal,
banners novos, CSP). Código bem estruturado, sem duplicação relevante, convenções do handoff-34
respeitadas à letra. Nenhum bloqueador encontrado. Já validado pelo Tester (handoff-36, APPROVED) e
pelo Orchestrator em browser real (comportamento interativo do slider confirmado).
ARTIFACTS: Nenhum ficheiro alterado — revisão de leitura apenas (o code-reviewer não tem
ferramenta de escrita; este handoff foi gravado pelo Orchestrator a partir do resultado do agente).
ISSUES:
- [SUGESTÃO] content/schemas/index.ts — heroImageSlideSchema/heroVideoSlideSchema usam .strict()
  em cada membro da união discriminada (linhas 150-167), confirmando literalmente a recomendação do
  handoff-34 secção B ("recomendado, para apanhar erros de cola no Decap"). Nenhum campo cruzado
  vaza entre os dois casos (imagem não tem youtubeId/caption; vídeo não tem image/alt). Bem
  modelado.
- [SUGESTÃO] O .refine() de heroSlidesSchema (linha 179-182) tem mensagem de erro clara e acionável
  por leitura direta do código, não só "parece funcionar": nomeia o campo ("Secção visível"), o
  ficheiro exato (content/site/hero.json) e a ação a tomar. O Tester confirmou por execução
  (handoff-36, ponto 3) que a mensagem produzida pelo next build é literalmente essa string —
  consistente com o texto do schema.
- [SUGESTÃO] youtubeEmbedUrl() (content/schemas/index.ts:186-199) é confirmado por grep como o
  único sítio do repositório que constrói o URL do iframe do YouTube — o único consumidor é
  components/HeroSlider.tsx:115, que chama o helper em vez de montar a string inline. id entra no
  template só depois de validado pelo regex ^[A-Za-z0-9_-]{11}$ de youtubeVideoId (aplicado no
  schema antes de o valor chegar ao componente) — protege contra injeção de caracteres fora desse
  conjunto (aspas, /, ?, &, etc.) mesmo vindo de conteúdo confiável via Decap. Domínio e todos os
  parâmetros (mute=1 incluído) são fixados em código, não em conteúdo.
- [SUGESTÃO] components/HeroSlider.tsx — único useEffect de autoplay (linhas 58-65) usa setTimeout
  (não setInterval) com cleanup clearTimeout no return, e as dependências (hasMultiple,
  reducedMotion, paused, activeSlide, next) recriam o timer a cada slide — não há timer duplicado
  nem fuga de memória; o padrão "1 timeout, reagendado a cada troca de slide" é mais seguro que
  setInterval porque não acumula drift quando paused/reducedMotion mudam a meio. Toda a lógica de
  pausa (vídeo, hover, foco, prefers-reduced-motion) está centralizada nas guard clauses desse único
  efeito (linhas 59-62) — não está espalhada por vários sítios; os handlers
  onMouseEnter/Leave/onFocus/Blur/onTouchStart/End só atualizam estado (paused, touchStartX), a
  decisão de avançar ou não fica toda no efeito. Componente limpo e fácil de seguir.
- [SUGESTÃO] content/index.ts — as 4 funções de filtragem (visibleHeroSlides como const,
  visibleSections, visibleGallery, visibleValues) seguem o mesmo padrão entre si: filtram por
  .visible, e as duas com bloco-toggle (visibleGallery, visibleValues) aplicam a mesma forma
  "bloco ? array.filter(...) : []". Grep em components/ confirma que .filter sobre visible só existe
  em content/index.ts — os componentes (ServiceDetailContent.tsx, AboutContent.tsx,
  HomeContent.tsx) só consomem as listas já filtradas, sem reimplementar a lógica. Único ponto de
  atenção (não bloqueador): visibleHeroSlides é uma constante calculada uma vez no módulo, enquanto
  as outras três são funções — assimetria justificada (hero é singleton, os outros três são
  parametrizados por service/page), não é inconsistência sem razão.
- [SUGESTÃO] Os 4 banners novos (CampaignContent, ContactContent, ServicesListContent,
  AboutContent) e o hero de serviço (ServiceDetailContent) reutilizam exatamente as mesmas 3 classes
  CSS (sd-hero, sd-hero-image, sd-hero-overlay, definidas uma única vez em app/globals.css:377-391)
  — confirmado por grep, zero CSS duplicado entre eles.
- [SUGESTÃO] next.config.mjs — a alteração de CSP acrescenta só frame-src (diretiva antes ausente)
  com exatamente 2 hosts nomeados (youtube-nocookie.com, www.google.com), com comentário a justificar
  cada um. Nenhuma outra diretiva (default-src, script-src, img-src, connect-src, object-src,
  frame-ancestors) foi tocada — confirmado por leitura integral do ficheiro. frame-ancestors 'none'
  mantém-se. Alteração mínima e bem documentada, corrige de caminho o bug pré-existente do Google
  Maps (RISCO-3 do handoff-34).
- [SUGESTÃO] Os 4 SVGs placeholder de public/images/banners/ seguem o padrão já estabelecido nos
  banners de serviço (SVG geométrico local, sem URL externa, alt="" decorativo com
  aria-hidden="true" no componente) — consistente com o precedente do handoff-19. Placeholder, não
  fotografia real — já sinalizado e aceite (Developer/Tester), não é achado novo.
- [SUGESTÃO, não bloqueador, reiterando issue já conhecida] .hero-bg-pattern órfã em
  app/globals.css — cosmético, sinalizado pelo Developer, sem impacto funcional.
BLOCKERS: nenhum.
REQUIRED_NEXT_ACTION: nenhuma correção necessária. Pronto para aceitação humana do preview.
CONTEXT_FOR_NEXT_AGENT: nada — este é o último passo do fast path.
