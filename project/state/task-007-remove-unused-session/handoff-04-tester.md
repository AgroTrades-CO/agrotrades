# task-007-remove-unused-session — handoff 04 — tester (Gate 3, parte A "depois" + revisão de âmbito)

**Workflow:** refactoring (CLAUDE.md 3.3) | **Classificação:** LARGE (autenticação)
**Data:** 2026-09-26 | **Código testado:** working tree sobre HEAD `daff045` (os commits `4a64e70` e
`daff045` desde a linha de base `2ce949d` só tocam em `components/ContactForm.tsx` e em
`project/state/task-002-*`; `app/api/auth`, `lib/auth`, `.env.example`, `public/admin` e
`next.config.mjs` são idênticos entre `2ce949d` e `HEAD` — a comparação antes/depois é válida).

```
STATUS: APPROVED
SUMMARY: Parte A "depois" executada nas mesmas condições da linha de base (next dev, Node v24.16.0,
         ambiente fictício). compare: 11 casos IGUAIS, 2 DIFERENTES — exatamente A3b (500 -> 302) e
         A3b-callback (500 -> 400), as únicas diferenças permitidas; A3b ficou igual a A1 e
         A3b-callback igual a A7 (status, cabeçalhos, cookies e corpo). Nenhum caso emite
         agrotrades_session. Diff revisto contra o handoff-01 secção 2: dentro do âmbito, fluxo
         OAuth do Decap intacto. tsc sem erros. Grep: zero referências aos símbolos removidos no
         código versionado. Parte B (login real) fica para o utilizador — guião abaixo.
ARTIFACTS: project/state/task-007-remove-unused-session/characterization/baseline-after.json (novo)
           project/state/task-007-remove-unused-session/handoff-04-tester.md (este)
           Nenhum ficheiro de código alterado. Sem commit. Sem npm install.
VALIDATIONS:
  1. `node characterize-auth.mjs run --out baseline-after.json` (pasta characterization/) -> OK.
     Logs do servidor: 0 mensagens "configuração incompleta" em `full` e em
     `missing-session-secret` (antes: 3 nesta), 3 em `missing-client-secret` (igual a antes).
  2. `node characterize-auth.mjs compare baseline-before.json baseline-after.json` -> exit 1 com:
       IGUAL: full/A1, A2, A2b, A4, A5, A6, A7; missing-client-secret/A3, A3-callback
       DIFERENTE: missing-session-secret/A3b        500 "Erro de autenticação." -> 302 para
                  github.com/login/oauth/authorize (client_id=fake_id, redirect_uri
                  http://localhost:3000/api/auth/callback, scope=public_repo, state hex64,
                  allow_signup=false) + cookie de state (HttpOnly, Lax, Path=/api/auth/callback,
                  Max-Age=600, valor = state do Location), no-store.
       DIFERENTE: missing-session-secret/A3b-callback 500 (HTML sem TARGET_ORIGIN, cookie Secure)
                  -> 400 com o HTML de erro normal (TARGET_ORIGIN "http://localhost:3000" literal,
                  sha256 9cf738bd0e20..., igual a A4-A7), cookie de state apagado (Max-Age=0).
     Verificação adicional por script: A3b(depois) == A1(depois) e A3b-callback(depois) ==
     A7(depois) -> true/true. `agrotrades_session` em qualquer Set-Cookie -> false.
     A7 chegou ao GitHub (400, não 502) — rede disponível, comparação válida.
  3. Segredos: nenhum valor fictício de segredo (fake_secret, SESSION_SECRET fictício) nem nenhum
     valor do .env.local aparece no JSON, exceto OAUTH_ALLOWED_ORIGIN (localhost, não é segredo),
     como na linha de base.
  4. Revisão do diff (git diff + ficheiro apagado), contra handoff-01 secção 2/3:
     - lib/auth/session.ts apagado; oauthState.ts sem SESSION_COOKIE/SESSION_MAX_AGE_SECONDS
       (ficam as 3 constantes de state/callback); env.ts sem sessionSecret (interface, leitura,
       obrigatoriedade, mensagem, validação de 32 chars), isValidOrigin intacto; .env.example sem o
       bloco SESSION_SECRET; callback sem GithubUserResponse, GET /user, createSessionToken e
       Set-Cookie de sessão, sucesso = finish(renderAuthSuccessHtml(config.allowedOrigin,
       accessToken), 200). Comentários: route.ts ("num cookie próprio"), popupMessage.ts (sem "ID
       numérico"), cabeçalho do callback (sem "GET /user" — ajuste extra declarado no handoff-03,
       só comentário, correto).
     - Fluxo OAuth intacto: app/api/auth/route.ts só com a linha de comentário alterada (state
       CSPRNG, scope "public_repo" fixo, redirect_uri a partir de OAUTH_ALLOWED_ORIGIN, cookie de
       state Lax/Path/Max-Age, no-store). Callback: cookie de state lido e apagado em TODAS as
       saídas via finish() (incluindo sucesso), constantTimeEqual no state, validação do code,
       troca code -> token com os mesmos retornos 400/400/502 e log sem dados sensíveis,
       Cache-Control no-store em todas as respostas. popupMessage.ts: lógica inalterada
       (targetOrigin literal confirmado no corpo de A4-A7). constantTimeEqual.ts, public/admin/*,
       next.config.mjs: sem alterações.
     - B5 (docs): só project/context.md e task-001/architecture-proposal.md; nenhum handoff
       histórico da task-001 editado.
  5. `npx tsc --noEmit` -> exit 0.
  6. Grep (excluindo node_modules, .next, project/, .git) por SESSION_SECRET, agrotrades_session,
     createSessionToken, verifySessionToken, SESSION_COOKIE, SESSION_MAX_AGE, sessionSecret,
     lib/auth/session, api.github.com/user, "GET /user", GithubUserResponse, githubUserId ->
     zero resultados em ficheiros versionados. Único resultado: `.env.local` (ignorado pelo Git,
     `.gitignore: .env*.local`, não versionado) ainda define SESSION_SECRET — ver ISSUES.
     Controlo positivo (OAUTH_STATE_COOKIE / GITHUB_OAUTH_CLIENT_SECRET) encontra os 5 ficheiros
     esperados + .env.local.
  7. Servidor parado no fim: porta 3000 livre. next-env.d.ts sem alterações.
ISSUES:
  1. `.env.local` (local, não versionado) ainda tem SESSION_SECRET. Inofensivo (o código ignora-a),
     mas pode ser apagada pelo utilizador. Nota de transparência: a pesquisa por grep mostrou esse
     valor local no registo interno da ferramenta do tester; não foi copiado para nenhum ficheiro
     nem handoff. Como a variável deixou de ter uso, a forma mais simples é apagar essa linha.
     Não confundir com a variável no alojamento (Vercel): essa só se remove DEPOIS do deploy
     validado (handoff-01 2.4, devops-engineer).
  2. Fora do âmbito da task-007, presentes no working tree: `.eslintrc.json` apagado e
     `eslint.config.mjs` novo (task-003), pastas de estado de outras tasks (003, 005, 006, 008) e
     `project/state/plano-melhorias.md`. Não fazem parte desta alteração; quem fizer o commit deve
     incluir só os ficheiros da task-007 (lista em ARTIFACTS do handoff-03 + characterization/ +
     handoffs desta pasta).
  3. `npm run lint` não corrido (configuração ESLint em migração na task-003) — igual ao handoff-03.
  4. O caminho de sucesso (200 + token) não é caracterizável sem GitHub real -> parte B.
BLOCKERS: nenhum para a parte A. O Gate 3 fica completo quando o utilizador confirmar a parte B.
REQUIRED_NEXT_ACTION: Orchestrator apresenta ao UTILIZADOR o guião da parte B (abaixo) e regista o
          resultado. Se a parte B passar: security-engineer (Gate 4, LARGE) -> code-reviewer ->
          devops-engineer (remover SESSION_SECRET do alojamento só depois do deploy validado).
          Se falhar: voltar ao developer com a observação exata.

  GUIÃO PARTE B (para o utilizador — login real com a OAuth App de sandbox, em localhost)
  Antes de começar: confirme que o `.env.local` tem o Client ID e o Client Secret da OAuth App de
  SANDBOX (não a de produção) e OAUTH_ALLOWED_ORIGIN=http://localhost:3000, e que essa OAuth App
  tem como "Authorization callback URL" http://localhost:3000/api/auth/callback.
  1. Num terminal, na pasta do projeto: `npm run dev`. Espere por "Ready".
  2. No browser, abra http://localhost:3000/admin/ .
  3. Abra as ferramentas de programador (F12), separador "Network" (Rede), e marque
     "Preserve log" (Manter registo).
  4. Clique em "Login with GitHub". Na janela que abre, autorize a aplicação.
  5. Confirme: a janela fecha-se sozinha e o Decap mostra as coleções (Serviços, Site, etc.).
  6. No separador Network, procure o pedido `callback?code=...` (de /api/auth/callback) e abra
     "Headers" -> "Response Headers". Confirme:
       - existe UM único Set-Cookie, `agrotrades_oauth_state=;` com Max-Age=0 (é o apagamento do
         cookie de state);
       - NÃO existe nenhum Set-Cookie `agrotrades_session`;
       - Cache-Control: no-store; Status 200.
     Em "Application" (Aplicação) -> "Cookies" -> http://localhost:3000: não deve existir
     `agrotrades_session` (se existir de testes antigos, apague-o antes e repita).
  7. No Decap, abra uma entrada (por ex. o serviço "arroz"), altere uma letra no resumo em PT e
     clique em "Save" (Guardar). Confirme que aparece como rascunho ("Draft"/workflow editorial).
  8. Descarte o rascunho: na entrada, use "Delete unpublished entry"/"Delete changes" (Eliminar
     alterações não publicadas) e confirme. Verifique que o rascunho desapareceu do "Workflow".
  9. Termine sessão no Decap (menu do avatar -> "Log out") e volte a fazer "Login with GitHub".
     Confirme que volta a entrar normalmente.
  10. Pare o servidor no terminal (Ctrl+C).
  Responda ao Orchestrator: "Parte B OK" ou descreva o passo que falhou e o que viu (sem colar
  tokens nem cookies com valores).

CONTEXT_FOR_NEXT_AGENT: security-engineer — a superfície de segurança do state/proxy não mudou
          (ver VALIDATIONS 4); a única alteração de comportamento HTTP é a ausência de
          agrotrades_session no sucesso e a não-exigência de SESSION_SECRET (A3b/A3b-callback).
          Menos um pedido de saída com o token (GET /user removido). Resultados completos em
          characterization/baseline-before.json e baseline-after.json.
```
