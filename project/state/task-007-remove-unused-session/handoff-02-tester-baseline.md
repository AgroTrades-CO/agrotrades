# task-007-remove-unused-session — handoff 02 — tester (linha de base, parte A)

**Workflow:** refactoring (CLAUDE.md 3.3) | **Classificação:** LARGE (autenticação)
**Data:** 2026-09-26 | **Código testado:** HEAD `2ce949d`, sem alterações locais em `app/api/auth`, `lib/auth`, `.env.example`

```
STATUS: READY
SUMMARY: Linha de base de caracterização (handoff-01, secção 4, parte A) capturada ANTES de
         qualquer alteração ao código. Script Node sem dependências arranca `next dev` três vezes
         (três configurações de ambiente fictícias), executa 13 pedidos a /api/auth e
         /api/auth/callback, normaliza e grava JSON. Todos os casos A1-A7 deram o resultado
         esperado pelo architect; A3b (SESSION_SECRET em falta) = 500, como previsto para "antes".
         Nenhum código de produção alterado. Nenhum login real no GitHub. Sem commit.
ARTIFACTS: project/state/task-007-remove-unused-session/characterization/characterize-auth.mjs
           project/state/task-007-remove-unused-session/characterization/baseline-before.json
           project/state/task-007-remove-unused-session/handoff-02-tester-baseline.md (este)
VALIDATIONS: ver secção 2 (resultados por caso). Servidor parado no fim (porta 3000 livre).
           Verificado que nenhum valor do .env.local aparece no JSON, exceto OAUTH_ALLOWED_ORIGIN
           (origem localhost, não é segredo, coincide com o valor fictício usado).
ISSUES: ver secção 3 (A7 depende de rede; ambiente fictício em vez do .env.local).
BLOCKERS: nenhum.
REQUIRED_NEXT_ACTION: developer aplica a secção 2 do handoff-01. Depois, tester corre
           `node characterize-auth.mjs run --out baseline-after.json` e
           `node characterize-auth.mjs compare baseline-before.json baseline-after.json`
           (na pasta characterization/). Parte B (manual) é feita pelo utilizador.
CONTEXT_FOR_NEXT_AGENT: diferença esperada no compare = APENAS os dois casos da configuração
           missing-session-secret (A3b: 500 -> 302 com cookie de state; A3b-callback: 500 -> 400
           com o HTML de erro normal e targetOrigin literal). Tudo o resto tem de dar IGUAL.
```

---

## 1. Como foi executado

- Comando (na pasta `characterization/`): `node characterize-auth.mjs run --out baseline-before.json`
- O script arranca `node node_modules/next/dist/bin/next dev -p 3000` por cada configuração, espera
  que responda, aquece as duas rotas (compilação on-demand), corre os casos com
  `fetch(..., { redirect: "manual" })` e mata a árvore de processos (`taskkill /T /F` no Windows).
- Variáveis de ambiente **fictícias**, como define o handoff-01 (secção 4, parte A):
  `GITHUB_OAUTH_CLIENT_ID=fake_id`, `GITHUB_OAUTH_CLIENT_SECRET=fake_secret`,
  `SESSION_SECRET=<48 chars fictícios>`, `OAUTH_ALLOWED_ORIGIN=http://localhost:3000`.
  Definidas no processo, sobrepõem-se ao `.env.local` (o `@next/env` não substitui variáveis já
  definidas). "Em falta" = string vazia, que é falsy em `readOAuthConfig()` e impede o
  preenchimento a partir do `.env.local`. Confirmado pelos logs do servidor: 0 mensagens de
  "configuração incompleta" na configuração `full`, 3 em cada uma das outras.
- Configurações: `full` (A1, A2, A2b, A4-A7), `missing-client-secret` (A3, A3-callback),
  `missing-session-secret` (A3b, A3b-callback).
- Normalização: `state` no Location -> `<STATE:hex64>`; `client_id` só em claro se começar por
  `fake_`; valores de `Set-Cookie` nunca gravados (só `<empty>`/`<hex64>`/comprimento e, para o
  cookie de state, se coincide com o `state` do Location); `Expires` -> `<date>`; sequências hex de
  64 chars e `"token":"..."` no corpo substituídas. Logs do servidor não são gravados (só contagens).
- Reutilização: `run` também aceita `--base-url` + `--config <nome>` para correr contra um servidor
  arrancado à parte (ex.: `next start`); `compare` compara dois JSON ignorando `meta`
  (saída 0 = idênticos, 1 = diferenças).

## 2. Resultados da linha de base ("antes")

| Caso | Pedido | Status | Cabeçalhos / cookies | Corpo |
|---|---|---|---|---|
| A1 | `GET /api/auth?provider=github` | 302 | Location `https://github.com/login/oauth/authorize` com `client_id=fake_id`, `redirect_uri=http://localhost:3000/api/auth/callback`, `scope=public_repo`, `state` hex64, `allow_signup=false` (por esta ordem). `Set-Cookie: agrotrades_oauth_state` = hex64 igual ao `state` do Location; HttpOnly, SameSite=lax, Path=/api/auth/callback, Max-Age=600, Expires; sem Secure (origem http). `Cache-Control: no-store`. Sem Content-Type. | vazio |
| A2 | `GET /api/auth?provider=gitlab` | 400 | `no-store`, `text/plain;charset=UTF-8`, sem cookies | "Erro de autenticação." |
| A2b | `GET /api/auth` (sem provider) — caso extra | 400 | idem A2 | idem A2 |
| A3 | `/api/auth?provider=github`, CLIENT_SECRET em falta | 500 | idem A2 | idem A2 |
| A3-callback | callback, CLIENT_SECRET em falta — caso extra | 500 | state apagado (vazio, Max-Age=0) **com Secure** (config nula -> caso mais restritivo), `no-store`, `text/html; charset=utf-8` | HTML de erro com `TARGET_ORIGIN` nulo (204 chars, sha256 `c0744652b833...`) |
| A3b | `/api/auth?provider=github`, SESSION_SECRET em falta | **500** | idem A2 | idem A2 — **diferença intencional: depois deve ser 302 igual a A1** |
| A3b-callback | callback, SESSION_SECRET em falta — caso extra | **500** | idem A3-callback | idem A3-callback — **diferença intencional: depois deve ser 400 igual a A7** |
| A4 | callback sem cookie de state | 400 | `agrotrades_oauth_state` vazio, HttpOnly, SameSite=lax, Path=/api/auth/callback, Max-Age=0 (sem Secure). `no-store`, `text/html; charset=utf-8`. **Sem `agrotrades_session`.** | HTML com `authorization:github:error`, `TARGET_ORIGIN = "http://localhost:3000"` literal (996 chars, sha256 `9cf738bd0e20...`) |
| A5 | cookie `abc`, state `abd` | 400 | idem A4 | idêntico a A4 |
| A6 | cookie = state, sem `code` | 400 | idem A4 | idêntico a A4 |
| A7 | cookie = state, `code` fictício | 400 | idem A4 | idêntico a A4 |

Todos coincidem com o esperado na tabela da secção 4 do handoff-01. Os corpos de A4-A7 são
byte-a-byte iguais entre si (mesmo sha256), o que também confirma o "erro genérico único".

## 3. Notas e limitações

1. **A7 depende de rede.** O pedido `POST https://github.com/login/oauth/access_token` com
   credenciais fictícias chegou ao GitHub e foi recusado (400; um 502 indicaria falha de rede). Se
   o "depois" for corrido sem rede, A7 dará 502 — não é regressão; repetir com rede.
2. **Ambiente fictício em vez do `.env.local`.** Segui o handoff-01 (valores fictícios) em vez das
   variáveis reais: torna o resultado reprodutível, evita que o `client_id` real vá para o JSON e
   permite forçar A3/A3b sem editar o `.env.local`. O `.env.local` existe e tem as quatro
   variáveis OAuth, mas os seus valores não foram lidos pelo servidor nem gravados.
3. **O caminho de sucesso (200 + token + `agrotrades_session`) não é caracterizável aqui** — exige
   GitHub real. Fica para a parte B (manual, utilizador, OAuth App de sandbox).
4. Corrido com `next dev` (Next 16.3.2, Node v24.16.0). Para comparação válida, o "depois" deve
   usar o mesmo modo.
5. O `meta.generatedAt` e `meta.git` mudam entre execuções; o `compare` ignora `meta`.
