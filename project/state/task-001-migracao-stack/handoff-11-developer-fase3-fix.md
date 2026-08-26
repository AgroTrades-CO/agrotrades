STATUS: COMPLETED
SUMMARY: Corrigidos os dois bugs de 404 reportados no handoff-10 do Tester (corpo vazio sem JS nas
rotas dinâmicas de serviço; HTML inválido com 2 elementos <html> no catch-all de topo). Reproduzi
ambos antes de corrigir (curl + grep confirmou 0 ocorrências de "page-hero" fora de <script> nas
rotas dinâmicas; contagem de "<html" confirmou 2 em /random-xyz), corrigi, e voltei a testar depois
(ver VALIDATIONS) — em todos os 4 casos pedidos (PT/EN dinâmico + catch-all PT/EN): HTTP 404,
exatamente 1 <html>, e conteúdo visível ("page-hero") fora de <script>.

INVESTIGAÇÃO E CAUSA RAIZ (relevante para o Tester e para o Code Reviewer):
  1) Bug do corpo vazio: confirmei, com testes isolados, que QUALQUER chamada a `notFound()`
     resolvida em runtime (não em build-time) no Next.js 16.3.2 devolve uma "shell" cujo <body>
     só contém um placeholder de streaming — o conteúdo visível (heading, texto, botão) só existe
     dentro do payload RSC do <script>, nunca como HTML estático real. Confirmei que isto é
     independente de: bundler (reproduzido com Turbopack e com `next build --webpack`),
     `dynamic="force-dynamic"` vs `force-static`, presença/ausência de generateStaticParams, e
     User-Agent do cliente (testei também com UA de Googlebot — sem efeito, ao contrário do que
     inicialmente suspeitei sobre "htmlLimitedBots"). Uma renderização dinâmica NORMAL (sem
     notFound(), ex. /servicos/arroz sob force-dynamic) renderiza perfeitamente sem shell — o
     problema é especificamente a passagem por notFound() em runtime. Não encontrei nenhuma opção
     de configuração pública do Next.js para desativar este comportamento; é o mecanismo de
     recuperação por Suspense que o App Router usa sempre que a fronteira de erro (not-found) é
     resolvida fora do build-time.
  2) Bug do HTML duplicado: a rota interna especial "/_not-found" (usada porque não há
     app/layout.tsx partilhado, por causa do padrão "multiple root layouts") já é envolvida
     automaticamente pelo Next.js num <html><body> próprio. O antigo app/not-found.tsx devolvia
     TAMBÉM as suas próprias tags <html>/<body>, resultando em <html> aninhado dentro de <body>
     (HTML inválido).

CORREÇÕES APLICADAS:
  1) app/(pt)/servicos/[id]/page.tsx e app/en/services/[slug]/page.tsx: adicionado
     `export const dynamicParams = false`. A lista de serviços é finita e conhecida em build-time
     (8 serviços); qualquer "id"/"slug" fora dessa lista passa a ser resolvido como 404 em
     build-time (mesmo mecanismo, sem streaming, que já funciona para /servicos/arroz), eliminando
     a shell. Removi os ficheiros not-found.tsx que tinha inicialmente adicionado dentro de
     [id]/ e [slug]/ (tentativa anterior que não resolveu o problema por si só) — com
     dynamicParams=false esses ficheiros ficariam inalcançáveis (o Next.js já não invoca o
     page.tsx para params desconhecidos), por isso removi-os para não deixar código morto.
  2) app/not-found.tsx: já não devolve as suas próprias tags <html>/<body> — devolve apenas o
     conteúdo do corpo, deixando o wrapper automático do Next.js (para a rota especial
     "/_not-found") ser o único <html> da resposta. Adicionei também `export const metadata`
     (título + robots noindex/nofollow), que faltava.

DECISÃO DE IDIOMA (pedida explicitamente no ponto 3 da tarefa, documentada também no código):
  O fallback de topo (app/not-found.tsx, rota "/_not-found") mostra SEMPRE texto em PT, mesmo para
  caminhos sob "/en/...". Decisão consciente, não esquecimento: sem middleware (fora do âmbito por
  decisão de arquitetura), este componente não tem forma fiável de inspecionar o pathname original
  para escolher PT/EN — o Next.js já decidiu, ao chegar aqui, que o caminho não pertence a nenhuma
  das duas árvores de rotas conhecidas. Avaliei a alternativa de um catch-all
  "app/en/[...catchAll]/page.tsx" que forçaria estes casos a cair dentro da árvore "en" (mostrando
  texto em inglês corretamente) — CHEGUEI A IMPLEMENTAR E TESTAR esta alternativa, mas descartei-a
  porque ela reintroduz exatamente o bug do ponto 1 (corpo vazio sem JS): esse catch-all também
  teria de chamar notFound() em runtime, com a mesma shell resultante. Manter sempre PT neste
  fallback de topo evita esse regresso, ao custo de mostrar texto em PT para 404s genuinamente
  desconhecidos sob "/en/...". Isto é um cenário raro (rotas fixas EN desconhecidas), diferente do
  cenário mais comum de "id"/"slug" de serviço inválido, que é tratado no ponto seguinte.

EFEITO COLATERAL DA CORREÇÃO 1 A SINALIZAR EXPLICITAMENTE (trade-off, não escondido):
  Antes desta correção, o título de /servicos/nao-existe e /en/services/nao-existe já estava
  correto por idioma (só o corpo estava vazio). Com `dynamicParams = false`, params desconhecidos
  destes dois segmentos dinâmicos deixam de ser tratados pelo page.tsx/generateMetadata da própria
  rota — o Next.js decide, antes de sequer invocar a página, que "não há rota" para esse parâmetro,
  e cai no MESMO fallback de topo global (PT) usado para caminhos completamente desconhecidos, em
  vez de cair no not-found.tsx do respetivo grupo "(pt)"/"en". Resultado prático, confirmado por
  curl: /servicos/nao-existe mostra corretamente "Página não encontrada" em PT (sem alteração
  percetível); mas /en/services/nao-existe agora também mostra o título/texto em PT (em vez de
  "Page not found" em inglês) — o conteúdo é válido, visível, e o HTTP 404 está correto, mas a
  língua deixa de ser inglesa para este caso específico. Confirmei que isto é uma limitação do
  Next.js 16.3.2 com o padrão "multiple root layouts" (sem middleware): não encontrei forma de
  fazer o Next.js cair no not-found.tsx do grupo "en" quando dynamicParams=false e o parâmetro é
  desconhecido — ele salta sempre para o fallback de topo absoluto. Uma correção completa (título
  em inglês + corpo visível + 404 real, os três em simultâneo) exigiria substituir page.tsx por um
  Route Handler que construísse a resposta HTML manualmente, fora do pipeline de streaming do App
  Router — isso implicaria reescrever também a renderização das páginas de serviço VÁLIDAS (não só
  o caminho de erro), o que ultrapassa o âmbito deste bug pontual e devia ser uma decisão do
  Architect, não uma decisão unilateral minha. Sinalizo isto explicitamente para o Tester e para o
  Orchestrator decidirem se este trade-off é aceitável ou se querem investir numa correção mais
  profunda numa tarefa futura.

ARTIFACTS:
  Alterado:
    app/(pt)/servicos/[id]/page.tsx (+ dynamicParams = false, com comentário detalhado)
    app/en/services/[slug]/page.tsx (+ dynamicParams = false)
    app/not-found.tsx (removidas tags <html>/<body> próprias; + metadata; comentário atualizado
    com a decisão de idioma e a razão por que o catch-all "en" foi testado e descartado)
  Criado e depois removido (não ficou no repositório):
    app/(pt)/servicos/[id]/not-found.tsx, app/en/services/[slug]/not-found.tsx (tentativa que não
    resolveu o bug por si só; ficariam código morto após a correção definitiva com dynamicParams)
    app/en/[...catchAll]/page.tsx (alternativa testada para a decisão de idioma do ponto 3;
    descartada por reintroduzir o bug do ponto 1 — ver acima)

VALIDATIONS:
  - `npm run build`: passa (TypeScript strict + build de produção), 28 rotas geradas — mesmo número
    de antes da correção (nenhuma rota nova nem perdida).
  - Build limpo (.next removido) + `npm run start`, testado com curl fresco (sem cache residual)
    para os 4 casos pedidos:
      * /servicos/nao-existe -> 404; 1 <html>; "page-hero" aparece 2x fora de <script>; <title>
        "Página não encontrada — AGRO TRADES, LDA".
      * /en/services/nao-existe -> 404; 1 <html>; "page-hero" aparece 2x fora de <script>; <title>
        "Página não encontrada — AGRO TRADES, LDA" (PT — ver EFEITO COLATERAL acima, trade-off
        documentado, HTTP 404 e HTML válido confirmados).
      * /random-xyz -> 404; 1 <html> (antes: 2); "page-hero" 2x fora de <script>; título PT.
      * /en/random-xyz -> 404; 1 <html> (antes: 2); "page-hero" 2x fora de <script>; título PT
        (decisão documentada — ver acima).
  - Regressão: reconfirmei, no mesmo build, que as páginas já aprovadas continuam OK:
    /, /servicos, /servicos/arroz (200, <html lang="pt">, título "Produção de arroz — AGRO
    TRADES, LDA"), /campanha, /contactos, /quem-somos, /en, /en/services, /en/services/rice (200,
    <html lang="en">, título "Rice Production — AGRO TRADES, LDA"), /en/campaign, /en/contact,
    /en/about — todos 200, sem alteração de comportamento.
  - Testei também com `next build --webpack` (bundler alternativo) para confirmar que o bug do
    corpo vazio não era específico do Turbopack — reproduzido igualmente, o que ajudou a excluir
    essa hipótese e a chegar à causa raiz correta (notFound() em runtime, não o bundler).

ISSUES:
  - [DOCUMENTADO, ver EFEITO COLATERAL acima] /en/services/<slug-inválido> mostra agora
    título/texto em PT em vez de inglês (antes desta correção já estava em inglês, mas com o corpo
    vazio). Conteúdo visível, HTML válido, HTTP 404 corretos; só a língua deste caso específico
    fica PT. Recomendo ao Tester validar explicitamente se este trade-off é aceitável dado o
    requisito FR-13/AC-07, ou se o Orchestrator quer escalar para o Architect uma solução baseada
    em Route Handler (fora do âmbito deste bugfix pontual).
  - [NÃO BLOQUEANTE, pré-existente, não tocado] `npm run lint` continua a falhar por incompatibilidade
    ESLint 9 / `.eslintrc.json` — confirmado outra vez, não alterado nesta correção.
  - [FORA DE ÂMBITO, apenas registo] O servidor de produção pode ter ficado a correr na porta 3000
    entre rondas de teste anteriores (matei os processos que encontrei via `netstat`/`taskkill`
    antes de cada build limpo); não deixei nenhum servidor a correr ao terminar este trabalho.

BLOCKERS: Nenhum. Não tocei em autenticação, tokens, sessões, integração bancária, schema de
produção, contratos de API de terceiros, nem dados pessoais de clientes — apenas nos 2 ficheiros de
rota de 404 identificados pelo Tester.

REQUIRED_NEXT_ACTION: Próximo agente é o `tester`. Repetir APENAS os testes de 404: (1)
/servicos/nao-existe e /en/services/nao-existe (rota dinâmica de serviço) — confirmar HTTP 404, 1
<html>, "page-hero" visível fora de <script>, e decidir explicitamente se aceita o título em PT
para o caso EN (trade-off documentado acima) ou se quer escalar; (2) /random-xyz e /en/random-xyz
(catch-all de topo) — confirmar HTTP 404, exatamente 1 <html>, conteúdo visível, e validar a
decisão de idioma (sempre PT) documentada no código e neste handoff. Não é necessário repetir os
restantes testes (rotas fixas, redirects, seletor de idioma, Quem Somos) — não foram tocados por
esta correção, confirmei eu próprio que continuam OK (ver VALIDATIONS "Regressão").

CONTEXT_FOR_NEXT_AGENT: A causa raiz do bug 1 é um comportamento do Next.js 16.3.2 (não um erro no
nosso código): qualquer notFound() resolvido em runtime (não em build-time) devolve uma "shell" sem
conteúdo estático visível, confirmado independente de bundler/config. A correção (`dynamicParams =
false`) resolve isto obrigando o 404 a ser decidido em build-time, mas tem o efeito colateral de
fazer o Next.js usar o fallback de topo global (sempre PT) em vez do not-found.tsx do grupo "en"
para "slugs" de serviço desconhecidos — ver EFEITO COLATERAL e ISSUES acima. Se o Tester ou o
Orchestrator considerarem este trade-off inaceitável, a correção completa exige um Route Handler
customizado (fora do âmbito deste bugfix, provavelmente requer software-architect). O servidor de
teste não ficou a correr — qualquer novo teste do Tester deve começar com `npm run build` +
`npm run start` do zero.
