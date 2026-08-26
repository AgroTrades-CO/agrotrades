# Handoff 41 — Tester — Fase 5, validação funcional pós-correção (SEC-P5-01/02/03/04)

**Task:** 001-migracao-stack
**Agente:** tester
**Âmbito:** validar que o comportamento funcional habitual (não os testes negativos de
segurança, que ficam com o security-engineer) continua a funcionar depois das 4 correções
descritas em `handoff-40-developer-fase5-fix.md`.

---

STATUS: APPROVED

---

SUMMARY:

Todas as áreas pedidas foram testadas por execução real (build de produção + `next start` +
`curl`/scripts Node, não apenas leitura de código). Nenhuma regressão funcional encontrada.
`Cache-Control: no-store` não interfere com o handshake `postMessage`/fecho do popup (é um
header HTTP puro de cache, não afeta o corpo HTML nem a execução de scripts). O cookie de
sessão continua a ser emitido sem `Secure` em ambiente de dev (`OAUTH_ALLOWED_ORIGIN=http://
localhost:<porta>`) e com `Secure` quando a origem configurada é `https://`, exatamente como o
Developer reportou. As coleções do Decap carregam normalmente em `/admin` (HTML, bundle,
`config.yml` servidos com 200, YAML válido, 2 coleções/12 ficheiros inalterados). Os três
ficheiros-array (`stats`, `team`, `locations`) foram validados por mim — build de produção
gera as páginas estáticas que os consomem sem erro de Zod, e o conteúdo aparece corretamente
no HTML renderizado das páginas `/`, `/quem-somos` e `/contactos`. `npm run build` compila sem
erros e o site geral responde 200 em todas as rotas testadas.

---

ARTIFACTS:

Nenhum ficheiro de projeto alterado. Artefactos de teste ad-hoc (não commitados, apenas no
scratchpad da sessão): cookie jar, logs de instâncias locais `next start`, corpos HTML de
respostas de erro capturadas por `curl`. Sem valor fora desta sessão de validação.

---

VALIDATIONS:

**0. Build de produção**
```
npm run build
Compiled successfully in 5.9s
Finished TypeScript in 11.4s
Generating static pages using 7 workers (30/30) in 8.6s
```
Sem erros de TypeScript/build. `/api/auth` e `/api/auth/callback` continuam dinâmicas (ƒ);
todas as restantes rotas (`/`, `/servicos`, `/servicos/[id]` x8, `/en/...`, `/campanha`,
`/contactos`, `/quem-somos`, `/robots.txt`, `/sitemap.xml`) geradas sem falha — isto já prova
que `stats.json`, `team.json` e `locations.json` passam a validação Zod em build time (ver
ponto 4, com confirmação adicional em runtime).

**1. Fluxo de login popup — Cache-Control: no-store não interfere com postMessage/fecho**

Ambiente: next start -p 3211, OAUTH_ALLOWED_ORIGIN=http://localhost:3211, credenciais
fictícias (não há credenciais reais do GitHub disponíveis neste ambiente de teste).

- GET /api/auth?provider=github -> 302 com cache-control: no-store e set-cookie do state
  cookie, redireciona para github.com/login/oauth/authorize com redirect_uri/scope/state
  corretos.
- Segui o state emitido (cookie jar real) até GET /api/auth/callback?state=<válido>&code=
  fakecode. Como as credenciais são fictícias, o pedido chega mesmo à API real do GitHub
  (confirma que não há bloqueio de rede) e falha na troca do code — caminho de erro, finish(),
  mesma função usada pelo caminho de sucesso.
- Resposta: 400 Bad Request, cache-control: no-store, content-type: text/html, cookie de state
  limpo (Max-Age=0). Corpo HTML inspecionado byte a byte, contém:
```
var TARGET_ORIGIN = "http://localhost:3211";
var FINAL_MESSAGE = "authorization:github:error:{...}";
function sendFinal() { if (window.opener) { window.opener.postMessage(...) } window.close(); }
```
  Handshake completo e intacto: postMessage("authorizing:github", TARGET_ORIGIN) inicial,
  listener do eco, postMessage(FINAL_MESSAGE, TARGET_ORIGIN) final e window.close().
- Cache-Control é um header HTTP de cache (afeta só se um proxy/browser pode guardar a
  resposta) — não tem nenhum mecanismo de interação com o corpo HTML, com o script embutido,
  ou com a API postMessage/window.close() do browser. Não encontrei, nem esperava encontrar,
  qualquer efeito colateral. Como o caminho de sucesso (renderAuthSuccessHtml) passa pela
  mesma função finish() e o próprio lib/auth/popupMessage.ts não foi alterado por esta
  correção (confirmado por leitura — só route.ts ganhou a chamada a
  response.headers.set("Cache-Control", "no-store") à volta da mesma HTML), esta verificação
  no caminho de erro é representativa do caminho de sucesso quanto ao ponto em causa.
- Não foi possível completar um fluxo de sucesso ponta-a-ponta com um browser real e
  credenciais reais do GitHub neste ambiente (fora do âmbito prático desta sessão) — a mesma
  limitação já existia no handoff-40. Isto não é uma lacuna introduzida por esta correção.

**2. Cookie de sessão — secure: derivado de OAUTH_ALLOWED_ORIGIN, aceite em /admin**

- Servidor dev: OAUTH_ALLOWED_ORIGIN=http://localhost:3211 ->
  set-cookie: agrotrades_oauth_state=...; Path=/api/auth/callback; ...; HttpOnly; SameSite=lax
  — sem Secure, confirmado por inspeção literal do header (repeti o comando do Developer,
  mesmo resultado).
- Servidor com origem https simulada: OAUTH_ALLOWED_ORIGIN=https://example.com (pedido feito
  por HTTP simples, porta 3212) ->
  set-cookie: agrotrades_oauth_state=...; Secure; HttpOnly; SameSite=lax — com Secure, vindo
  da configuração, não da ligação real. Confirma a inversão de comportamento face ao
  X-Forwarded-Proto do pedido, tal como descrito no handoff-40.
- O cookie de sessão (agrotrades_session, Path=/admin) usa exatamente a mesma expressão
  (config.allowedOrigin.startsWith("https:")) — confirmei por leitura de
  app/api/auth/callback/route.ts linha 163, idêntica à do cookie de state já testado acima.
  Não existe hoje nenhuma rota que leia este cookie (documentado no próprio
  lib/auth/session.ts e no handoff-40 — Fase 6), por isso não há uma verificação funcional de
  "aceitação em /admin" possível além de confirmar que: (a) o Set-Cookie é sintaticamente
  válido e sem Secure em dev, o que um browser real aceita sobre HTTP sem rejeitar o cookie;
  (b) /admin continua a responder 200 independentemente da presença ou ausência deste cookie
  — confirmei ambos os casos (curl com e sem cookie jar).

**3. Coleções do Decap carregam em /admin**
```
GET /admin              -> 200, HTML com o bundle self-hosted referenciado
GET /admin/config.yml   -> 200, CSP da entrada /admin/:path* (unsafe-eval incluído)
GET /admin/vendor/decap-cms/decap-cms.js -> 200
```
config.yml parseado com js-yaml (já presente em node_modules, dependência transitiva do
Decap) via script Node: parse sem erros, backend.base_url = https://agrotrades.co.mz
(inalterado), 2 coleções de topo (services, site) com o mesmo número de sub-ficheiros de
sempre, campo stats[0].name confirmado como "" (convenção "array no topo" do Decap,
inalterada pela correção — nenhuma das 4 correções tocou este ficheiro além do comentário
SEC-P5-03).

**4. stats/team/locations — os três ficheiros-array, testados agora**
```
content/site/stats.json     -> array de 4 objetos (value, label pt/en)
content/site/team.json      -> array de 3 objetos (1o com bio+badges, 2o com badges sem bio,
                                3o sem bio nem badges nem frase — campos opcionais em uso real)
content/site/locations.json -> array de 2 objetos (id, icon, type, name, address[])
```
- npm run build gera as páginas estáticas que consomem estes três ficheiros sem falha de
  validação Zod (statsSchema exige length 4, teamSchema é array, locationsSchema exige
  array min 1 — todos satisfeitos pelos ficheiros atuais).
- Confirmação adicional em runtime (next start, não só build): curl http://localhost:3211/
  contém "Anos de actividade", "Hectares cultivados", "Distrito de Moma" (stats-bar);
  curl http://localhost:3211/quem-somos contém os 3 membros da equipa, incluindo o 3o sem
  campos opcionais (confirma que campos opcionais no config.yml — frase, bio, badges —
  realmente funcionam como opcionais no schema e no render, não só no Decap);
  curl http://localhost:3211/contactos e / contêm "Cidade de Nampula"/"Escritório Sede"
  (localização 1) e /contactos também "Distrito de Moma"/"Machamba" (localização 2, só
  aparece na página de contactos, comportamento esperado por design, não um bug).
- Convenção name vazio documentada nas notas do config.yml (linhas 273-280, 387-388, 523-524)
  confirmada como correta: os três ficheiros no disco são arrays JSON no topo, não objetos
  encapsulados — coerente com o que o Decap deve produzir ao gravar, e com o que os schemas
  Zod exigem.

**5. npm run build e site geral, sem regressão**
```
GET /            -> 200
GET /admin       -> 200
GET /servicos    -> 200
GET /contactos   -> 200
GET /quem-somos  -> 200
```
CSP global inalterada em / (idêntica à do handoff-39, ponto 10 — verificado byte a byte, o
mesmo texto do Developer). CSP de /admin inalterada. Nova entrada /images/uploads/:path*
não sobrepõe nenhuma das outras duas (fontes distintas, sem conflito de source).

---

ISSUES:

- **Fluxo de sucesso ponta-a-ponta do popup (token real, browser real) não foi executado** —
  requer credenciais reais do GitHub OAuth App e um browser (não curl), que não estão
  disponíveis neste ambiente de teste. A verificação feita (mesma função finish(), mesmo
  ficheiro popupMessage.ts inalterado, caminho de erro exercitado ponta-a-ponta com o
  handshake completo presente e correto no HTML) cobre o ponto específico pedido (interação
  entre Cache-Control: no-store e postMessage/fecho), mas não é um substituto de um teste
  manual num browser real antes de ir para produção. Recomendo que isto seja feito manualmente
  por alguém com acesso às credenciais reais (ex.: devops-engineer/release-manager) antes do
  cutover de produção — não é um bloqueador desta validação, é uma lacuna de ambiente, não de
  código.
- **Cookie de sessão sem consumidor** — como já documentado pelo próprio Developer (SEC-P5-04),
  nenhuma rota lê agrotrades_session nesta fase. "Aceite em /admin" só pôde ser validado como
  "sintaticamente correto e não interfere com o carregamento de /admin", não como "autentica
  algo" — porque nada ainda consome este cookie. Não é uma lacuna desta correção; fica
  registado para a Fase 6 verificar a leitura real do cookie assim que existir uma rota que a
  use.
- Não encontrei edge cases negativos óbvios em falta para este tipo de correção que não
  estejam já cobertos pelo security-engineer (redirect_uri, state reuse, targetOrigin — fora
  do meu âmbito nesta tarefa, conforme instrução recebida).

---

BLOCKERS: Nenhum.


---

REQUIRED_NEXT_ACTION:

Nenhuma ação corretiva necessária — validação funcional aprovada. Sugestão não bloqueante: o
security-engineer, ao revalidar SEC-P5-01/02/03/04, pode querer confirmar também que o fluxo
de sucesso ponta-a-ponta (browser real + credenciais reais) é testado manualmente por alguém
antes do cutover de produção (ver ISSUES) — não descobri nada que sugira que vá falhar, só não
pude executá-lo eu próprio neste ambiente.

---

CONTEXT_FOR_NEXT_AGENT:

- Testado com npm run build + next start -p <porta> (portas 3211 e 3212, ambas encerradas no
  final — taskkill /F /IM node.exe, nada ficou a correr em background) e variáveis fictícias
  (GITHUB_OAUTH_CLIENT_ID=fake_id, GITHUB_OAUTH_CLIENT_SECRET=fake_secret_ABC, SESSION_SECRET
  com 48 caracteres, OAUTH_ALLOWED_ORIGIN variando entre http://localhost:<porta> e
  https://example.com). Nenhum ficheiro do projeto foi modificado durante esta validação.
- Confirmei por leitura direta de app/api/auth/route.ts, app/api/auth/callback/route.ts,
  lib/auth/env.ts, next.config.mjs e public/admin/config.yml que o conteúdo corresponde
  exatamente ao descrito no handoff-40 (nenhuma alteração adicional não documentada).
- lib/auth/popupMessage.ts e lib/auth/session.ts NÃO foram tocados por esta correção —
  confirmado por leitura; a lógica de handshake postMessage e de assinatura/verificação do
  token de sessão está inalterada desde a Fase 5 original.
- Os três ficheiros-array (content/site/stats.json, team.json, locations.json) estão agora
  validados por mim (tester), não só o Developer/handoffs anteriores — ficam confirmados como
  corretos tanto na estrutura de disco (array no topo) como no consumo em runtime (páginas /,
  /quem-somos, /contactos).
- Próximo passo natural no fluxo (conforme handoff-40): security-engineer revalida
  SEC-P5-01/02/03/04 e decide sobre a pergunta em aberto do SEC-P5-03b (aceitar a correção a
  isolada como suficiente, ou exigir uma das alternativas listadas nas ISSUES do handoff-40).
  Depois disso, code-reviewer.
