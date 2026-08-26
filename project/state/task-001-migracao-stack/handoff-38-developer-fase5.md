# Handoff 38 — Developer — Fase 5 (Decap CMS + proxy OAuth GitHub)

**Task:** 001-migracao-stack
**Agente:** developer
**Âmbito:** exatamente o pedido pelo Orchestrator — Decap CMS estático em `/admin` + proxy OAuth
GitHub (`app/api/auth`, `app/api/auth/callback`) + CSP própria de `/admin`. **NÃO inclui** a Fase 6
(gestão de utilizadores/GitHub App) — não implementada, não referenciada em código.

---

STATUS: COMPLETED

---

SUMMARY:

Implementado o Decap CMS auto-hospedado (`public/admin/index.html` + `public/admin/config.yml`,
bundle npm `decap-cms@3.15.1` pinado, sem CDN) e o proxy OAuth GitHub como duas rotas de servidor
Next.js (`app/api/auth`, `app/api/auth/callback`), seguindo à letra as restrições 1–6, 27–33, 36–38
da secção 12 do `architecture-proposal.md` v5, na parte que se aplica à Fase 5 (as restrições
específicas da Fase 6 — 7–14, 34, 35 — não se aplicam porque não há gestão de utilizadores nesta
entrega).

Decisões de implementação relevantes (documentadas em comentários no próprio código):

1. **Bundle do Decap self-hosted via npm, não commitado.** `decap-cms@3.15.1` (versão exata,
   sem `^`/`~`) como dependência de produção, `package-lock.json` commitado. Um script
   (`scripts/copy-decap-cms.mjs`, corrido em `postinstall`/`predev`/`prebuild`) copia
   `node_modules/decap-cms/dist/decap-cms.js` + os seus chunks numerados (nunca os `.map`, nunca os
   chunks `*.cms.js` duplicados — confirmado por inspeção do bundle que `decap-cms.js` nunca os
   referencia) para `public/admin/vendor/decap-cms/`. Essa pasta está no `.gitignore`: é sempre
   regenerada de forma determinística a partir da versão fixada no lockfile, em vez de commitar
   ~30 MB de bundle de terceiros num repositório público. `npm install`/`npm ci` na Vercel corre
   `postinstall` automaticamente, por isso o `prebuild` é rede de segurança, não o mecanismo
   principal.
2. **`redirect_uri` e `targetOrigin` nunca derivados do pedido.** Uma única variável de ambiente de
   servidor, `OAUTH_ALLOWED_ORIGIN`, é a fonte de verdade para os dois: o `redirect_uri` enviado ao
   GitHub em `/api/auth`, e o `targetOrigin` literal usado no `postMessage` de volta ao Decap em
   `/api/auth/callback`. Nunca lidos de header `Origin`/`Referer`, query string ou `location` do
   cliente — a "allowlist fixa" da restrição 3 degenera, por desenho, numa origem única e
   hardcoded no servidor, o que é a forma mais forte de a satisfazer, não uma forma diminuída.
   Documentado em `lib/auth/env.ts` e nos dois route handlers.
3. **Protocolo de `postMessage` do Decap replicado por inspeção do bundle real** (não documentação,
   porque `decap-cms` não publica o protocolo em prosa): confirmado em
   `node_modules/decap-cms/dist/decap-cms.js` que o backend `github` espera duas mensagens —
   `"authorizing:github"` do popup para o opener, o opener ecoa-a de volta (só se
   `event.origin === base_url`), e o popup responde então com
   `"authorization:github:success:<json>"` ou `"...error:<json>"`. Implementado em
   `lib/auth/popupMessage.ts`, sempre com `targetOrigin` literal (nunca `'*'`), e o recetor do
   handshake valida `event.origin` antes de prosseguir.
4. **Dois cookies distintos**, exatamente como a restrição 31 exige: `agrotrades_oauth_state`
   (`SameSite=Lax`, `Path=/api/auth/callback`, TTL 10 min, apagado no callback **antes** de
   qualquer validação, mesmo se ela falhar) e `agrotrades_session` (`SameSite=Strict`,
   `Path=/admin`, TTL absoluto 60 min sem renovação deslizante). `state` gerado com dois
   `crypto.randomUUID()` concatenados (>=128 bits CSPRNG). Comparação de `state` e da assinatura do
   cookie de sessão em tempo constante (`lib/auth/constantTimeEqual.ts`, `Node:crypto.timingSafeEqual`).
5. **Cookie de sessão já emitido nesta fase** (per arquitetura 7A.3/entregável Fase 5), mas **não é
   lido por nenhuma rota nesta entrega** — não há `/admin/users` nem `/api/admin/*` ainda. Payload
   mínimo `{id, exp}` (ID numérico do GitHub, obtido via `GET /user` no servidor com o token
   acabado de trocar — nunca do cliente), assinado HMAC-SHA256 com `SESSION_SECRET` dedicado,
   algoritmo fixado no código (`lib/auth/session.ts`), nunca lido do próprio token.
6. **Erro genérico único** em todo o callback (`lib/auth/popupMessage.ts::renderAuthErrorHtml`):
   `state` inválido, `code` em falta, falha na troca de token e falha em `GET /user` produzem
   exatamente a mesma resposta HTML/status pelo mesmo caminho de código — não há ramo que distinga
   o motivo.
7. **CSP própria de `/admin/:path*`** em `next.config.mjs`, adicionada **depois** da entrada global
   no array (a ordem importa — "last match wins" no Next.js para a mesma chave de header, ver
   `node_modules/next/dist/docs/.../headers.md` secção "Header Overriding Behavior"). Corrigi
   também o comentário pré-existente no `next.config.mjs` (deixado pela Fase 4), que afirmava
   incorretamente que múltiplas entradas de `headers()` "se combinam por diretiva" — não é assim: a
   entrada mais específica **substitui inteiramente** o valor do header, por isso escrevi a CSP de
   `/admin` como uma política completa e autossuficiente (repete `object-src 'none'`,
   `frame-ancestors 'none'`, etc.), não apenas as diretivas adicionais. Diferenças face à global:
   `'unsafe-eval'` em `script-src` (exigido pelo bundle Decap), e `connect-src`/`img-src` alargados
   só para `api.github.com`, `github.com`, `objects.githubusercontent.com` e
   `avatars.githubusercontent.com` — nunca nenhum CDN de terceiros.
8. **`/admin` (sem barra final) não resolvia sozinho** ao ficheiro estático
   `public/admin/index.html` — o Next.js só serve ficheiros de `public/` por caminho exato, sem
   resolução de "index" de diretório. Acrescentei uma `rewrite` interna
   (`{ source: "/admin", destination: "/admin/index.html" }`) em `next.config.mjs`. Confirmado por
   teste manual (ver VALIDATIONS) que sem isto `/admin` devolvia 404.
9. **`config.yml` mapeia TODO o modelo de conteúdo existente**, não só os serviços: a coleção
   `services` (folder, 8 ficheiros fixos, `create`/`delete: false` porque a contagem é fixa pelo
   schema Zod) e uma coleção `site` (files) com uma entrada por cada `content/site/*.json`
   (nav, hero, stats, about, aboutPage, team, campanha, sections, locations, contacts, footer,
   meta, notFound, servicesPage, servicePage) — refletindo os schemas Zod reais de
   `content/schemas/index.ts`, sem inventar campos. Três ficheiros (`stats.json`, `team.json`,
   `locations.json`) são **arrays JSON no topo**, não objetos; usei a convenção do Decap
   `name: ""` num único campo `list` de topo para cada um — documentado com um comentário de aviso
   em cada uma dessas três coleções no próprio `config.yml`, porque é a única parte deste ficheiro
   que não consegui validar via `curl`/build (só um teste manual dentro do editor confirma que
   grava de volta como array puro e não como `{"": [...]}`; ver COMO TESTAR LOCALMENTE, passo 6).
10. **`.env.example`** acrescentado (sem valores, só nomes e explicação) — não é ignorado pelo
    `.gitignore` (só `.env`, `.env*.local`, `.env.development/production/test` o são), fica
    commitado como documentação.

---

ARTIFACTS:

Novos:
- `public/admin/index.html` — página estática que carrega o bundle self-hosted, `noindex`.
- `public/admin/config.yml` — backend `github`, `editorial_workflow`, todas as coleções de conteúdo.
- `app/api/auth/route.ts` — primeiro salto do OAuth (redireciona para o GitHub).
- `app/api/auth/callback/route.ts` — segundo salto (troca `code`, obtém identidade, emite sessão).
- `lib/auth/env.ts` — leitura/validação centralizada das variáveis de ambiente do proxy.
- `lib/auth/oauthState.ts` — constantes partilhadas (nomes de cookies, TTLs, caminho do callback).
- `lib/auth/constantTimeEqual.ts` — comparação em tempo constante.
- `lib/auth/session.ts` — assinatura/verificação HMAC-SHA256 do cookie de sessão.
- `lib/auth/popupMessage.ts` — HTML do handshake `postMessage` (sucesso/erro).
- `scripts/copy-decap-cms.mjs` — copia o bundle pinado do Decap para `public/admin/vendor/`.
- `.env.example` — documentação das variáveis de ambiente necessárias (sem valores).

Alterados:
- `package.json` — dependência `decap-cms@3.15.1` (exata); scripts `predev`/`prebuild`/`postinstall`.
- `package-lock.json` — atualizado pelo `npm install`.
- `.gitignore` — acrescenta `/public/admin/vendor/`.
- `next.config.mjs` — nova entrada `headers()` para `/admin/:path*` (CSP própria); nova `rewrites()`
  para `/admin` → `/admin/index.html`; comentário da Fase 4 corrigido (ver SUMMARY ponto 7).

---

VALIDATIONS:

Testado localmente com `npm run build` + `npm run start` (produção), com variáveis de ambiente
fictícias (`GITHUB_OAUTH_CLIENT_ID=testclientid`, `SESSION_SECRET` de 48 caracteres,
`OAUTH_ALLOWED_ORIGIN=http://localhost:<porta>`), via `curl`:

| Verificação | Resultado |
|---|---|
| `npm run build` completo (inclui `prebuild`, TypeScript, geração de todas as rotas) | ✅ Sucesso, 0 erros |
| `GET /admin` (sem env configurado) | 404 antes da correção da `rewrite`; **200 depois** — servida a página do Decap |
| `GET /admin/config.yml` | 200, `Content-Security-Policy` da entrada `/admin/:path*` (com `unsafe-eval` e `api.github.com`), diferente da CSP global |
| `GET /admin/vendor/decap-cms/decap-cms.js` | 200 — bundle self-hosted acessível, mesma origem |
| `GET /api/auth?provider=github` sem env configurado | 500, corpo genérico "Erro de autenticação.", sem detalhe de qual variável falta (só nos logs do servidor) |
| `GET /api/auth?provider=evil` | 400 (provider != github rejeitado) |
| `GET /api/auth?provider=github` com env configurado | 302 para `github.com/login/oauth/authorize`, com `redirect_uri=http://localhost:<porta>/api/auth/callback` (nunca refletido do pedido), `scope=public_repo`, `state` de 64 caracteres hex; cookie `agrotrades_oauth_state` com `HttpOnly`, `SameSite=lax`, `Path=/api/auth/callback`, `Max-Age=600` |
| `GET /api/auth/callback?code=x&state=<errado>` | 400, corpo genérico; `Set-Cookie: agrotrades_oauth_state=; Max-Age=0` (cookie sempre apagado, mesmo em falha) |
| `GET /api/auth/callback?code=x&state=<correto mas code inválido>` | 400 (falha real na troca de token contra a API real do GitHub — confirma que o pedido de rede acontece e que uma resposta de erro do GitHub produz o mesmo erro genérico, sem distinguir motivo) |
| CSP global inalterada fora de `/admin` (ex.: `GET /api/auth`) | Confirmado — cabeçalho igual ao definido na Fase 4, sem `unsafe-eval` |
| `next.config.mjs` — comportamento de "última entrada vence" | Confirmado por leitura de `node_modules/next/dist/docs/.../headers.md` ("Header Overriding Behavior") — não é intersecção de políticas CSP, é substituição do valor do header |

**Não testado (não é possível sem credenciais reais do GitHub Fase 0 — ver BLOCKERS/CONTEXT):** o
fluxo completo até à emissão bem-sucedida do cookie de sessão e o comportamento real do
`config.yml` dentro do editor Decap (edição de um serviço, gravação, PR do `editorial_workflow`),
incluindo especificamente as três coleções com `name: ""` (stats/team/locations — ver SUMMARY ponto 9).

---

ISSUES (fora do âmbito exato desta entrega, para o Orchestrator decidir):

1. **`config.yml` é estático; `base_url` está fixo à origem de produção.** A arquitetura (9.11)
   prevê ambientes de preview/sandbox com OAuth App e origem diferentes da produção. Como
   `public/admin/config.yml` é um ficheiro estático servido tal e qual, não pode variar por
   deployment sem um passo de templating (fora do pedido literal desta tarefa, que pediu
   `public/admin/config.yml` como entregável concreto). Documentei isto com um comentário bem
   visível no topo do próprio ficheiro: quem preparar um ambiente de preview/sandbox tem de editar
   `backend.base_url` nesse ficheiro E a variável `OAUTH_ALLOWED_ORIGIN` desse deployment,
   mantendo-os idênticos byte a byte. Fica para o `devops-engineer`/Fase 0 decidir se isto é
   aceitável ou se justifica gerar `config.yml` dinamicamente (rota de servidor em vez de ficheiro
   estático) numa iteração futura.
2. **`npm audit` acusa 34 vulnerabilidades "high" na árvore de dependências transitivas do pacote
   `decap-cms`** (ferramentas de build antigas do próprio Decap — webpack/babel-era, não código que
   corre no nosso servidor). O único artefacto que efetivamente serve aos utilizadores é o bundle
   pré-compilado `dist/decap-cms.js`, não o código-fonte dessas dependências. Ainda assim, é
   software de terceiros extenso (30 MB) a correr na página mais privilegiada do site (detém o
   token OAuth do editor em `localStorage`, limitação conhecida e aceite da arquitetura, secção
   9.4). Sinalizo para o `security-engineer` avaliar explicitamente este risco de cadeia de
   fornecimento, que nenhuma restrição da arquitetura cobre em detalhe.
3. **`npm run lint` falha por razão pré-existente, não relacionada com esta entrega**: o projeto
   usa `.eslintrc.json` mas tem `eslint@9.39.5` instalado, que exige `eslint.config.js`. Não
   corrigi — fora do âmbito do bug/tarefa desta fase (regra do developer: não corrigir o que está
   fora do âmbito pedido). Registo para o Orchestrator decidir se abre uma tarefa separada.

---

BLOCKERS: nenhum para esta entrega. O fluxo completo (autenticação real, gravação de conteúdo)
só pode ser validado depois de a Fase 0 (contas/OAuth App/GitHub App reais) estar concluída — isso
já era esperado e está descrito no pedido original ("sem essas variáveis definidas, o fluxo de
login não vai funcionar em runtime — isso é esperado nesta fase").

---

VARIÁVEIS DE AMBIENTE NECESSÁRIAS (configurar na Vercel, Project Settings → Environment Variables
— restrição 27: só no ambiente **Production**; Preview precisa de uma GitHub OAuth App e
repositório-sandbox separados, decisão de Fase 0, fora desta entrega):

| Variável | Valor | Notas |
|---|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | Client ID da GitHub OAuth App | Não é segredo, mas mantém-se só no servidor |
| `GITHUB_OAUTH_CLIENT_SECRET` | Client secret da GitHub OAuth App | **Segredo.** Nunca em `NEXT_PUBLIC_`, nunca no repositório |
| `SESSION_SECRET` | String aleatória, >=32 caracteres | **Segredo**, dedicado (distinto do client secret). Gerar com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `OAUTH_ALLOWED_ORIGIN` | Origem absoluta exata, sem barra final (ex.: `https://agrotrades.co.mz`) | Tem de ser **igual, byte a byte**, a `backend.base_url` em `public/admin/config.yml` |

Sem estas quatro, `/api/auth` e `/api/auth/callback` respondem sempre 500 genérico (fail closed,
comportamento correto e esperado, confirmado em VALIDATIONS).

---

COMO TESTAR LOCALMENTE (passo a passo):

**1. Criar a GitHub OAuth App** (o utilizador tem de fazer isto — fora do alcance do developer):
   GitHub → Settings → Developer settings → OAuth Apps → New OAuth App:
   - **Application name:** `AGRO TRADES — CMS` (ou similar)
   - **Homepage URL:** o valor exato que vai em `OAUTH_ALLOWED_ORIGIN` (ex.: `https://agrotrades.co.mz`,
     ou `http://localhost:3000` só para teste local)
   - **Authorization callback URL — EXATA, tem de bater certo com o código:**
     `<OAUTH_ALLOWED_ORIGIN>/api/auth/callback` (ex.: `https://agrotrades.co.mz/api/auth/callback`
     ou `http://localhost:3000/api/auth/callback` em teste local)
   - Gerar um **Client secret**.

2. Copiar `.env.example` para `.env.local` e preencher as 4 variáveis da tabela acima (para teste
   local, `OAUTH_ALLOWED_ORIGIN=http://localhost:3000`, e o `client_id`/`client_secret` reais da
   app criada no passo 1).

3. Editar temporariamente `public/admin/config.yml`, campo `backend.base_url`, para
   `http://localhost:3000` (tem de bater certo com `OAUTH_ALLOWED_ORIGIN` — reverter antes de
   commitar/fazer deploy real).

4. `npm install && npm run dev` (o `predev` copia o bundle do Decap automaticamente).

5. Abrir `http://localhost:3000/admin`. Clicar em "Login with GitHub". Deve abrir um popup, pedir
   autorização na conta GitHub (só quem tiver `public_repo` — qualquer conta autentica-se, só quem
   tiver permissão de escrita no repositório consegue gravar, isso é esperado e correto por
   desenho), e voltar ao editor autenticado.

6. **Verificação específica dos ficheiros-array** (SUMMARY ponto 9): editar "Estatísticas" (ou
   "Localizações"/"Equipa"), gravar, e confirmar no ficheiro resultante (commit/PR no GitHub, dado
   `editorial_workflow`) que `content/site/stats.json` continua um array `[...]` no topo — não
   `{"": [...]}`. Se isto falhar, é preciso rever a configuração dessas três coleções específicas
   em `config.yml` (não afeta as restantes, que são objetos normais).

7. Confirmar que `npm run build` continua a passar depois de reverter o `config.yml` para
   `https://agrotrades.co.mz` antes de qualquer commit.

---

REQUIRED_NEXT_ACTION:

Próximo agente é o **security-engineer** — revisão contra o código, não é opcional nem substituível
pelo tester desta vez, dado o risco (autenticação). Ver checklist de aceitação que o próprio
security-engineer definiu em `handoff-03-security-engineer-preview.md`, secção
"REQUIRED_NEXT_ACTION → Para mim (security-engineer), depois", que pede evidência reproduzível
para: `redirect_uri` de origem não-allowlisted rejeitado; `postMessage` sem `targetOrigin` literal
em lado nenhum; `state` reutilizado rejeitado; `username` (n/a nesta fase — só Fase 6); pedido de
mutação sem `Origin` rejeitado (n/a nesta fase — não há mutações além do próprio dance OAuth, que é
navegação GET, não fetch/CORS); bundle do cliente sem qualquer segredo; e prova de que as variáveis
de ambiente sensíveis não existem no ambiente Preview (isso é uma verificação de configuração da
Vercel, não de código — sinalizar ao `devops-engineer`/utilizador, não algo que o código por si só
prove).

---

CONTEXT_FOR_NEXT_AGENT:

- **Onde procurar cada restrição da secção 12 (27–33, 36–38) no código:**
  - 27 (segredos só em Production): não é verificável por código, é configuração da Vercel — sinalizar.
  - 28 (proteção de `main`): não se aplica ainda (só há um utilizador; é pré-condição da Fase 6).
  - 29 (duas condições de autorização): não se aplica — não há rota privilegiada nesta fase.
  - 30 (cookie de sessão): `lib/auth/session.ts` + emissão em `app/api/auth/callback/route.ts`.
  - 31 (dois cookies distintos, `state` de uso único apagado antes de validar): ambos os route
    handlers, cookie `agrotrades_oauth_state` (Lax) vs. `agrotrades_session` (Strict).
  - 32 (`state` CSPRNG): `app/api/auth/route.ts`, `crypto.randomUUID()` duplo.
  - 33 (`Origin` falha fechada): **não implementado nesta fase** — não há nenhuma rota de mutação
    além do próprio OAuth dance, que é sempre navegação GET (o browser não envia `Origin` em
    navegações de topo GET simples; validar `Origin` aqui não teria efeito e daria falso conforto).
    Vai aplicar-se de facto a partir da Fase 6 (`/api/admin/collaborators`), que tem mutações reais.
  - 36 (bundle self-hosted, versão exata, CSP confinada): `package.json`, `scripts/copy-decap-cms.mjs`,
    `public/admin/index.html`, `next.config.mjs` (entrada `/admin/:path*`).
  - 37 (código de resposta único para não-autorizados): **não se aplica ainda** — não há conceito
    de "autorizado"/"não autorizado" nesta fase (qualquer utilizador GitHub autentica-se com
    sucesso, por desenho; a distinção editor/não-editor só existe implicitamente na permissão real
    de escrita do GitHub quando o Decap tenta gravar, o que é inteiramente delegado à API do GitHub
    — o nosso proxy nunca decide isso). O que **está** garantido: o callback devolve sempre o mesmo
    tipo de resposta/status para `state` inválido, `code` em falta, falha de troca de token e falha
    de `GET /user` (ver SUMMARY ponto 6) — é o "código de resposta único" aplicável a esta fase.
  - 38 (tokens nunca guardados, nunca em variável de módulo, nunca em logs): não há cache nenhum
    (tudo por pedido); `console.error` nos route handlers nunca inclui `accessToken`, `code`,
    `state` nem o corpo do cookie — confirmar por leitura direta se quiser (poucas linhas).
- **O que NÃO existe nesta entrega, de propósito:** `/admin/users`, `/api/admin/*`, GitHub App,
  `ADMIN_GITHUB_USER_IDS`. Qualquer coisa que pareça exigir isso é Fase 6, gate separado.
- **Ficheiro de referência da checklist do security-engineer:**
  `project/state/task-001-migracao-stack/handoff-03-security-engineer-preview.md`.
