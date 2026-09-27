# task-007-remove-unused-session — handoff 01 — software-architect

**Workflow:** refactoring (CLAUDE.md 3.3) | **Classificação:** LARGE (autenticação) | **Itens:** B4, B5
**Data:** 2026-09-26

```
STATUS: PENDING_HUMAN_CONFIRMATION
SUMMARY: Âmbito definido para B4 (remover o cookie de sessão HMAC, emitido mas nunca lido) e
         avaliação de B5 (cancelar a Fase 6 /admin/users + GitHub App). Confirmado por pesquisa
         que o cookie não tem nenhum consumidor, e que o Decap CMS não depende dele. Recomendo
         avançar com ambos, mas B4 e B5 são decisões independentes. Nenhum código alterado.
ARTIFACTS: project/state/task-007-remove-unused-session/handoff-01-software-architect.md (este)
VALIDATIONS: ver secção 1 (evidência de zero consumidores).
ISSUES: ver secções 2.4 (ordem de deploy / rollback) e 2.3 (GET /user).
BLOCKERS: Confirmação humana obrigatória (CLAUDE.md s.4 — alteração a autenticação) antes de
          qualquer implementação. Ver secção 6 (pergunta concreta).
REQUIRED_NEXT_ACTION: Orchestrator apresenta a secção 6 ao utilizador. Com "sim" a B4: tester cria
          e executa a caracterização da secção 4 (ANTES de qualquer alteração) -> developer ->
          tester -> security-engineer -> code-reviewer -> devops-engineer (remoção da variável no
          alojamento). Com "sim" a B5: developer (ou o próprio architect) aplica as alterações de
          documentação da secção 5.3.
CONTEXT_FOR_NEXT_AGENT: secções 2 (lista exata de alterações), 3 (o que NÃO muda) e 4 (testes).
```

---

## 1. Evidência — o cookie de sessão não tem consumidores

Pesquisa em todo o repositório (excluindo `node_modules/` e `.next/`) por `SESSION_COOKIE`,
`SESSION_MAX_AGE`, `agrotrades_session`, `createSessionToken`, `verifySessionToken`,
`lib/auth/session`, `sessionSecret`, `SESSION_SECRET`:

| Símbolo | Ocorrências em código |
|---|---|
| `verifySessionToken` | Só a definição (`lib/auth/session.ts:73`). **Zero chamadas.** |
| `createSessionToken` | Definição + uma chamada (`app/api/auth/callback/route.ts:152`). |
| `SESSION_COOKIE` / `SESSION_MAX_AGE_SECONDS` | Definição (`lib/auth/oauthState.ts:13-14`) + emissão no callback (linhas 9-10, 155, 159, 171). |
| `sessionSecret` / `SESSION_SECRET` | `lib/auth/env.ts` (leitura, obrigatoriedade, mínimo 32 chars), passado ao `createSessionToken`, `.env.example:17-21`. |
| `agrotrades_session` | Nenhuma leitura em lado nenhum; zero ocorrências em `public/admin/` (incluindo o bundle do Decap em `public/admin/vendor/`). |

Não existe `middleware.ts`/`proxy.ts`, não existe `app/admin/`, não existe `/api/admin/*`. O
`security-engineer` já o tinha registado na Fase 5 (`handoff-39`, linha 152: "nenhum consumidor").

**O Decap não depende do cookie.** O Decap recebe o token GitHub exclusivamente pela mensagem
`authorization:github:success:{"token":...,"provider":"github"}` via `postMessage`
(`lib/auth/popupMessage.ts`), guarda-o em `localStorage` e fala diretamente com a API do GitHub.
O cookie de sessão é `httpOnly` (inacessível a JavaScript) e `Path=/admin`, onde só são servidos
ficheiros estáticos que não o leem. Removê-lo é invisível para o Decap.

## 2. B4 — Âmbito exato da alteração

### 2.1 A remover

| Ficheiro | Alteração |
|---|---|
| `lib/auth/session.ts` | **Apagar o ficheiro inteiro.** |
| `lib/auth/oauthState.ts` | Remover `SESSION_COOKIE` e `SESSION_MAX_AGE_SECONDS` (linhas 13-14). Manter as três constantes de `state`/callback. |
| `app/api/auth/callback/route.ts` | Remover o import de `createSessionToken` e de `SESSION_COOKIE`/`SESSION_MAX_AGE_SECONDS`; remover a criação do token (152-156) e o `response.cookies.set(SESSION_COOKIE, ...)` (159-172), incluindo o comentário SEC-P5-04 (deixa de ter objeto). O caminho de sucesso passa a `return finish(renderAuthSuccessHtml(config.allowedOrigin, accessToken), 200);`. |
| `lib/auth/env.ts` | Remover `sessionSecret` da interface `OAuthConfig`, a leitura de `process.env.SESSION_SECRET`, a sua presença na verificação de obrigatoriedade, a mensagem de log correspondente e a validação de comprimento mínimo (80-83). A mensagem de erro de configuração incompleta passa a listar só `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` e `OAUTH_ALLOWED_ORIGIN`. |
| `.env.example` | Remover o bloco `SESSION_SECRET` (linhas 17-21). |

### 2.2 Ajustes só de comentários (sem efeito em comportamento)

- `app/api/auth/route.ts`, comentário do topo: "num cookie PRÓPRIO e distinto do cookie de sessão"
  deixa de fazer sentido — reescrever para "num cookie próprio".
- `app/api/auth/callback/route.ts`, comentário SEC-P5-01 dentro de `finish`: mantém-se.
- `lib/auth/popupMessage.ts`, linha 28: "o token do GitHub e o ID numérico" — o ID deixa de
  existir se 2.3 for aceite; trocar por "o token do GitHub".

### 2.3 Decisão incluída no âmbito: remover também a chamada `GET /user` no callback

A chamada `GET https://api.github.com/user` (callback, linhas 125-150) existe **apenas** para obter
o ID numérico que vai para o payload da sessão (arquitetura 7A.3, AMB-08). Sem sessão, o
`githubUserId` fica sem uso. **Recomendo removê-la** (menos um pedido de saída com o token, menos
um ponto de falha, menos código), e remover as interfaces/variáveis que só ela usa
(`GithubUserResponse`, `githubUserId`).

Diferença externa, declarada: hoje, se o GitHub emitir o token mas `GET /user` falhar (falha
transitória da API), o popup mostra o erro genérico. Depois da alteração o token é entregue ao
Decap, que faz ele próprio `GET /user` e a verificação de permissões do repositório ao iniciar
sessão, e é o Decap que mostra o erro. O resultado para o utilizador é o mesmo (não entra); muda
apenas onde a mensagem aparece, num caso raro. Se o utilizador preferir **zero** diferença externa,
a alternativa é manter o `GET /user` como está (código morto funcional) — ver pergunta na secção 6.

### 2.4 Ordem de deploy e rollback (para o devops-engineer)

1. Fazer deploy do código novo **com `SESSION_SECRET` ainda definida** no alojamento — o código
   novo simplesmente ignora-a.
2. Validar o login do Decap no ambiente de preview/sandbox (secção 4, parte B) e depois em produção.
3. **Só depois** remover `SESSION_SECRET` das variáveis de ambiente (Vercel hoje; na task-005, não a
   criar na Netlify).

Razão: o código antigo exige `SESSION_SECRET` (`readOAuthConfig()` devolve `null` -> 500 se faltar).
Se a variável for removida antes e for preciso reverter o deploy, o login do Decap fica partido.
Rollback do código = `git revert` do commit; enquanto a variável existir, é seguro nos dois sentidos.

Cookies `agrotrades_session` já emitidos nos browsers expiram sozinhos (Max-Age 60 min, sem
renovação). Não é preciso emitir um cookie de apagamento — seria código extra para um problema que
se resolve em uma hora e que, de qualquer forma, não confere autoridade nenhuma.

A implementação original fica recuperável no histórico Git (commit `9acc5c1`) caso uma futura
funcionalidade precise de sessão — nesse momento será desenhada de novo, incluindo a questão do
`Path` em aberto (SEC-P5-04), que desaparece com esta remoção.

## 3. B4 — O que NÃO muda (tem de ficar byte-a-byte equivalente)

- `app/api/auth/route.ts`: toda a lógica (provider, scope `public_repo` fixo, `redirect_uri` a
  partir de `OAUTH_ALLOWED_ORIGIN`, `state` CSPRNG, cookie de `state` Lax/Path/TTL, `no-store`).
- Callback: leitura e apagamento do cookie de `state` em todas as saídas, comparação em tempo
  constante, troca `code` -> token, erro genérico único, `Cache-Control: no-store`, códigos HTTP.
- `lib/auth/constantTimeEqual.ts` — **fica** (continua usado pelo callback para o `state`).
- `lib/auth/popupMessage.ts` — lógica inalterada (só o comentário de 2.2).
- `public/admin/config.yml`, `public/admin/index.html`, CSP de `/admin` em `next.config.mjs`.
- Variáveis `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `OAUTH_ALLOWED_ORIGIN`.
- Handoffs históricos da task-001 — **não se editam** (são registo).

Única diferença intencional em respostas HTTP: o callback de sucesso deixa de enviar
`Set-Cookie: agrotrades_session=...`; e a ausência de `SESSION_SECRET` deixa de causar 500.

## 4. Testes de caracterização (obrigatórios ANTES de alterar)

O projeto não tem framework de testes (task-011). Não se introduz um aqui. A caracterização é
feita por pedidos HTTP scriptados + um teste manual ponta-a-ponta, guardando o resultado **antes**
e **depois** em `project/state/task-007-remove-unused-session/` para comparação por `diff`.

### Parte A — scriptada (tester; `next build && next start` ou `next dev`, valores fictícios)

Env de teste: `GITHUB_OAUTH_CLIENT_ID=fake_id`, `GITHUB_OAUTH_CLIENT_SECRET=fake_secret`,
`SESSION_SECRET=<48 chars fictícios>` (só na execução "antes"), `OAUTH_ALLOWED_ORIGIN=http://localhost:3000`.
Registar status, headers relevantes (`Location`, `Set-Cookie`, `Cache-Control`) e corpo:

| # | Pedido | Esperado (antes e depois) |
|---|---|---|
| A1 | `GET /api/auth?provider=github` | 302 para `github.com/login/oauth/authorize` com `client_id`, `redirect_uri=http://localhost:3000/api/auth/callback`, `scope=public_repo`, `state` hex de 64 chars, `allow_signup=false`; `Set-Cookie: agrotrades_oauth_state` HttpOnly, SameSite=Lax, Path=/api/auth/callback, Max-Age=600; `no-store`. |
| A2 | `GET /api/auth?provider=gitlab` | 400, corpo "Erro de autenticação.", `no-store`. |
| A3 | `GET /api/auth?provider=github` com `GITHUB_OAUTH_CLIENT_SECRET` em falta | 500, erro genérico. (Não usar `SESSION_SECRET` em falta para este caso — é a diferença intencional; registar à parte como A3b: antes 500, depois 302.) |
| A4 | `GET /api/auth/callback?code=x&state=y` sem cookie | 400, HTML com `authorization:github:error`, `targetOrigin` literal, cookie de state apagado (Max-Age=0), `no-store`, **sem** `agrotrades_session`. |
| A5 | Callback com cookie `agrotrades_oauth_state=abc` e `state=abd` | Igual a A4. |
| A6 | Callback com cookie e `state` iguais, sem `code` | Igual a A4. |
| A7 | Callback com cookie/state iguais e `code` fictício | GitHub recusa o code -> 400 com o mesmo HTML de erro. |

Os corpos HTML de A4-A7 têm de ser idênticos antes e depois (`diff` vazio).

### Parte B — manual ponta-a-ponta (tester, OAuth App de sandbox, obrigatória)

O caminho de sucesso exige GitHub real e não é caracterizável sem stub. Executar com a OAuth App
de não-produção (restrição 27), antes e depois:

1. Abrir `/admin`, "Login with GitHub", autorizar no popup.
2. Confirmar: o popup fecha sozinho; o Decap mostra as coleções; `localStorage` tem o utilizador
   do Decap com token.
3. Abrir uma entrada (ex.: serviço "arroz"), alterar o resumo PT, gravar -> aparece o rascunho no
   editorial workflow (PR no repositório-sandbox). Descartar a seguir.
4. Na aba Network, resposta de `/api/auth/callback`: registar os `Set-Cookie`. Antes: state apagado
   + `agrotrades_session`. Depois: **só** o state apagado.
5. Terminar sessão no Decap e voltar a entrar (confirma que não há dependência escondida de estado).

Critério de aceitação da refatoração: A1-A7 idênticos (exceto A3b, documentado), B1-B3 e B5
idênticos, B4 com exatamente a diferença descrita. Mais: `npm run build`, `npm run lint` e
`npx tsc --noEmit` sem erros; pesquisa final pelos símbolos da secção 1 devolve zero resultados em
`app/`, `lib/` e `.env.example`.

## 5. B5 — Cancelar a Fase 6 (`/admin/users` + GitHub App `Administration: write`)

### 5.1 Avaliação

O repositório já está numa Organização GitHub (`backend.repo: AgroTrades/agrotrades`), que é
precisamente o que a arquitetura recomendava (7A.6) e o que torna o ecrã próprio redundante.

**A favor de cancelar (recomendação):**
- Elimina a **credencial mais privilegiada do sistema**. `Administration: write` permite mudar a
  visibilidade, desativar a proteção de `main`, transferir e **apagar** o repositório (7A.1). Não
  existe permissão mais fina — o risco não se reduz, só se evita.
- Elimina a classe SEC-01 para os segredos mais valiosos (`GITHUB_APP_PRIVATE_KEY`,
  `GITHUB_APP_INSTALLATION_ID`, `ADMIN_GITHUB_USER_IDS`, `SESSION_SECRET`): deixam de existir.
- Elimina ~15 restrições vinculativas que ainda não têm código (7-14, 29, 30, 33-35, 37, 38 na
  parte da App), e todo o trabalho de Fase 6: GitHub App x2 (produção/sandbox), JWT RS256, tokens
  de instalação, allowlist, 404 indistinguível, CSRF, guardas, rate limit, log.
- O GitHub já fornece, sem código nosso: convites com aceitação explícita, remoção, **2FA
  obrigatório** para membros e colaboradores externos, **audit log** da organização (externo ao
  sistema comprometível — era a "fonte primária" de 7A.6), e recuperação pelo owner.
- O requisito absoluto de 7A.2 ("escrita no repositório NÃO implica poder convidar") é cumprido
  nativamente: gerir acesso exige papel **Admin** no repositório ou **Owner** na organização; o
  papel **Write** (editores) não gere acesso.
- Simplifica a task-005 (migração para a Netlify): menos variáveis, sem App a reconfigurar.

**Contra / o que se perde:**
- A gestão passa a fazer-se na interface do GitHub (em inglês, mais técnica) em vez de um ecrã em
  PT. Mitigação: um procedimento curto em PT (convidar, remover, cancelar convite).
- O "administrador" passa a ser um **Owner da organização** (ou Admin do repositório), que tem mais
  poder do que a App teria. Mitigação: é uma pessoa com 2FA obrigatório e ações auditadas, não um
  segredo num servidor; manter 1-2 owners no máximo.
- Configuração da organização que passa a ser **obrigatória** (devops, uma vez):
  - Exigir 2FA na organização.
  - Permissões base dos membros: "No permission" ou "Read" (nunca "Write" para todos os repos).
  - Editores com papel **Write** no repositório (via equipa `editores` ou como colaboradores
    externos); **nunca** como *team maintainer* (um maintainer pode adicionar membros à equipa, o
    que reabriria o escalonamento que 7A.2 proíbe).
  - Desativar "permitir que administradores de repositório convidem colaboradores externos" se não
    houver Admins de repositório além dos owners.
- **Não muda:** a restrição 28 (proteção de `main`, PR com revisão de terceiro) continua a ser
  pré-condição de convidar o primeiro editor adicional — ela protege contra o SEC-01 para o
  `client_secret` do OAuth, que continua a existir. Deixa de estar ligada à Fase 6 e passa a estar
  ligada ao ato de convidar, seja qual for o meio.

### 5.2 Relação entre B4 e B5

São independentes. B4 vale por si (YAGNI: código de autenticação sem consumidor). Se B5 for
**rejeitado**, a Fase 6 continua planeada e terá de reintroduzir a sessão quando for implementada
(desenho em 7A.3 mantém-se válido, código recuperável do commit `9acc5c1`). Se B5 for **aprovado**,
a sessão deixa de ter qualquer consumidor previsto e a remoção é definitiva.

### 5.3 Alterações de documentação se B5 for aprovado

Princípio: **não apagar histórico de decisão**; marcar como revogado e apontar para a task-007.

`project/context.md`:
- Bullet "Gestão de utilizadores (quem pode editar)" (linhas 77-83): reescrever — gestão feita na
  Organização GitHub (convites nativos, 2FA obrigatório, audit log); editores = papel Write;
  administradores = owners da organização; sem ecrã próprio, sem GitHub App. Referir task-007.
- Parágrafo dos gates (linhas 103-108): passam de três a dois — (1) Decap + proxy OAuth (já
  concluído na task-001), (2) cutover de produção. Retirar a referência à "credencial mais
  privilegiada do sistema".

`project/state/task-001-migracao-stack/architecture-proposal.md`:
- Histórico de versões: acrescentar **v6** — "Fase 6 cancelada e cookie de sessão removido
  (task-007); gestão de editores passa para a Organização GitHub."
- Tabela 0.1, decisão 12: estado passa a "Revogada (task-007)".
- Cabeçalho de 7A: nota "REVOGADO pela task-007 — não implementar"; manter o texto como registo.
  Em 7A.3, a tabela da sessão fica também sob essa nota.
- 9.1: linha "Ecrã de gestão de utilizadores (Fase 6)" marcada como cancelada. 9.5 e 9.6: nota de
  revogação. 9.8: a mitigação continua válida para o `client_secret`; retirar da lista do ponto 1
  as variáveis da App, a allowlist e o `SESSION_SECRET`. 9.10: coluna "Cookie de sessão" revogada
  (o cookie de `state` mantém-se integralmente).
- Secção 10: Fase 0 deixa de exigir "duas GitHub Apps"; Fase 5 perde a frase da emissão do cookie
  de sessão e da identidade via `GET /user` (se 2.3 for aceite); Fase 6 marcada **CANCELADA**,
  com a substituição (configuração da organização da secção 5.1 + restrição 28).
- Secção 11: remover a menção à Fase 6.
- Secção 12: marcar "[REVOGADA — task-007]" nas restrições 7-14, 29, 30, 34, 35, 37 e na parte de
  tokens de instalação/PEM de 2 e 38; em 1 e 27 retirar as variáveis da App, a allowlist e o
  `SESSION_SECRET`; em 31 manter só o cookie de `state`; 33 mantém-se como regra geral para
  futuras mutações (ex.: formulário de contacto, task-006); 28 mantém-se, religada ao convite.
- Opcional, a decidir pelo utilizador: um procedimento curto em PT para convidar/remover editores
  (poderia ser uma secção em `project/context.md`, evitando um ficheiro novo).

Se B5 for aprovado **sem** B4: as mesmas alterações, exceto as referências à remoção da sessão.
Se B4 for aprovado **sem** B5: apenas nota em 7A.3/restrição 30 de que o cookie foi removido e tem
de ser reintroduzido na Fase 6.

## 6. Pergunta concreta para o utilizador (confirmação humana, CLAUDE.md s.4)

Três decisões, cada uma com resposta sim/não:

1. **B4** — Autoriza remover o cookie de sessão (`lib/auth/session.ts`, as constantes de sessão, a
   emissão no callback e a variável `SESSION_SECRET`), mantendo inalterado o fluxo de login do
   Decap, com a remoção da variável no alojamento só depois de validado o deploy?
2. **B4, sub-decisão** — Autoriza remover também a chamada `GET /user` no callback (só servia para
   a sessão; única diferença: num erro raro da API do GitHub, a mensagem aparece no Decap em vez do
   popup)? Se não, fica como está.
3. **B5** — Autoriza cancelar a Fase 6 (`/admin/users` + GitHub App com `Administration: write`),
   passando a gestão de editores para a interface nativa da Organização GitHub (2FA obrigatório,
   audit log, editores com papel Write, administradores = owners), e atualizar `context.md` e
   `architecture-proposal.md` como descrito em 5.3?

## 7. Fluxo recomendado após confirmação

tester (caracterização "antes", secção 4) -> developer (secção 2) -> tester (caracterização
"depois", `diff`) -> security-engineer (LARGE: confirma que nada de segurança do `state`/proxy
regrediu) -> code-reviewer -> devops-engineer (remover `SESSION_SECRET` do alojamento após
validação; se B5, aplicar a configuração da organização da secção 5.1). qa-engineer não é
necessário (sem alteração de comportamento visível ao visitante).
