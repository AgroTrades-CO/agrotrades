STATUS: APPROVED
SUMMARY: Testada de forma independente a Fase 4 (SEO, metadados, favicon, JSON-LD, sitemap, robots,
headers de seguranca). Todos os pontos pedidos foram verificados por curl/build reais (nao apenas
pela leitura do handoff do developer), com o servidor `npm run start` corrido localmente e depois
terminado. Nenhuma regressao nas Fases 1-3. Aprovado, com duas ressalvas nao-bloqueantes ja
identificadas pelo developer e uma decisao que requer confirmacao humana (og:image), a levar ao
Orchestrator.

VALIDATIONS:
1. npm run build: passa, 30 rotas geradas (confirmado no output real do build, incluindo
   /robots.txt e /sitemap.xml novas).
2. Metadados verificados via curl em TODAS as 16 rotas com metadados (nao apenas as 6 amostradas
   pelo developer): homepage PT/EN, /servicos e /en/services (listagem), 8 paginas de servico
   PT/EN, quem-somos/about, campanha/campaign, contactos/contact. Em todas: title, description,
   canonical, alternates hreflang (pt/en/x-default, cruzados corretamente nos dois sentidos),
   og:title/description/url/locale/image/type, twitter:card/title/description/image, todos
   presentes, nenhum vazio, todos distintos por pagina e por idioma (confirmado por diff visual
   dos outputs de curl, nao ha nenhum valor hardcoded repetido entre paginas).
3. sitemap.xml: 26 <url> confirmados por grep. Li o ficheiro completo: 13 rotas fixas/servicos
   x2 idiomas, cada <url> com dois xhtml:link rel=alternate (hreflang pt e en) apontando
   corretamente para o par no outro idioma, nos dois sentidos (ex.: /servicos/arroz para
   /en/services/rice, /servicos/mecanizacao para /en/services/mechanisation).
4. robots.txt: Allow: /, Disallow: /admin, Sitemap: https://agrotrades.co.mz/sitemap.xml,
   confirmado por curl direto.
5. JSON-LD Organization: confirmado por curl em / e /en, JSON valido (parseavel), campos
   name/url/logo/telephone/email/address coerentes byte-a-byte com content/site/contacts.json
   (telephone = phones[0], email = emails[0], name = ceo.company) e content/site/locations.json
   (endereco da localizacao escritorio, concatenado). Confirmado tambem por grep que NAO existe
   application/ld+json em /quem-somos nem /servicos/arroz (0 ocorrencias); a restricao do JSON-LD
   a homepage e intencional, nao um esquecimento.
6. Favicon: curl -I /favicon.svg devolve 200, Content-Type image/svg+xml, servido de public/.
7. Headers de seguranca via curl -I /: presentes X-Frame-Options (SAMEORIGIN),
   X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin),
   Strict-Transport-Security (max-age=63072000; includeSubDomains, sem preload, decisao
   documentada), Permissions-Policy, Content-Security-Policy completa. Confirmado tambem que os
   mesmos headers cobrem assets estaticos (favicon.svg tambem devolve a CSP completa).
8. CSP e unsafe-inline: listei todos os script da homepage renderizada, todos os src apontam
   para /_next/static/chunks (origem propria, nenhum CDN de terceiros) e existe exatamente um
   script sem src (payload de hidratacao RSC do Next.js App Router, self.__next_f.push),
   confirmando a alegacao do developer de que o unsafe-inline em script-src/style-src decorre do
   proprio framework, nao de codigo de terceiros nem de uma escolha evitavel sem middleware com
   nonce. Avaliacao: ACEITAVEL como estado atual. Distingo esta situacao da restricao 9.9/SEC-05
   da arquitetura (nao construir uma CSP global que depois precise de ser enfraquecida para o
   Decap caber), que se refere especificamente a nao relaxar a CSP GLOBAL para acomodar o Decap na
   Fase 5 (que deve ganhar uma CSP propria por header de rota em /admin, mais permissiva, sem
   tocar na global). O unsafe-inline atual e um requisito do Next.js em si (nao do Decap),
   documentado no next.config.mjs, sem nenhuma origem de terceiros adicionada, logo nao viola a
   restricao 9.9. Fica mais frouxo do que o ideal (um nonce por pedido via middleware eliminaria a
   necessidade), mas nao bloqueia esta fase; registo como ISSUE para acompanhamento antes/durante
   a Fase 5, dado que essa fase vai introduzir middleware de qualquer forma (proxy OAuth) e seria
   natural resolver o nonce na mesma altura.
9. Regressao Fases 1-3, confirmada por curl: /servicos.html devolve 308 para /servicos (redirect
   D-5 intacto); /servicos/arroz, /en/services/rice, /quem-somos devolvem 200 com conteudo
   esperado; /random-xyz devolve 404. Nenhuma regressao detetada.
10. Servidor de teste terminado apos os testes (processo na porta 3000 morto), nao ficou a correr.

ISSUES:
  - Nao bloqueante, ja sinalizado pelo developer: unsafe-inline em script-src/style-src, ver
    avaliacao no ponto 8. Aceitavel agora; recomendo que o software-architect/security-engineer
    decidam formalmente, ao desenhar o middleware da Fase 5 (proxy OAuth), se vale a pena
    introduzir nonce por pedido na mesma alteracao, para nao ficar um middleware novo sem resolver
    isto que ja estava identificado.
  - Nao bloqueante, ja sinalizado pelo developer: HSTS sem preload, decisao correta de deixar
    para o devops-engineer decidir explicitamente antes do cutover de producao (Fase 7), nao e
    reversivel facilmente, ficou fora do ambito desta fase.
  - Requer decisao humana, nao testavel por mim: og:image reutiliza public/images/logo.jpeg (nao
    ha imagem OG dedicada). A arquitetura marca explicitamente Decisao humana: confirmar a
    og:image para a Fase 4, essa confirmacao ainda nao aconteceu nesta conversa. Nao e um defeito
    tecnico (a implementacao resolve corretamente para um recurso real, confirmado por
    curl -I /images/logo.jpeg devolvendo 200), mas o Orchestrator deve levar isto ao utilizador
    antes de fechar a fase, conforme o proprio plano exige.
  - Edge case nao coberto, registo apenas: nao testei o comportamento de metadados para um
    id/slug de servico inexistente (ex.: /servicos/xyz). O developer nao reportou este teste e a
    tarefa nao o pediu explicitamente, mas e um edge case razoavel para generateMetadata de rotas
    dinamicas. Nao bloqueia esta aprovacao porque a rota em si ja e coberta pelo 404 confirmado no
    ponto 9 (comportamento da Fase 3, sem alteracao aqui), mas fica registado para o Code Reviewer
    confirmar que generateMetadata no [id]/[slug] nao lanca erro nao tratado antes do 404 disparar.
  - Nao testado por mim, fora do meu escopo de ferramentas: verificacao de erros de CSP num
    browser real com consola aberta (sugestao do proprio developer). Testei apenas via curl e
    inspecao do HTML servido, que confirma a ausencia de origens de terceiros, mas nao corri um
    browser real com DevTools. Dado que a CSP nao introduz nenhuma diretiva nova que bloquearia o
    proprio script sem src (esse e coberto por unsafe-inline) nem recursos de terceiros,
    considero o risco residual baixo, mas sinalizo para o Code Reviewer ou QA confirmar com um
    teste de browser real antes do cutover, especialmente o seletor de idioma (client component) e
    o botao WhatsApp.

BLOCKERS: Nenhum.

REQUIRED_NEXT_ACTION: APPROVED, avanca para code-reviewer. Antes de fechar a fase, o Orchestrator
deve levar ao utilizador a decisao humana pendente sobre og:image (reutilizar logo.jpeg vs. imagem
dedicada), conforme a propria arquitetura exige para esta fase; isto nao e um blocker de teste, mas
e uma confirmacao humana ainda em falta.

CONTEXT_FOR_NEXT_AGENT: Toda a logica de metadados esta centralizada em content/seo.ts e
content/organization.ts, confirmado consistente nas 16 rotas testadas. app/sitemap.ts e
app/robots.ts sao gerados a partir de content/routes.ts e content/index.ts, nao ha lista de URLs
escrita a mao. A CSP e o HSTS estao em next.config.mjs, comentados no proprio ficheiro. Foco
sugerido para o Code Reviewer: (1) manutenibilidade de content/seo.ts e buildPageMetadata dado que
e reutilizado por 16 chamadas; (2) confirmar que generateMetadata das rotas dinamicas [id]/[slug]
trata IDs invalidos sem excecao nao capturada (ver ISSUES); (3) qualidade do comentario de CSP no
next.config.mjs como documentacao viva para a Fase 5.
