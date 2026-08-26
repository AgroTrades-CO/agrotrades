STATUS: APPROVED
SUMMARY: Repeti, de forma independente (build limpo + npm run start + curl + inspecao de codigo),
apenas os testes de 404 que rejeitei no handoff-10. Os dois bugs bloqueantes reportados
(conteudo invisivel sem JS nas rotas dinamicas de servico; HTML invalido com 2 elementos html
no catch-all de topo) estao ambos corrigidos e confirmados por mim, para os 4 casos pedidos.
Avaliei tambem o trade-off documentado pelo developer (fallback global PT para slug de servico
invalido sob /en/services/...) e considero-o aceitavel, nao bloqueante, dado o contexto tecnico
e a severidade reduzida face aos dois bugs originais. Aprovo para code-reviewer.

VALIDATIONS:
  - npm run build: passou, TypeScript strict + build de producao sem erros, mesmas 28 rotas
    geradas (confirmado no output do Next: /, /_not-found, /campanha, /contactos, /en +
    7 paginas fixas EN, /en/services/[slug] com 8 slugs, /quem-somos, /servicos +
    /servicos/[id] com 8 ids = 28). Nenhuma rota nova nem perdida face ao handoff-10.
  - Build limpo + npm run start (servidor de producao real), curl fresco sem cache residual
    para os 4 casos pedidos:
      * /servicos/nao-existe -> HTTP 404 confirmado; exatamente 1 ocorrencia de "html" de abertura;
        title "Pagina nao encontrada - AGRO TRADES, LDA"; grep por "page-hero" fora de tags script
        (script removido via regex antes de contar) -> 2 ocorrencias (antes: 0). Bug do corpo
        vazio confirmado corrigido.
      * /en/services/nao-existe -> HTTP 404 confirmado; 1 html; "page-hero" fora de script ->
        2 ocorrencias (antes: 0), bug do corpo vazio corrigido tambem aqui. Title observado:
        "Pagina nao encontrada - AGRO TRADES, LDA" (PT) - ver ponto 4 abaixo, trade-off
        documentado pelo developer, confirmado na pratica.
      * /random-xyz -> HTTP 404 confirmado; exatamente 1 ocorrencia de html (antes: 2, aninhado e
        invalido) - bug do HTML duplicado confirmado corrigido; "page-hero" fora de script ->
        2 ocorrencias; title PT (comportamento assumido e documentado, ja avaliado no handoff-10
        como aceitavel).
      * /en/random-xyz -> HTTP 404 confirmado; 1 html (antes: 2); "page-hero" fora de script ->
        2 ocorrencias; title PT (mesma decisao de idioma documentada, consistente com
        /random-xyz).
      * Robots noindex confirmado presente (meta name="robots" content="noindex, nofollow" ou
        "noindex") nos 4 casos - reduz mas nao elimina o impacto do idioma incorreto para
        crawlers ou leitores sem JS.
  - Regressao nas paginas ja aprovadas, repetida no mesmo build: /servicos/arroz -> 200,
    html lang=pt, title "Producao de arroz - AGRO TRADES, LDA"; /en/services/rice -> 200,
    html lang=en, title "Rice Production - AGRO TRADES, LDA"; /quem-somos -> 200, html lang=pt;
    /en/about -> 200, html lang=en. Nenhuma regressao detetada - as alteracoes (dynamicParams =
    false nos dois page.tsx dinamicos, remocao de tags html/body proprias em app/not-found.tsx)
    nao afetaram o comportamento das paginas normais.
  - Inspecao de codigo (app/(pt)/servicos/[id]/page.tsx, app/en/services/[slug]/page.tsx,
    app/not-found.tsx): confirma que a implementacao corresponde exatamente ao que o developer
    descreveu no handoff-11 (dynamicParams = false; not-found.tsx global sem tags html/body
    proprias, com comentario detalhado da decisao de idioma).
  - Nao repeti (conforme instrucao explicita da tarefa): rotas fixas, redirects, seletor de
    idioma, Quem Somos em detalhe - ja aprovados no handoff-10 e nao tocados por esta correcao;
    a checagem rapida de regressao acima confirma que continuam OK.

ISSUES:
  - [NAO BLOQUEANTE, avaliacao do trade-off pedida no ponto 4] Confirmado na pratica: com
    dynamicParams = false, um slug invalido sob /en/services/... cai no fallback global de topo
    (PT) em vez do not-found.tsx do grupo en - o titulo e o texto aparecem em portugues para
    esse caso especifico, apesar do HTTP 404, HTML valido e conteudo visivel estarem corretos.
    Avaliacao: considero este trade-off ACEITAVEL, nao bloqueante, pelas seguintes razoes:
    a) e estritamente melhor que o estado anterior nesse mesmo caminho - antes tinha titulo EN
    correto mas corpo completamente vazio sem JS, um 404 quebrado para qualquer crawler ou leitor
    sem JS; agora tem HTML valido, conteudo visivel e status correto, so a lingua do texto fica
    incorreta; b) o impacto real e limitado - e um cenario de erro (slug invalido), nao uma
    pagina de conteudo, tem robots noindex, e afeta apenas quem aceda diretamente a um URL
    /en/services/ com slug invalido, nunca ligado por nenhuma pagina do site; c) o developer
    documentou a limitacao de forma explicita e investigou alternativas reais (catch-all
    en catchAll) antes de descartar por reintroduzir o bug mais grave; nao e uma omissao
    silenciosa; d) a correcao completa (Route Handler customizado) e uma mudanca de arquitetura
    maior, fora de proporcao para este bugfix, e devia passar por decisao do Architect antes de
    ser implementada. Dito isto, classifico-o como um desvio residual e real a FR-13/AC-07
    (o requisito exige 404 por locale, e este caso especifico nao cumpre isso a 100%) - registo
    para o Code Reviewer e para o Orchestrator considerarem abrir uma tarefa de seguimento
    (com Architect) se a taxa de acessos a slugs invalidos EN for relevante na pratica; nao
    bloqueio esta fase por isto.
  - [NAO BLOQUEANTE, observacao nova, minima] O elemento html da rota /_not-found (nos 4 casos
    testados) ja nao tem atributo lang (antes da correcao, a estrutura invalida tinha pelo
    menos um html lang=pt aninhado). E uma pequena regressao de acessibilidade/SEO face ao
    estado anterior, embora o estado anterior fosse invalido de qualquer forma por ter 2
    elementos html. Nao bloqueia porque HTML valido e conteudo correto pesam mais que o atributo
    lang em falta numa pagina de erro com noindex, mas fica registado para o Code Reviewer
    avaliar se vale a pena adicionar o atributo lang, ja que app/not-found.tsx nao controla a
    tag html gerada automaticamente pelo Next.js para /_not-found.
  - Todas as demais issues nao bloqueantes do handoff-10 (lint pre-existente, next/image sem
    unoptimized, falta de validacao automatizada de traducoes) continuam validas e nao foram
    re-testadas, conforme escopo definido para esta ronda.

BLOCKERS: Nenhum sinal de escalonamento (autenticacao, dados pessoais, pagamentos, schema de
producao) - confirmo novamente a auto-avaliacao do developer, nao foi tocado nada fora dos
ficheiros de rota de 404 identificados.

REQUIRED_NEXT_ACTION: APPROVED - avanca para code-reviewer. Nao ha necessidade de nova ronda com
o developer. Recomendo ao code-reviewer prestar atencao a: 1) o comentario extenso em
app/not-found.tsx e nos dois page.tsx dinamicos, que documenta a causa raiz e a decisao de
idioma - confirmar que a explicacao e clara para quem ler o codigo sem contexto historico dos
handoffs; 2) avaliar se a issue nao bloqueante do trade-off PT/EN (ver ISSUES) justifica uma
tarefa de seguimento formal (possivelmente com software-architect) em vez de ficar apenas
documentada em comentario de codigo.

CONTEXT_FOR_NEXT_AGENT: Testei com build limpo (.next removido antes do build) + npm run start,
nao dev server, para garantir que os resultados refletem o comportamento real de producao.
Servidor foi terminado no fim dos testes (processo na porta 3000 encerrado), nao ficou nada a
correr em background. Os 4 casos de 404 pedidos foram confirmados: 404 real, 1 unico elemento
html, conteudo page-hero visivel fora de tags script (2 ocorrencias em todos os casos,
consistente). A unica diferenca face ao estado ideal e o titulo/texto em PT para
/en/services/nao-existe e /en/random-xyz, avaliado como aceitavel nao bloqueante (ver ISSUES
para razoes detalhadas). Ficheiros relevantes para revisao: app/(pt)/servicos/[id]/page.tsx,
app/en/services/[slug]/page.tsx, app/not-found.tsx.
