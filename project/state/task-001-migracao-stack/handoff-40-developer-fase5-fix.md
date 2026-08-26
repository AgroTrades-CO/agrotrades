# Handoff 40 — Developer — Fase 5, correções obrigatórias (SEC-P5-01/02/03/04)

**Task:** 001-migracao-stack
**Agente:** developer
**Âmbito:** as três correções obrigatórias exigidas em
`handoff-39-security-engineer-fase5.md` (SEC-P5-01, SEC-P5-02, SEC-P5-03) mais a documentação
pedida para SEC-P5-04. Autorização explícita do dono do projeto para implementar estas 4
correções concretas, conforme instrução recebida.

---

STATUS: COMPLETED

---

SUMMARY:

Implementadas as quatro correções pela ordem pedida. Todas verificadas por execução (não só por
leitura), com os mesmos comandos/critérios que o security-engineer usou no handoff-39, para
facilitar a reverificação dele.

1. **SEC-P5-01** — `Cache-Control: no-store` adicionado a **todas** as respostas de
   `app/api/auth/route.ts` (sucesso e erro) e de `app/api/auth/callback/route.ts` (todas passam
   pela função `finish()`, que agora define o header antes de devolver a resposta).
2. **SEC-P5-02** — o atributo `secure:` dos três `cookies.set(...)` deixou de depender de
   `request.nextUrl.protocol` (que reflete `X-Forwarded-Proto`, um valor do pedido) e passou a
   depender de `config.allowedOrigin.startsWith("https:")` — a origem de configuração já validada
   pelo servidor. Em `app/api/auth/callback/route.ts`, como `finish()` também corre no caminho em
   que `config` pode ser `null` (variáveis em falta), calculei uma variável `cookiesSecure` a
   partir de `allowedOrigin` com fallback para `true` (mais restritivo) quando não há configuração
   válida — nunca `false` por omissão. Também corrigido `lib/auth/env.ts`: `isValidOrigin()` só
   aceita `http:` quando o hostname é `localhost` ou `127.0.0.1`; qualquer outro `http` (incluindo
   produção mal configurada) passa a ser rejeitado na validação de arranque, tal como já acontecia
   para outros erros de configuração (resposta 500 genérica, motivo só nos logs do servidor).
3. **SEC-P5-03** — implementadas as duas medidas cumulativas recomendadas:
   a. Nova entrada em `next.config.mjs` para `source: "/images/uploads/:path*"`, com
      `Content-Security-Policy: sandbox; default-src 'none'` e `X-Content-Type-Options: nosniff`.
      Posicionada **depois** da entrada global (`/:path*`) e **antes** da entrada de `/admin/:path*`
      no array devolvido por `headers()` — não há sobreposição de `source` entre
      `/images/uploads/:path*` e `/admin/:path*`, por isso a ordem relativa entre estas duas não
      importa tecnicamente, mas mantive-a fisicamente entre elas para não obrigar quem lê o
      ficheiro a saltar para trás. Confirmei por execução que nem a CSP de `/admin` nem a CSP
      global mudaram (ver VALIDATIONS).
   b. **Investigação, não a alteração pedida literalmente** — ver ISSUES. A media library
      embutida do Decap (backend `github`, sem integração de terceiros) **não tem nenhuma chave em
      `config.yml` para restringir extensões/MIME types**. Confirmei isto contra o bundle
      instalado: o `<input type="file">` do widget `image` usa sempre `accept="image/*"`, fixo no
      código do Decap (`grep -o` no bundle, ver VALIDATIONS), o que inclui SVG e não é
      configurável; e `node_modules/decap-cms-core/index.d.ts` documenta `CmsMediaLibraryOptions`
      como `any`, relevante apenas para bibliotecas de media de terceiros registadas via
      `registerMediaLibrary` (Cloudinary/Uploadcare), não para o backend git por omissão que este
      projeto usa. Não escrevi uma chave `config.yml` que pareceria restringir a extensão mas que
      o Decap ignoraria silenciosamente — isso seria pior do que não escrever nada (falsa sensação
      de segurança). Documentei isto em comentário no próprio `config.yml`, apontando para a
      entrada de `next.config.mjs` (correção **a**) como a defesa real e efetiva, que **por si só
      já fecha o vetor** independentemente da extensão do ficheiro (é exatamente o que o
      security-engineer escreveu: "qualquer uma fecha; recomendo as duas primeiras, cumulativas").
4. **SEC-P5-04** — comentário acrescentado em `app/api/auth/callback/route.ts`, no ponto exato
   onde `Path=/admin` é definido no `Set-Cookie` do cookie de sessão, a explicar que a Fase 6 tem
   de decidir deliberadamente entre alargar o Path para `/`, usar um Path próprio, ou mover as
   rotas privilegiadas para `/admin/api/`. Nenhuma mudança de comportamento.

`npm run build` (com `prebuild` a correr `scripts/copy-decap-cms.mjs`) compila sem erros — ver
VALIDATIONS.

---

ARTIFACTS:

- `app/api/auth/route.ts` — `Cache-Control: no-store` em `genericError()` e na resposta de
  sucesso; `secure` do cookie de state derivado de `config.allowedOrigin`.
- `app/api/auth/callback/route.ts` — `Cache-Control: no-store` centralizado em `finish()`;
  variável `cookiesSecure` derivada de `allowedOrigin` para o cookie de state (dentro de
  `finish()`); `secure` do cookie de sessão derivado de `config.allowedOrigin`; comentário
  SEC-P5-04 junto ao `path: "/admin"` do cookie de sessão.
- `lib/auth/env.ts` — `isValidOrigin()` só aceita `http:` para `localhost`/`127.0.0.1`.
- `next.config.mjs` — nova entrada `headers()` para `/images/uploads/:path*`.
- `public/admin/config.yml` — comentário SEC-P5-03 em `media_library` a documentar a limitação
  real do Decap e a apontar para a defesa efetiva (`next.config.mjs`). **Não** foi possível
  adicionar uma restrição funcional de extensão dentro deste ficheiro — ver ISSUES.
- Nenhum ficheiro de teste automatizado criado/alterado — esta correção não introduziu
  comportamento novo com contrato próprio (é redução de superfície de ataque em código já
  existente); a verificação foi feita por execução manual com `next start` + `curl`, replicando os
  comandos do security-engineer. Se o `tester` preferir formalizar isto em testes automatizados
  (ex.: teste de integração que arranca a rota e verifica os headers da resposta), não há nada
  nesta correção que o impeça — sinalizo como possível melhoria, não como falta.

---

VALIDATIONS:

**Build:**
```
npm run build
...
✓ Compiled successfully in 15.3s
✓ Generating static pages using 7 workers (30/30) in 5.0s
```
Sem erros de TypeScript nem de build. `/api/auth` e `/api/auth/callback` continuam listadas como
rotas dinâmicas (`ƒ`).

**SEC-P5-01 — Cache-Control: no-store, todas as respostas:**
```
next start -p 3199, OAUTH_ALLOWED_ORIGIN=http://localhost:3199, credenciais fictícias

curl -s -D - -o /dev/null "http://localhost:3199/api/auth?provider=github"
-> HTTP/1.1 302 Found ... cache-control: no-store ... set-cookie: agrotrades_oauth_state=...

curl -s -D - -o /dev/null "http://localhost:3199/api/auth/callback?state=bad&code=x"
-> HTTP/1.1 400 Bad Request ... cache-control: no-store ...
   set-cookie: agrotrades_oauth_state=; Path=/api/auth/callback; Max-Age=0; HttpOnly; SameSite=lax
```
O caminho de erro do callback (`state` inválido) e o redirect de `/api/auth` têm ambos
`cache-control: no-store`. O caminho de sucesso do callback passa pela mesma função `finish()`,
por isso está coberto pela mesma linha de código — não precisei de credenciais reais do GitHub
para confirmar isto, é o mesmo caminho de código para todos os status.

**SEC-P5-02 — Secure derivado da configuração, não do pedido:**
```
Servidor A: OAUTH_ALLOWED_ORIGIN=http://localhost:3199 (dev local, esperado sem Secure)

curl -s -D - -o /dev/null "http://localhost:3199/api/auth?provider=github"
-> set-cookie: ...; HttpOnly; SameSite=lax                          (SEM Secure — correto)

curl -s -D - -o /dev/null -H "X-Forwarded-Proto: https" "http://localhost:3199/api/auth?provider=github"
-> set-cookie: ...; HttpOnly; SameSite=lax                          (SEM Secure — o header do
   pedido já NÃO tem qualquer efeito; antes da correção este mesmo comando produzia Secure)

Servidor B: OAUTH_ALLOWED_ORIGIN=https://example.com, pedido feito por HTTP simples (não TLS)

curl -s -D - -o /dev/null "http://localhost:3200/api/auth?provider=github"
-> set-cookie: ...; Secure; HttpOnly; SameSite=lax                  (COM Secure — vem da
   configuração, não da ligação real, que nem sequer é https aqui)
```
Isto reproduz exatamente o teste do security-engineer (secção SEC-P5-02 do handoff-39) e inverte o
resultado: o header do pedido deixou de influenciar `Secure`; só a configuração o faz.

`isValidOrigin()` (`lib/auth/env.ts`), testado isoladamente com a mesma lógica copiada para um
script Node ad-hoc:
```
http://localhost:3000   -> true   (permitido)
http://127.0.0.1:3000   -> true   (permitido)
http://agrotrades.co.mz -> false  (rejeitado — http fora de localhost/127.0.0.1)
https://agrotrades.co.mz-> true   (permitido)
http://evil.localhost   -> false  (rejeitado — hostname != "localhost" literal, não sufixo)
```

**SEC-P5-03a — CSP de /images/uploads, sem afetar /admin nem a global:**
```
curl -s -D - -o /dev/null "http://localhost:3199/images/uploads/anything.svg"
-> X-Content-Type-Options: nosniff
   Content-Security-Policy: sandbox; default-src 'none'

curl -s -D - -o /dev/null "http://localhost:3199/admin"
-> Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
   (IDÊNTICA à documentada no handoff-39, ponto 10 — inalterada)

curl -s -D - -o /dev/null "http://localhost:3199/"
-> Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
   (IDÊNTICA à documentada no handoff-39, ponto 10 — inalterada)
```
`sandbox` sem `allow-scripts` bloqueia execução de qualquer script vindo desse caminho,
independentemente da extensão do ficheiro servido — cobre SVG com `<script>` inline mesmo que
chegue a ser publicado.

**SEC-P5-03b — limitação real do Decap, verificada contra o bundle instalado:**
```
grep -o 'type:"file".\{80\}' public/admin/vendor/decap-cms/decap-cms.js
-> ...Rn("input",{type:"file",accept:t?"image/*":"*/*",onChange:n,disabled:r})...
```
`accept` é `"image/*"` ou `"*/*"`, calculado a partir de um booleano interno do widget (é imagem
ou não), nunca de uma configuração do utilizador — não há como restringir a `image/jpeg,image/png,
image/webp` a partir de `config.yml`. Confirmado também em
`node_modules/decap-cms-core/index.d.ts`: `CmsMediaLibraryOptions` é `any`, e a única forma de o
Decap usar essa chave é através de `registerMediaLibrary`, que este projeto não usa (o backend de
media é o próprio `github`, implícito no `backend.name: github`).

**SEC-P5-04:**
Sem comando de verificação — é só comentário. Confirmei visualmente que o comentário está
imediatamente acima de `path: "/admin"` no `cookies.set(SESSION_COOKIE, ...)`.

---

ISSUES (fora do âmbito desta correção, não corrigidos):

- **SEC-P5-03b não é implementável como o handoff-39 descreveu literalmente.** O security-engineer
  pediu para "restringir as extensões aceites pela media library do Decap em
  `public/admin/config.yml`". Investigando, essa chave não existe no Decap CMS instalado (versão
  fixada, backend `github`, sem media library de terceiros) — o `accept` do input de ficheiro é
  fixo no código do Decap. Não escrevi nenhuma chave "parecida" que na prática seria ignorada.
  A mitigação real (correção **a**, CSP de `sandbox; default-src 'none'` em
  `/images/uploads/:path*`) já fecha o vetor descrito no SEC-P5-03 por si só, segundo a própria
  frase do security-engineer ("qualquer uma fecha"). Isto precisa de ser confirmado/aceite
  explicitamente por ele na revalidação — não decidi sozinho que está "suficientemente corrigido",
  só que a correção **b** tal como pedida não existe enquanto capacidade do Decap nesta versão.
  Se o security-engineer quiser uma segunda camada real (não apenas documentação), as opções que
  vi durante a investigação e que ficam fora do âmbito desta tarefa são: (i) um hook de servidor
  que valide a extensão do ficheiro antes de o commit chegar a `main` (não existe hoje — não há
  rotas de mutação nesta fase, é tudo feito pelo próprio Decap contra a API do GitHub), ou (ii) um
  GitHub Action que rejeite PRs com ficheiros `.svg`/`.html` dentro de `public/images/uploads/`.
  Registo, não implemento — decisão de arquitetura/CI, fora do meu mandato aqui.
- Nada mais fora do âmbito foi encontrado durante esta correção — o âmbito era estreito e as
  restantes verificações do handoff-39 (redirect_uri, targetOrigin, state, CSP de /admin, scope,
  bundle sem segredos) não foram tocadas por nenhuma destas alterações; confirmei-o por execução
  (ver acima) e não só por não ter mexido nos ficheiros correspondentes.

---

BLOCKERS: Nenhum.

---

REQUIRED_NEXT_ACTION:

**Para o `tester`:** validar o comportamento funcional habitual (login popup, coleções do Decap,
os três ficheiros-array `stats`/`team`/`locations`) — nada disto foi tocado por esta correção, mas
confirma que continua a funcionar (em particular, confirma que `Cache-Control: no-store` na
resposta de sucesso do callback não interfere com o `postMessage`/fecho do popup, e que o cookie
de sessão continua a ser aceite em `/admin` depois da mudança de `secure:`). Não é preciso repetir
os testes negativos de segurança do security-engineer — não são deles que o tester é responsável.

**Para o `security-engineer` (revalidação):** os comandos da secção VALIDATIONS acima replicam os
mesmos usados no handoff-39 (mesmas portas de teste livres para reutilizar: `next start -p <porta>`
+ variáveis fictícias). Pontos que pedem atenção especial na revalidação:
- SEC-P5-01/02: comportamento confirmado em dois servidores com `OAUTH_ALLOWED_ORIGIN` diferentes
  (http local e https simulado) — reproduzível exatamente como descrito.
- SEC-P5-03: a correção **a** (CSP) está implementada e verificada; a correção **b** (extensões em
  `config.yml`) **não foi implementada como pedida literalmente** porque não existe essa capacidade
  no Decap instalado — só documentação no ficheiro a apontar para a correção **a**. Preciso que
  confirmes explicitamente se aceitas a correção **a** isolada como suficiente para fechar
  SEC-P5-03 (é o que a tua própria nota "qualquer uma fecha" sugere), ou se exiges uma das
  alternativas que listei em ISSUES antes de fechares este achado.
- SEC-P5-04: só comentário, sem comando de verificação — confirma que o texto está no sítio certo
  e diz o que precisa de dizer para a Fase 6.

---

CONTEXT_FOR_NEXT_AGENT:

- Ficheiros tocados nesta correção: `app/api/auth/route.ts`, `app/api/auth/callback/route.ts`,
  `lib/auth/env.ts`, `next.config.mjs`, `public/admin/config.yml`. Nenhum outro ficheiro foi
  alterado.
- `app/api/auth/route.ts` e `app/api/auth/callback/route.ts` e `lib/auth/env.ts` e
  `public/admin/config.yml` ainda **não estão commitados** (`git status` mostra-os como `??`,
  herdado da Fase 5 original, handoff-38) — só `next.config.mjs` já era um ficheiro tracked e por
  isso aparece como `M`. Não fiz nenhum commit; fica ao critério do Orchestrator/utilizador.
- Ambiente de teste usado: `npm run build` seguido de `next start -p <porta>` com variáveis
  fictícias (`GITHUB_OAUTH_CLIENT_ID=fake_id`, `GITHUB_OAUTH_CLIENT_SECRET=fake_secret_ABC`,
  `SESSION_SECRET` com 48 caracteres, `OAUTH_ALLOWED_ORIGIN` variado entre
  `http://localhost:<porta>` e `https://example.com` conforme o teste). Nenhum ficheiro do projeto
  foi tocado para isto; os processos de servidor de teste foram todos terminados no final
  (`taskkill`), nada ficou a correr em background.
- O achado novo relevante para quem for reavaliar SEC-P5-03: **a media library embutida do Decap
  (backend git, sem terceiros) não tem, nesta versão, nenhuma chave de configuração para
  restringir extensões de ficheiro** — isto não é uma omissão desta correção, é uma limitação real
  do produto, verificada contra o bundle e contra os tipos TypeScript do pacote. Vale a pena este
  facto ficar registado para a Fase 6 e para qualquer decisão futura sobre CI/hooks de validação de
  PR.
