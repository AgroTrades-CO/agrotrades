STATUS: REJECTED
SUMMARY: Validei independentemente a Fase 3 (build, npm run start + curl, inspecao de codigo). A
maioria do trabalho esta correta e bem executada: build passa e gera as 28 rotas esperadas, PT fica
mesmo na raiz sem prefixo /pt/, html lang e title corretos e distintos por pagina/idioma,
os 6 redirects 301(308) funcionam, o seletor de idioma preserva a pagina atual em 10/10 paginas
testadas (PT->EN e EN->PT), a pagina Quem Somos tem o texto institucional completo mais os 3
membros placeholder (nome, cargo em pt/en, foto placeholder, frase opcional so em 2 dos 3 -
coerente com opcional), os 3 achados do code-reviewer anterior estao mesmo corrigidos (Saiba
mais/Saber mais vem de conteudo, tooltip antigo desapareceu, metadata varia por pagina/idioma),
nao ha emojis em app/components/content, e o npm run lint falha por razao pre-existente confirmada
(ESLint 9 vs .eslintrc.json), nao introduzida nesta fase.
Encontrei, no entanto, dois problemas reais e reproduziveis nas paginas 404 (ponto 2/6 da minha
tarefa) que considero bloqueantes para aprovacao, por tocarem diretamente o requisito FR-13/AC-07
(404 por locale) mencionado em D-5: (1) o corpo HTML servido pelo servidor para os 404 das rotas
dinamicas de servico (/servicos/[id], /en/services/[slug]) esta visualmente vazio sem JavaScript -
o conteudo real do 404 (titulo, texto, botao) so existe dentro do payload RSC, nunca e renderizado
como HTML visivel; (2) o 404 catch-all de topo (/random-xyz, fora de qualquer rota conhecida) e o
mesmo em qualquer caminho sob /en/... desconhecido produzem HTML com dois elementos html aninhados
(invalido) e mostram sempre o texto 404 em PT, mesmo para URLs sob /en/ - o proprio developer ja
tinha sinalizado esta segunda limitacao como comportamento assumido (fallback assume pt), mas nao
tinha sinalizado nem o HTML invalido nem o corpo vazio sem JS.

VALIDATIONS:
  - npm run build: passou, TypeScript strict + build de producao sem erros. Saida do Next confirma
    as 28 rotas: /, /_not-found, /campanha, /contactos, /en, /en/about, /en/campaign, /en/contact,
    /en/services + 8 /en/services/[slug], /quem-somos, /servicos + 8 /servicos/[id] = 28. Confirma o
    numero reportado pelo developer.
  - npm run start + curl (servidor de producao real, nao dev):
      * PT: /, /servicos, /servicos/arroz, /servicos/cereais, /servicos/moageira, /campanha,
        /contactos, /quem-somos -> todos 200, html lang=pt, title distinto por pagina
        (ex.: Producao de arroz, Producao de cereais e legumes, Moageira e processamento
        industrial).
      * EN: /en, /en/services, /en/services/rice, /en/services/cereals, /en/services/milling,
        /en/campaign, /en/contact, /en/about -> todos 200, html lang=en, title distinto
        (ex.: Rice Production, Milling and Industrial Processing), slugs traduzidos confirmados
        (arroz->rice, cereais->cereals, moageira->milling).
      * Confirmado que /pt e /pt/ NAO servem conteudo valido (ambos acabam em 404/redirect de
        normalizacao de trailing slash) - PT esta mesmo so na raiz, sem prefixo, como exigido.
      * Redirects: /servicos.html->/servicos (308), /campanha.html->/campanha (308),
        /contactos.html->/contactos (308), /index.html->/ (308), /home->/ (308),
        /servico.html?id=arroz->/servicos/arroz?id=arroz (308, com ?id= residual, tal como o
        developer documentou e classificou como recomendado nao obrigatorio - aceito, nao
        bloqueante).
      * Seletor de idioma testado em 10 paginas (mais do que os 3 minimos pedidos): PT
        arroz->/en/services/rice, EN rice->/servicos/arroz, PT quem-somos->/en/about, EN
        about->/quem-somos, PT contactos->/en/contact, EN contact->/contactos, PT
        campanha->/en/campaign, EN campaign->/campanha, PT servicos->/en/services, EN
        services->/servicos. Todos preservam a pagina atual - confirmado, nenhum volta a homepage.
      * Quem Somos: texto institucional completo presente (Somos uma empresa mocambicana...) mais
        grid de equipa com 3 cartoes de equipa, cada um com titulo h3 (nome), classe team-role
        (cargo, pt/en diferentes confirmados: Cargo Exemplo vs Example Role), foto
        /images/team/placeholder.svg, e frase (classe team-quote) presente em 2 dos 3 membros
        (o terceiro nao tem, coerente com frase curta opcional).
      * 404 dinamico de servico invalido: /servicos/nao-existe -> 404 real (HTTP status confirmado
        via curl), title Pagina nao encontrada correto no head, mas o body renderizado pelo
        servidor contem apenas um div hidden com marcadores de streaming seguido de scripts - zero
        ocorrencias da classe page-hero fora dos blocos script (confirmado por grep). O mesmo se
        repete em /en/services/nao-existe (titulo em ingles correto, corpo vazio). A pagina e
        servida como prerender estatico (cabecalho x-nextjs-prerender: 1, Content-Length fixo, sem
        streaming pendente) - nao e um problema de timing, e o HTML final mesmo.
      * 404 catch-all de topo: /random-xyz -> 404 real, mas o HTML devolvido tem DOIS elementos
        html (confirmado por contagem) - um elemento html vazio a envolver o body exterior, e um
        segundo elemento html com lang=pt aninhado dentro desse body, contendo o conteudo visivel
        real. HTML invalido (elemento html nao pode ser filho de body). /en/random-xyz -> mesmo
        problema de aninhamento, e o conteudo visivel esta em PT (Pagina nao encontrada), nao em
        ingles, apesar do caminho estar sob /en/.
  - Robustez do schema Zod para os campos novos desta fase: nao consegui reproduzir uma build a
    falhar removendo deliberadamente uma traducao (o sandbox do Tester bloqueou a escrita no
    ficheiro de conteudo - restricao correta, nao devo alterar ficheiros do projeto). Confirmei por
    inspecao de codigo que content/schemas/index.ts define aboutPageSchema (e os restantes schemas
    novos: metaSchema, notFoundSchema, servicesPageSchema, servicePageSchema) usando
    bilingualString, que exige pt e en como string com minimo de 1 caracter, obrigatorios; e que
    content/index.ts invoca a funcao parseContent para todos eles no momento de carregamento do
    modulo (build time), com uma funcao de erro que lista os issues do Zod e o ficheiro a corrigir,
    de forma legivel. Isto da confianca razoavel de que o comportamento seria o esperado, mas fica
    registado como validacao por inspecao, nao por execucao real de uma build a falhar - distincao
    que o Code Reviewer deve ter em conta.
  - npm run lint: falha com o mesmo erro reportado pelo developer (ESLint nao encontra ficheiro
    eslint.config - v9.39.5 exige flat config, o repo so tem .eslintrc.json). Nao toquei em
    .eslintrc.json nem em package.json; aceito a afirmacao do developer de que e pre-existente
    (issue nao bloqueante, mas real e a resolver noutra tarefa).
  - Grep por emojis (intervalos Unicode de emoji) em app/, components/, content/: zero ocorrencias.
  - Inspecao de components/Header.tsx: seletor de idioma via funcao alternatePath, sem propriedade
    disabled nem tooltip - confirma achado (b) do developer.
  - Inspecao de content/index.ts e content/schemas/index.ts: nenhuma referencia a texto hardcoded
    para Saiba mais/Saber mais; metaSchema e a funcao buildTitle geram titulo por pagina/idioma,
    confirmado nos titles distintos observados.


ISSUES:
  - [BLOQUEANTE, ver REQUIRED_NEXT_ACTION] Corpo vazio (sem JS) nos 404 de rota dinamica de
    servico - ver VALIDATIONS.
  - [BLOQUEANTE, ver REQUIRED_NEXT_ACTION] html aninhado (invalido) mais idioma sempre PT no 404
    catch-all de topo, incluindo sob /en/... - ver VALIDATIONS.
  - [NAO BLOQUEANTE, pre-existente confirmado] npm run lint falha por incompatibilidade entre
    .eslintrc.json e ESLint 9 - nao introduzido nesta fase.
  - [NAO BLOQUEANTE, fora do ambito desta fase, apenas observacao para o Code Reviewer] As imagens
    (logo e fotos da equipa) continuam a usar next/image sem a opcao unoptimized nem loader simples
    em next.config.mjs - a arquitetura (D-7) recomenda este modo para evitar a quota de otimizacao
    de imagem da Vercel. Nao foi introduzido nesta fase (o padrao ja existia no logo desde fase
    anterior; as fotos da equipa so seguiram o padrao ja existente), por isso nao bloqueio a Fase 3
    por isto, mas sinalizo para nao passar sem nota.
  - [NAO BLOQUEANTE, edge case nao coberto] Nenhuma validacao automatizada (script/CI) impede que
    alguem remova uma traducao en/pt de um novo ficheiro em content/site sem reparar - so se
    descobre ao correr npm run build localmente. Aceitavel para este projeto (sem CI ainda), mas
    registo como lacuna de rede de seguranca.

BLOCKERS: Nenhum sinal de escalonamento (autenticacao, dados pessoais, pagamentos, schema de
producao) - confirmo a auto-avaliacao do developer.

REQUIRED_NEXT_ACTION: Voltar ao Developer antes de seguir para o Code Reviewer. Duas correcoes
concretas e reproduziveis:
  1. Garantir que o conteudo visivel do not-found (heading, texto, botao) das rotas dinamicas de
     servico (grupo pt e pasta en) e efetivamente renderizado no servidor no HTML da resposta
     (verificavel correndo curl contra /servicos/nao-existe e procurando a classe page-hero fora
     de tags script - deve devolver pelo menos 1 ocorrencia; atualmente devolve 0).
     Provavelmente relacionado com o padrao multiple root layouts sem app/layout.tsx partilhado -
     a funcao notFound dentro de um layout aninhado nem sempre consegue emitir HTML estatico
     completo; pode ser necessario um not-found.tsx proprio dentro da propria pasta do segmento
     dinamico de servico em cada idioma (ja existem os de topo de cada grupo - confirmar se cobrem
     tambem o segmento dinamico) ou ajustar a estrutura para evitar a duplicacao de html do ponto 2.
  2. Eliminar o elemento html aninhado no 404 catch-all de topo (app/not-found.tsx) -
     reproduzivel contando quantas vezes aparece a abertura da tag html na resposta de
     /random-xyz (deve ser 1, atualmente e 2). Decidir tambem, de forma explicita e documentada
     (nao silenciosa), se o fallback de topo deve mesmo assumir sempre PT (aceitavel, mas
     documentar no handoff, ja que hoje um 404 sob /en/... mostra texto em portugues) ou se deve
     inspecionar o prefixo do pathname para escolher PT/EN.
  Depois de corrigido, repetir os testes de 404 (dinamico PT/EN + catch-all PT/EN) e voltar a este
  Tester antes do Code Reviewer. Nao e necessario repetir os restantes testes (rotas fixas,
  redirects, seletor de idioma, equipa) - esses ja estao aprovados nesta ronda e nao dependem da
  correcao pedida.

CONTEXT_FOR_NEXT_AGENT: Tudo o resto da Fase 3 (rotas fixas PT/EN, 8 paginas de servico, redirects,
Quem Somos com equipa, correcao dos 3 achados do code-reviewer anterior, ausencia de emojis, schema
Zod para os novos campos) esta validado e nao precisa de nova ronda de teste quando o Developer
corrigir so os dois pontos de 404 acima - a menos que a correcao toque acidentalmente noutras
paginas (ex. se decidir unificar root layouts, verificar que html lang continua correto em todas as
paginas normais, nao so nas 404). O problema de HTML aninhado e corpo vazio nos 404 nao e meramente
cosmetico: FR-13/AC-07 exige 404 por locale como requisito funcional, e um 404 sem conteudo visivel
sem JS ou com HTML invalido nao cumpre isso de forma robusta, mesmo que o robots noindex ja esteja
corretamente presente (o que limita mas nao elimina o impacto - crawlers, leitores de ecra e
ferramentas de verificacao de links sem JS ainda importam). O servidor de teste (npm run start) pode
ainda estar ativo na porta 3000 - nao tentei mata-lo porque o sandbox bloqueou o comando de
encerramento (acao nao critica, sem impacto no codigo).
