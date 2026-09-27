# task-007-remove-unused-session — handoff 05 — security-engineer (Gate 4)

**Workflow:** refactoring (CLAUDE.md 3.3) | **Classificação:** LARGE (autenticação)
**Data:** 2026-09-26 | **Revisto:** working tree sobre HEAD `daff045`, só os ficheiros da task-007
(`lib/auth/*`, `app/api/auth/*`, `.env.example`, `project/context.md`,
`task-001-migracao-stack/architecture-proposal.md`, `lib/auth/session.ts` apagado). Alterações de
outras tarefas no mesmo working tree (task-003, 005, 006, 008) não foram revistas.

```
STATUS: APPROVED
SUMMARY: Revisão de segurança da remoção do cookie de sessão, de SESSION_SECRET e da chamada
         GET /user, e da documentação do cancelamento da Fase 6. Nenhuma proteção do fluxo OAuth
         do Decap foi perdida (verificado contra o código, não só contra o diff). A remoção do
         GET /user não abre nenhum caminho: não tinha papel de autorização. Zero referências a
         SESSION_SECRET no código versionado. A documentação preserva as restrições ainda
         relevantes (28, 33, 31 reduzida ao state, 32, 36, 38 parcial, 2FA, papéis). Quatro achados,
         todos low/informational. Nenhum high/critical.
ARTIFACTS: project/state/task-007-remove-unused-session/handoff-05-security-engineer.md (este).
           Nenhum código alterado. Sem commit.
VALIDATIONS: ver secções 1-3.
ISSUES: SEC-T7-01..04 (secção 4), todos low/info.
BLOCKERS: nenhum.
REQUIRED_NEXT_ACTION: code-reviewer (Gate 5). Depois devops-engineer: (a) remover SESSION_SECRET do
           alojamento só após deploy validado (handoff-01 2.4); (b) aplicar e registar a
           configuração da organização GitHub (SEC-T7-03) antes de convidar o primeiro editor
           adicional. Orchestrator: transmitir ao utilizador as ações de SEC-T7-01.
CONTEXT_FOR_NEXT_AGENT: superfície de segurança de /api/auth e /api/auth/callback inalterada; única
           diferença HTTP = ausência de Set-Cookie agrotrades_session no sucesso e SESSION_SECRET
           deixar de ser obrigatória. REQUIRES_HUMAN_NOTIFICATION: false.
```

---

## 1. Fluxo OAuth — verificação ponto a ponto (código atual)

| Proteção | Onde | Resultado |
|---|---|---|
| `state` CSPRNG >= 128 bits (2x `randomUUID`, hex 64) | `app/api/auth/route.ts:54` | Inalterado |
| `state` de uso único: cookie apagado em TODAS as saídas do callback, incluindo sucesso | `callback/route.ts:47-66` (`finish`), todas as 7 saídas passam por `finish` | Mantido; o sucesso passou a `return finish(...)` direto, sem ramo paralelo |
| Comparação em tempo constante | `callback/route.ts:73` (`constantTimeEqual`); `lib/auth/constantTimeEqual.ts` intocado | Mantido |
| Cookie de state: HttpOnly, SameSite=Lax, Path=/api/auth/callback, Max-Age=600, Secure derivado da config (fail-closed `true` se config nula) | `route.ts:68-82`, `callback/route.ts:45,58-64` | Inalterado (confirmado também por A1/A4 e A3-callback na caracterização) |
| `redirect_uri` fixo a partir de `OAUTH_ALLOWED_ORIGIN`, nunca do pedido | `route.ts:55`, `callback/route.ts:81` | Inalterado |
| Validação de `OAUTH_ALLOWED_ORIGIN` (https obrigatório fora de localhost) | `lib/auth/env.ts` `isValidOrigin` | Inalterado; só saiu a leitura/validação de `SESSION_SECRET` |
| Scope `public_repo` fixo, `allow_signup=false`, provider só `github` | `route.ts:43,60,62` | Inalterado |
| `postMessage` com `targetOrigin` literal + verificação de `event.origin` no eco | `lib/auth/popupMessage.ts:43-61` | Lógica inalterada (só um comentário); escape de `<` mantido |
| Erro genérico único, sem oráculo | `renderAuthErrorHtml` em todas as saídas de erro; corpos A4-A7 byte-a-byte iguais (sha256 igual antes/depois) | Mantido; com menos um ramo de erro (GET /user), a superfície de oráculo diminuiu |
| `Cache-Control: no-store` | `genericError`, redirect 302 e `finish` | Inalterado em todas as respostas |
| Logs sem `code`/`state`/token | `callback/route.ts:106,111` | Inalterado |
| `readOAuthConfig()` continua fail-closed para as 3 variáveis restantes | `env.ts:62-69` | Sim (A3/A3-callback iguais antes/depois) |

## 2. Remoção do `GET /user` e do cookie de sessão

- O `GET /user` só alimentava o payload da sessão; o resultado nunca decidia autorização (qualquer
  conta GitHub que completasse o OAuth recebia sessão, que por sua vez não tinha consumidor). O token
  entregue ao Decap vem da troca servidor-a-servidor `code` -> token com `client_secret`, que é
  onde está a garantia de autenticidade; a autorização real (escrita no repositório) é imposta pelo
  próprio GitHub em cada chamada do Decap. Removê-lo não abre nada e elimina um pedido de saída
  com o token.
- Cookie `agrotrades_session`: zero leitores confirmados (sem `middleware`/`proxy`, sem
  `app/admin`, sem `/api/admin`, zero ocorrências em `public/admin/`). Cookies já emitidos expiram
  em <= 60 min e não conferem autoridade — não é necessário cookie de apagamento.
- Pesquisa em ficheiros versionados por `SESSION_SECRET`, `agrotrades_session`, `sessionSecret`,
  `lib/auth/session`, `createSessionToken`, `verifySessionToken`: zero resultados em código;
  restantes ocorrências só em documentação, riscadas/anotadas como revogadas. `.env.example` limpo.
- Artefactos da caracterização (`characterize-auth.mjs`, `baseline-*.json`) sem segredos reais:
  só valores fictícios; nenhum padrão de token GitHub nos JSON; `.env.local` não é lido.
  `.env.local` está no `.gitignore` e nunca foi commitado (histórico verificado).

## 3. Documentação (Fase 6 cancelada)

Restrições ainda relevantes confirmadas como preservadas em `architecture-proposal.md` v6 e/ou
`context.md`:
- **28** (proteção de `main`, PR com revisão de terceiro) mantida e religada ao ato de convidar o
  primeiro editor adicional, com a justificação correta (SEC-01 para o `client_secret`).
- **2FA obrigatório na organização**, editores = Write (nunca team maintainer), administradores =
  owners (1-2), permissões base "No permission"/"Read", desativar convites por Admins de
  repositório — na secção "Fase 6 — CANCELADA" (substituição) e, em parte, em `context.md`.
- **1, 27** reduzidas ao `client_secret` (27 ficou mais estrita: passa a nomear explicitamente o
  `client_secret`), **31** reduzida ao cookie de state sem perda de atributos, **32, 33, 36**
  intactas, **38** mantém a proibição de `code`/`state`/cookie em logs.
- Texto revogado preservado como registo; commit `9acc5c1` indicado para recuperação.

## 4. Achados

### SEC-T7-01 — low — Valor de `SESSION_SECRET` do `.env.local` exposto num transcript de ferramenta
O valor ficou no registo da sessão (ficheiros locais do Claude Code e contexto enviado ao modelo);
não foi escrito em nenhum ficheiro do repositório. Impacto prático nulo: a variável deixa de ser
usada com este código, e mesmo no código antigo o cookie assinado com ela não conferia autoridade
nenhuma (sem consumidor). Ações recomendadas, nenhuma bloqueante:
1. Apagar a linha `SESSION_SECRET` do `.env.local` (utilizador).
2. Nunca reutilizar esse valor: se uma funcionalidade futura reintroduzir sessão, gerar segredo novo.
3. Confirmar (utilizador) que o valor local NÃO é igual ao de produção (restrição 27: segredos de
   produção só em Production, pelo que não deveria ser). Se for igual, não há nada a rodar hoje —
   remove-se do alojamento no passo 3 de handoff-01 2.4 — mas regista-se como violação da 27.
4. O handoff-04 refere um grep de "controlo positivo" por `GITHUB_OAUTH_CLIENT_SECRET` que também
   apanhou o `.env.local`. Se esse grep correu em modo de conteúdo (mostrando a linha), o
   `client_secret` da OAuth App de sandbox também ficou no transcript: nesse caso, rodar esse
   `client_secret` no GitHub (custo baixo, é a app de sandbox). Se só listou nomes de ficheiros,
   nada a fazer. Recomendação para os agentes: pesquisas sobre `.env*` apenas com
   `files_with_matches`/contagem, nunca em modo de conteúdo.

### SEC-T7-02 — info — Ordem de deploy de `SESSION_SECRET` (disponibilidade, não confidencialidade)
Já tratada no handoff-01 2.4 e na task-005 (P-4): remover a variável do alojamento só depois do
deploy validado, para o rollback por `git revert` não partir o login. Sem ação adicional além de o
devops-engineer seguir essa ordem.

### SEC-T7-03 — low — Configuração da organização GitHub passa a ser controlo de segurança obrigatório sem gate de verificação explícito
Com o cancelamento da Fase 6, a separação "escrita não implica gerir acesso" e o 2FA passam a
depender apenas de configuração da organização. Está bem documentada, mas não há ainda um passo
verificável que a confirme. Recomendação: o devops-engineer aplica e regista com evidência (2FA
exigido, permissões base, editores Write sem team maintainer, owners <= 2, convites de
colaboradores externos restritos, proteção de `main` — restrição 28) ANTES do primeiro convite a um
editor adicional. Opcional: acrescentar essa lista a `context.md`, que hoje só menciona 2FA, papéis
e a restrição 28.

### SEC-T7-04 — info — Cookies `agrotrades_session` residuais nos browsers
Emitidos antes do deploy, `Path=/admin`, expiram em <= 60 min, sem leitor. Nenhuma ação.

## 5. Conclusão

Gate 4: **APPROVED**. Nenhuma regressão de segurança no fluxo OAuth; a superfície diminuiu (menos um
segredo, menos um cookie, menos um pedido de saída com o token, menos um ramo de erro). Nenhum achado
high/critical — `REQUIRES_HUMAN_NOTIFICATION: false`. As ações de SEC-T7-01 devem ser transmitidas
ao utilizador por serem dele (ficheiro local e eventual rotação na app de sandbox).
