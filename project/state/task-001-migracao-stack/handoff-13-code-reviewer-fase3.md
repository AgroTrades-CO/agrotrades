STATUS: APPROVED
SUMMARY: Revisão de qualidade técnica da Fase 3 completa, por leitura de código (comportamento já
validado duas vezes pelo Tester, handoffs 10 e 12). Código é limpo, bem comentado e consistente com
as convenções já estabelecidas nas Fases 1-2. As decisões não-óbvias (padrão "multiple root
layouts" sem app/layout.tsx partilhado; causa raiz dos dois bugs de 404 corrigidos pelo Developer;
trade-off aceite de dynamicParams=false) estão documentadas em comentário no próprio código, não só
nos handoffs — quem tocar nestes ficheiros no futuro sem ler os handoffs ainda vai encontrar a
explicação. Confirmo por leitura, não apenas pela afirmação do Developer, que os 3 achados da minha
revisão anterior (handoff-08) estão mesmo corrigidos.
ARTIFACTS: Nenhum ficheiro alterado — revisão de leitura apenas (o code-reviewer não tem
ferramenta de escrita; este handoff foi gravado pelo Orchestrator a partir do resultado do agente).
VALIDATIONS (leitura de código):
  - app/not-found.tsx: confirmado que já não devolve <html>/<body> próprios (corrige o HTML
    aninhado); comentário explica com precisão a causa raiz (rota especial "/_not-found" já
    envolvida pelo Next.js) e a decisão de idioma sempre-PT, incluindo a alternativa "catch-all en"
    testada e descartada — nível de detalhe adequado para quem herdar o código sem contexto dos
    handoffs.
  - app/(pt)/servicos/[id]/page.tsx e app/en/services/[slug]/page.tsx: dynamicParams = false com
    comentário que explica por que existe (shell vazia do notFound() em runtime, comportamento do
    Next.js 16.3.2, não bug nosso) e remete para o handoff quanto ao efeito colateral de idioma —
    não é uma gambiarra silenciosa, é uma solução deliberada com trade-off assinalado no próprio
    código, fácil de encontrar por quem for investigar um 404 em inglês incorreto no futuro.
  - content/routes.ts e content/service-slugs.ts: routing centralizado, comentado, usado
    consistentemente (grep confirma que Header/HomeContent/ServicesListContent usam path()/
    serviceDetailPath()/alternatePath(), não caminhos escritos à mão).
  - app/(pt)/layout.tsx vs app/en/layout.tsx: quase idênticos (head com preconnect/fonts, body com
    Header/Footer/WhatsappFloat), o que é esperado do padrão "multiple root layouts" do App Router
    — não há forma de partilhar um root layout comum quando cada um precisa de emitir um <html
    lang> diferente sem middleware. Duplicação mínima e inerente ao padrão escolhido pela
    arquitetura, não um problema de disciplina do Developer.
  - components/Header.tsx, components/pages/HomeContent.tsx, components/pages/
    ServicesListContent.tsx: confirmado que "Saiba mais"/"Saber mais" vêm de
    sections.services.learnMore[lang] / about.learnMoreLabel[lang], o tooltip "Disponível numa fase
    futura" já não existe (seletor de idioma via alternatePath, sem disabled/title), e os dois root
    layouts constroem metadata.title/description a partir de content/site/meta.json via buildTitle()
    — os 3 achados do handoff-08 estão mesmo resolvidos.
  - content/schemas/index.ts: metaSchema, notFoundSchema, servicesPageSchema, servicePageSchema,
    aboutPageSchema seguem exatamente o padrão bilingualString já usado desde a Fase 2, com
    comentários a justificar cada campo não-traduzível (ex. tag de período em campanha.hero.tag,
    slugs EN em ficheiro próprio fora de content/) — nenhuma inconsistência de convenção.
  - components/pages/AboutContent.tsx: página Quem Somos e grid de equipa (team.map) simples,
    direta, sem duplicação; campo opcional `frase` tratado corretamente com renderização condicional.
  - next.config.mjs: 6 redirects da tabela D-5, comentário aponta para a secção da arquitetura,
    sem lógica supérflua.
ISSUES:
  - [SUGESTÃO] app/not-found.tsx / rota especial "/_not-found": o <html> gerado automaticamente pelo
    Next.js para esta rota interna já não tem atributo lang (observação nova do Tester no
    handoff-12). Avaliação: é uma pequena regressão de acessibilidade/SEO face ao estado anterior à
    correção, mas o estado anterior era HTML inválido (2 elementos <html>) — não há comparação
    justa. O componente app/not-found.tsx não controla essa tag (é gerada pelo próprio framework
    para esta rota especial), e a página tem noindex/nofollow, o que reduz bastante o impacto real
    em SEO. Não é bloqueador. Não vejo forma limpa de corrigir sem middleware (fora do âmbito) ou
    sem reintroduzir HTML aninhado. Registo como item de baixa prioridade para revisitar só se o
    site vier a adotar middleware por outro motivo no futuro — não vale abrir uma tarefa dedicada só
    para isto agora.
  - [SUGESTÃO] O trade-off dynamicParams=false (slug EN inválido cai no fallback global PT em vez do
    404 localizado em EN) está implementado de forma limpa e documentada — concordo com a avaliação
    do Tester (handoff-12) de que é aceitável. Não é uma solução frágil: o comentário no código
    explica a causa, a alternativa testada e descartada, e remete para o handoff para mais detalhe.
    Não bloqueia, mas sinalizo — tal como o Tester já fez — que é um desvio residual real a
    FR-13/AC-07 (404 por locale não é 100% cumprido para este caso raro) e concordo que, se o
    Orchestrator quiser eliminar por completo, isso implica um Route Handler customizado e deveria
    passar pelo software-architect antes de ser implementado — não uma correção pontual do
    developer.
  - [SUGESTÃO] Duplicação entre app/(pt)/layout.tsx e app/en/layout.tsx (head com preconnect/fonts
    idêntico) é inerente ao padrão "multiple root layouts" sem middleware; poderia reduzir-se
    extraindo o bloco <head> para um pequeno componente partilhado (ex. <SiteFonts />), mas o ganho
    é marginal (7 linhas) e nenhuma convenção do context.md/architecture-proposal.md exige isto —
    fica como nice-to-have, não bloqueador.
  - Confirmo, sem objeção, as issues não-bloqueantes já registadas pelo Tester nos handoffs 10/12
    (lint pré-existente ESLint 9 vs .eslintrc.json; next/image sem unoptimized nas fotos de equipa;
    ausência de validação automatizada/CI de traduções em falta) — nenhuma delas é nova nem foi
    introduzida nesta fase, todas já corretamente classificadas como não-bloqueantes e fora do
    âmbito deste code review de qualidade.
BLOCKERS: Nenhum.
REQUIRED_NEXT_ACTION: Fase 3 aprovada do ponto de vista de qualidade técnica — pronta para
confirmação humana do preview. Recomendo ao Orchestrator abrir uma nota de seguimento (não
bloqueadora, sem necessidade de tarefa formal imediata) para o trade-off dynamicParams=false, a
revisitar apenas se no futuro o site adotar middleware por outro motivo ou se a taxa de acessos a
slugs EN inválidos se revelar relevante.
CONTEXT_FOR_NEXT_AGENT: Nada — este é o último passo do fast path desta fase.
