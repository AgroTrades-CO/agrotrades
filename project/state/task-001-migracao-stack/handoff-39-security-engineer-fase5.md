# Handoff 39 — Security Engineer — Fase 5 (revisão CONTRA O CÓDIGO)

**Task:** 001-migracao-stack
**Agente:** security-engineer
**Âmbito:** implementação da Fase 5 entregue em `handoff-38-developer-fase5.md` — Decap CMS em
`/admin`, proxy OAuth GitHub (`/api/auth`, `/api/auth/callback`), CSP própria de `/admin`,
auto-hospedagem do bundle. **Não** cobre a Fase 6 (não existe código dela).
**Natureza:** revisão de **código**, com execução. Cumpre o que eu próprio exigi em
`handoff-03-security-engineer-preview.md`: "revalidação contra o código, com evidência reproduzível
— não com a afirmação de que foi feito".

---

STATUS: APPROVED — com **três correções obrigatórias antes de qualquer deploy num origin real**
(SEC-P5-01, SEC-P5-02, SEC-P5-03) e **uma pré-condição de configuração que não posso fechar por
código** (SEC-01/Preview, herdado, `high`).

Traduzido sem ambiguidade:
- **Nenhuma vulnerabilidade `high` ou `critical` foi introduzida por este código.** O que encontrei
  são três `medium`, um `low-medium` e quatro `low`. Por isso não bloqueio.
- **APPROVED aqui é aprovação do código, não autorização de deploy.** A Fase 5 só pode ir para um
  origin real depois de (i) SEC-P5-01 e SEC-P5-02 estarem corrigidos e reverificados, e (ii) o
  `devops-engineer` apresentar prova de que os segredos não existem no ambiente Preview.
- Aprovar a Fase 5 **não** aprova a Fase 6. Gate separado, como sempre esteve escrito.

---

SUMMARY:

A implementação é fiel ao desenho v5 e, no essencial, está bem feita. Os vetores que mais me
preocupavam nesta fase estão fechados **e verifiquei-os por execução, não por leitura**: o
`redirect_uri` não é influenciável pelo pedido (nem por query, nem por Origin/Referer/Host), o
`targetOrigin` do `postMessage` é literal e vem de variável de ambiente do servidor, o cookie de
`state` é apagado em **todas** as saídas do callback antes de qualquer validação, todos os modos de
falha devolvem exatamente o mesmo corpo pelo mesmo caminho de código, o scope é mesmo `public_repo`,
o bundle do Decap é auto-hospedado em versão exata sem CDN, e a CSP de `/admin` é uma entrada
própria que **não** relaxou nada na CSP global do resto do site (comparei diretiva a diretiva com a
da Fase 4).

O que o developer não viu, e que só aparece a testar:

1. A resposta de sucesso do callback **transporta o token OAuth do GitHub no corpo HTML e não tem
   `Cache-Control` nenhum**. Não é catastrófico — o token acaba em `localStorage` de qualquer forma,
   limitação já aceite — mas é uma credencial a viajar numa resposta que a Vercel, por omissão,
   marca como armazenável por caches partilhadas. É uma linha a corrigir.
2. O atributo **`Secure` dos dois cookies é decidido pelo protocolo do pedido**, que na prática vem
   do header `X-Forwarded-Proto`. Provei por execução que enviar esse header muda o `Secure` do
   cookie. Um atributo de segurança nunca deve depender de um valor que vem do pedido; deve vir da
   configuração (`OAUTH_ALLOWED_ORIGIN`), que o servidor já tem e já valida. Falha aberta, em
   silêncio.
3. Um achado **novo**, que a minha revisão de desenho não apanhou porque a media library ainda não
   estava concretizada: `media_folder: public/images/uploads` permite a um editor commitar um SVG
   com script inline, servido **da mesma origem** que `/admin`, sob a CSP global que tem
   `script-src 'self' 'unsafe-inline'`. O `localStorage` é isolado por origem, não por caminho —
   logo um editor pode roubar o token do Decap de outro editor. E esse token tem scope
   `public_repo`, que não é só o nosso repositório: é escrita em **todos os repositórios públicos da
   vítima**. É a mesma janela temporal do SEC-01: inofensivo com um utilizador, real a partir do
   segundo.

Sobre o `npm audit`, que o developer sinalizou explicitamente: a caracterização dele está **errada**
num ponto que importa, e o veredito final é, ainda assim, o mesmo. Ver SEC-P5-07.

---

ARTIFACTS:
- `project/state/task-001-migracao-stack/handoff-39-security-engineer-fase5.md` (este ficheiro)
- Nenhum ficheiro de código criado ou alterado. Revisão só de leitura e execução local.
- Ambiente de teste: `npm run build` mais `next start` em :3123 e :3124, com variáveis fictícias
  (`GITHUB_OAUTH_CLIENT_SECRET=secret_do_not_leak_ABC123`, `SESSION_SECRET` de 48 caracteres,
  `OAUTH_ALLOWED_ORIGIN=http://localhost:<porta>`). Para exercitar o **caminho de sucesso** sem
  credenciais reais do GitHub (que só existem na Fase 0), corri a segunda instância com um
  `--require` que intercepta apenas as duas chamadas de saída (`login/oauth/access_token` e
  `api.github.com/user`) e devolve um token-sentinela `gho_FAKETOKEN_SENTINEL_9999` e
  `{"id":424242}`. Nenhum ficheiro do projeto foi tocado para isto.

---

VALIDATIONS — os 12 pontos exigidos, um a um, com o comando e o resultado

### 1. redirect_uri de origem não-allowlisted — REJEITADO (na verdade, ignorado) — PASSA

```
curl -s -D - -o /dev/null ".../api/auth?provider=github&redirect_uri=https://evil.example/steal"
-> location: https://github.com/login/oauth/authorize?client_id=...
   &redirect_uri=http%3A%2F%2Flocalhost%3A3123%2Fapi%2Fauth%2Fcallback
   &scope=public_repo&state=934c...&allow_signup=false

curl -H "Origin: https://evil.example" -H "Referer: https://evil.example/" \
     -H "X-Forwarded-Host: evil.example" -H "Host: evil.example" ".../api/auth?provider=github"
-> redirect_uri=http%3A%2F%2Flocalhost%3A3123%2Fapi%2Fauth%2Fcallback   (identico)

.../api/auth?provider=evil -> 400          .../api/auth (sem provider) -> 400
```

O parâmetro do atacante não é normalizado, não é comparado, não é usado — **não tem qualquer
influência sobre o resultado**. Isto é mais forte do que a restrição 3 pedia. A allowlist degenerou
numa origem única de servidor (OAUTH_ALLOWED_ORIGIN), e concordo com a justificação do developer:
uma lista de um elemento, fixada fora do pedido, é a forma máxima de satisfazer "allowlist fixa",
não uma forma diminuída. Confirmei também que **não existe em lado nenhum** um
`endsWith(".vercel.app")`, um wildcard ou um `startsWith` sobre origem — o vetor que eu tinha
nomeado em SEC-06 não apareceu.

### 2. postMessage sem targetOrigin literal — não existe no nosso código — PASSA

```
grep -rn "postMessage" app lib components scripts public/admin/index.html public/admin/config.yml
lib/auth/popupMessage.ts:48:      window.opener.postMessage(FINAL_MESSAGE, TARGET_ORIGIN);
lib/auth/popupMessage.ts:61:    window.opener.postMessage("authorizing:github", TARGET_ORIGIN);
```

Duas ocorrências, ambas com TARGET_ORIGIN, injetado como literal JSON a partir de
`config.allowedOrigin` (variável de ambiente do servidor) — **nunca** de `location`, `referrer`,
`document.domain` ou query string. Confirmado no HTML efetivamente servido:
`var TARGET_ORIGIN = "http://localhost:3124";`. O recetor do eco valida
`event.origin !== TARGET_ORIGIN` antes de prosseguir — os dois lados, como o desenho exigia.

Verifiquei também o **outro lado do handshake**, dentro do bundle do Decap:
`if(r.data==="authorizing:"+e.provider && r.origin===this.base_url)` e, no `authorizeCallback`,
`if(r.origin===this.base_url)`. O Decap valida a origem em ambas as mensagens. O canal está fechado
nos dois sentidos.

Consequência prática que vale a pena escrever: se um site malicioso abrir o nosso `/api/auth` num
popup, o `postMessage` final é dirigido à nossa origem e o browser **não o entrega** ao opener
hostil. O token não sai.

Nota: o bundle de terceiros contém **uma** ocorrência de `postMessage(JSON.stringify(e),"*")`, num
widget de partilha social (`socialBase` / `__createIframe`) que não faz parte do fluxo de
autenticação nem manipula o token, e que o nosso fluxo nunca alcança. Não é o nosso código. Registo
por transparência, não como achado.

### 3. state reutilizado — REJEITADO — PASSA (com um residual assumido, SEC-P5-05)

```
1a utilizacao (cookie jar):        HTTP/1.1 400 + set-cookie: agrotrades_oauth_state=; Max-Age=0
   cookie jar depois:              0 entradas
2a utilizacao (mesmo jar):         HTTP/1.1 400
replay com Cookie: forcado a mao:  HTTP/1.1 400
state errado / sem cookie / vazio: 400 / 400 / 400
corpos de todas as falhas:         IDENTICOS (cmp -s)
```

O cookie é apagado em **todas** as saídas, incluindo as de erro, e antes de qualquer decisão —
exatamente a restrição 31. Todos os modos de falha (state, code, troca de token, GET /user) produzem
o mesmo corpo pelo mesmo caminho de código: **não há oráculo**.

### 4. Chamada direta a rotas privilegiadas sem sessão — não existem rotas privilegiadas — N/A, confirmado

```
/admin/users -> 404      /api/admin/collaborators -> 404      /api/admin -> 404
grep "export async function (POST|PUT|PATCH|DELETE)" app  -> nenhum
grep "use server" app lib components                      -> nenhum
grep "verifySessionToken" app lib                         -> so a definicao; nenhum consumidor
```

Confirmo a afirmação do developer **por verificação, não por confiança**: existem exatamente duas
rotas, ambas GET, e nenhuma consome o cookie de sessão. "Possuir sessão válida confere zero
autoridade" é, nesta fase, literalmente verdade — não há código que a leia.

### 5. Mutação sem header Origin — não há mutações — N/A, com uma correção ao raciocínio do developer

Não existe nenhuma rota de mutação, logo a restrição 33 não tem onde se aplicar. **Mas** o developer
escreveu que "o dance OAuth é navegação GET, validar Origin aqui não teria efeito", e isso está
incompleto: `/api/auth/callback` **é** uma rota que altera estado (emite o cookie de sessão), e o
ataque correspondente é *login CSRF*. Está fechado — mas pelo `state`, não pelo `Origin`: o atacante
teria de conhecer o valor de um cookie httpOnly para o pôr na query string. Verificado
empiricamente no ponto 3 (sem cookie -> 400). A conclusão do developer está certa; a razão que ele
deu não era a razão certa, e isso importa para quem implementar a Fase 6.

### 6. Bundle do cliente sem segredos embutidos — PASSA

```
curl /admin, /admin/config.yml, /admin/vendor/decap-cms/decap-cms.js | grep -c <sentinelas> -> 0,0,0
grep -rl <sentinelas> .next/static .next/server public                                      -> nenhum
```

Nenhuma das três sentinelas (client secret, session secret, client id) aparece em nada servido ao
browser nem no output de build. `public/admin/` contém apenas index.html, config.yml e vendor/
(gitignored, regenerado a partir da versão fixada no lockfile).

### 7. Segredos nunca em NEXT_PUBLIC_, nunca em config.yml, nunca commitados — PASSA

```
grep -rn "NEXT_PUBLIC" (fonte) -> uma unica ocorrencia, num comentario a proibi-lo (lib/auth/env.ts:8)
grep -rn "process.env" (fonte) -> so lib/auth/env.ts (4 variaveis) e next.config.mjs (NODE_ENV)
git ls-files | grep "[.]env"   -> nenhum ficheiro .env versionado
.gitignore                     -> .env, .env*.local, .env.development/production/test, *.pem
public/admin/config.yml        -> nenhum segredo; comentario no topo a proibi-lo
```

`.env.example` está commitado só com nomes e explicações, sem valores — correto. O histórico tem um
único commit e não contém segredos. **Não há nada a rotacionar.**

### 8. Cookie de state — PASSA em tudo menos Secure (ver SEC-P5-02)

```
set-cookie: agrotrades_oauth_state=<64 hex>; Path=/api/auth/callback; Max-Age=600; HttpOnly; SameSite=lax
```

httpOnly OK. SameSite=Lax OK — e é o ponto do SEC-04: Strict não sobreviveria à navegação de topo
vinda de github.com, e está corretamente diferenciado do cookie de sessão. Path restrito ao callback
OK. TTL 600 s OK. Apagado no callback **antes** de validar, mesmo quando a validação falha, OK
(verificado). CSPRNG: dois `randomUUID()` concatenados, 256 bits, OK. Comparação em tempo constante
com `timingSafeEqual`, incluindo ramo dummy quando os comprimentos diferem, OK.
Secure — ver SEC-P5-02.

### 9. Cookie de sessão — PASSA em tudo menos Secure (ver SEC-P5-02)

```
set-cookie: agrotrades_session=eyJpZCI6NDI0MjQyLCJleHAiOjE3ODc3NTU3MzJ9.gJxJVkTDfp2u...;
            Path=/admin; Max-Age=3600; HttpOnly; SameSite=strict

payload descodificado:          {"id":424242,"exp":1787755732}
assinatura HMAC-SHA256 confere: true
TTL:                            3600 s exatos, absoluto (calculado uma vez na emissao)
contem token do GitHub?         false
```

httpOnly OK. SameSite=Strict OK, e distinto do cookie de state (Lax) — a AMB-02 está resolvida em
código, não só em prosa. TTL absoluto de 60 minutos, sem renovação deslizante, OK. Payload mínimo
`{id, exp}`, sem token, sem username, sem email, OK. Algoritmo fixado em `lib/auth/session.ts` e
nunca lido do token — não existe campo `alg` e o formato não o permite, portanto a família
`alg:none` é inalcançável por construção. Assinatura verificada em tempo constante **antes** de
descodificar o payload (ordem correta). SESSION_SECRET dedicado, com mínimo de 32 caracteres imposto
no arranque.
Secure — ver SEC-P5-02. Path=/admin — ver SEC-P5-04.

### 10. CSP de /admin isolada, sem relaxar a global — PASSA

```
/admin, /admin/config.yml, /admin/vendor/... :
  default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://avatars.githubusercontent.com; font-src 'self' data:;
  connect-src 'self' https://api.github.com https://github.com https://objects.githubusercontent.com;
  frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
  upgrade-insecure-requests

/ , /servicos , /api/auth  (CSP global, INALTERADA face a Fase 4):
  default-src 'self'; script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';
  frame-src 'self' https://www.youtube-nocookie.com https://www.google.com; object-src 'none';
  base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

Comparei com o valor documentado na Fase 4 (handoff-14, handoff-23, handoff-24) e com o alargamento
de `frame-src` aprovado na Fase 3 (handoff-34, handoff-37): **a CSP global é a mesma que já estava
aprovada, sem uma diretiva a mais**. Nem `unsafe-eval`, nem api.github.com, nem
avatars.githubusercontent.com, nem `blob:` fugiram para fora de /admin. Nenhum CDN de terceiros em
`script-src` em nenhuma das duas políticas. Confirmei ainda que a entrada `/admin/:path*` faz match
em `/admin` sem barra final — o header devolvido nessa rota é o de /admin, não o global; o risco de
a página principal do CMS ficar com a política errada não se materializou.

Isto era o SEC-05 na parte que mais me interessava: a chegada do Decap **não** foi resolvida a
enfraquecer a política global.

### 11. npm audit — veredito: aceitável, não bloqueia; mas a caracterização do developer está errada

```
npm audit: {"high":34,"critical":0,"moderate":0,"low":0}
34 pacotes -> exatamente 2 advisories-raiz:
  immutable <4.3.9   GHSA-v56q-mh7h-f735  (List 32-bit trie overflow -> DoS)
                     GHSA-xvcm-6775-5m9r  (hash-collision algorithmic complexity DoS em Map/Set)
                     instalado: 3.8.4     fixAvailable: FALSE
  trim <0.0.3        GHSA-w5p7-h5w8-2hfq  (ReDoS), via remark-parse -> widgets markdown/richtext
                     fixAvailable: true, mas so por dentro do decap-cms
```

**Correção factual.** O developer escreveu que são "ferramentas de build antigas do próprio Decap,
não código que corre no nosso servidor", e que "o único artefacto que serve aos utilizadores é o
bundle pré-compilado". A segunda metade é verdade; a primeira não é:

```
grep -o "@@__IMMUTABLE_[A-Z]*__@@" public/admin/vendor/decap-cms/decap-cms.js | sort -u
-> @@__IMMUTABLE_LIST__@@, @@__IMMUTABLE_MAP__@@, @@__IMMUTABLE_SET__@@, ... (9 sentinelas)
```

O `immutable@3.8.4` e a cadeia `remark-parse`/`trim` **estão dentro do bundle que servimos ao
browser**. Não são dependências de build; são runtime do cliente. Isto não muda o veredito, mas muda
a razão — e uma mitigação assente numa razão errada é frágil.

**Veredito: aceitável, não bloqueia.** Porquê:
- Ambos os advisories-raiz são **negação de serviço** (CWE-400/407/190). Não é execução de código,
  não é divulgação de informação, não é escalonamento. Nenhum toca no token nem na autenticação.
- A superfície é o **browser do próprio editor**, com input que é o **conteúdo que ele próprio está
  a editar**. Não há multi-tenancy nem atacante remoto a alimentar as estruturas de dados. O pior
  resultado realista é o separador do editor bloquear.
- `fixAvailable: false` no immutable: o Decap 3.x nunca migrou para o Immutable 4. Não existe
  correção que não passe por abandonar o Decap ou manter um fork. Aceitar é a única opção real, e
  para este impacto é a opção certa.
- O `high` do npm audit é a severidade **abstrata** do advisory, não a **contextual**. Neste
  contexto é `low`. Classifico-o como `low` e não deixo o número 34 decidir por mim.

A preocupação genuína de cadeia de fornecimento nesta página — 30 MB de JavaScript de terceiros na
única página que detém o token — está mitigada como eu exigi em SEC-05: versão exata sem ^ nem ~,
package-lock.json commitado, auto-hospedado, zero CDN. Ver SEC-P5-08 para o último milímetro.

### 12. Scope public_repo, não repo — PASSA

`app/api/auth/route.ts:56` fixa `scope=public_repo` no código, com o comentário da restrição 6.
Confirmado no Location real devolvido pelo servidor: `...&scope=public_repo&...`. O parâmetro
`scope` que o Decap envia no pedido é **ignorado** — não há nenhuma leitura de
`searchParams.get("scope")` no projeto. Bónus não pedido e bem-vindo: `allow_signup=false`, que
impede o registo de contas GitHub novas a partir do nosso ecrã de login.

---

ISSUES

| Ref | Severidade | Título | Bloqueia |
|---|---|---|---|
| SEC-P5-01 | **medium** | Resposta com o token OAuth no corpo, sem `Cache-Control: no-store` | Deploy |
| SEC-P5-02 | **medium** | Atributo `Secure` derivado do protocolo do pedido (X-Forwarded-Proto) — falha aberta | Deploy |
| SEC-P5-03 | **medium** | SVG na media library, XSS armazenado na mesma origem, roubo do token do Decap de outro editor | 2.º editor |
| SEC-P5-04 | low-medium | `Path=/admin` no cookie de sessão não cobre `/api/admin/*` da Fase 6 | Não |
| SEC-P5-05 | low | Uso único do `state` garantido apenas por apagar o cookie (sem estado no servidor) | Não |
| SEC-P5-06 | low | Sem limite de taxa; anónimo força pedidos de saída para o GitHub | Não |
| SEC-P5-07 | low | npm audit: 34 `high` que colapsam em 2 advisories de DoS no cliente, sem correção | Não |
| SEC-P5-08 | low | Bundle copiado sem verificação de hash própria; integridade depende de `npm ci` | Não |
| SEC-01 (herdado) | **high** | Segredos privilegiados ausentes do ambiente Preview — **sem evidência** | Deploy |

#### SEC-P5-01 — medium — Token do GitHub numa resposta sem Cache-Control

`GET /api/auth/callback`, no caminho de sucesso, devolve HTML que contém o access token do GitHub em
texto claro dentro de um script inline. Cabeçalhos observados: **nenhum Cache-Control**.

A Vercel, para respostas de função sem Cache-Control, aplica por omissão
`public, max-age=0, must-revalidate`. A palavra `public` autoriza explicitamente caches
**partilhadas** a armazenar o corpo. Na prática a CDN da Vercel não guarda respostas com Set-Cookie,
e o token acaba em `localStorage` de qualquer maneira (limitação do Decap, aceite em 9.4) — é por
isso que classifico medium e não high. Mas é uma credencial de longa duração (tokens de OAuth App do
GitHub não expiram por omissão) a viajar num corpo que um proxy intermédio, ou a cache de disco do
browser, pode guardar. Não há razão nenhuma para o permitir.

**Correção:** `Cache-Control: no-store` nas **duas** rotas — no callback porque transporta o token,
em `/api/auth` porque emite o cookie de state.

#### SEC-P5-02 — medium — Secure decidido pelo pedido, não pela configuração

`app/api/auth/route.ts:67` e `app/api/auth/callback/route.ts:59,150`:

```ts
secure: request.nextUrl.protocol === "https:",
```

Provado por execução:

```
sem header                    -> set-cookie: ...; HttpOnly; SameSite=lax           (SEM Secure)
com X-Forwarded-Proto: https  -> set-cookie: ...; Secure; HttpOnly; SameSite=lax
```

O atributo Secure dos **dois** cookies — incluindo o de sessão — é controlado por um valor que chega
no pedido. Não é diretamente explorável contra a vítima (um browser não deixa um atacante definir
X-Forwarded-Proto numa navegação de topo), e por isso não é high. O risco real é o inverso: **falha
aberta e em silêncio** se algum dia o proxy à frente não puser o header, ou se a aplicação for
servida atrás de outra coisa que não a Vercel. Um atributo de segurança não deve depender de um
input; deve depender da configuração, que o servidor já tem, já validou e já usa para tudo o resto.

Agrava-o, ligeiramente, `lib/auth/env.ts:34`: `isValidOrigin()` aceita http. Um
OAUTH_ALLOWED_ORIGIN em http numa configuração de produção passa a validação sem um ruído.

**Correção:** derivar de `config.allowedOrigin.startsWith("https:")` nos três pontos onde se define
um cookie; e em `isValidOrigin()` aceitar http **apenas** para localhost e 127.0.0.1. A conveniência
de desenvolvimento mantém-se; a possibilidade de produção em claro desaparece.

#### SEC-P5-03 — medium — ACHADO NOVO — SVG na media library rouba o token do Decap de outro editor

Não estava na minha revisão de desenho. Aparece agora porque a media library ganhou concretização
nesta fase. `public/admin/config.yml:32`: `media_folder: public/images/uploads`, sem qualquer
restrição de extensão ou de tipo — só `max_file_size: 5000000`. O widget `image` do Decap aceita SVG.

Cadeia:

1. O editor A carrega um ficheiro `logo.svg` com um elemento `script` inline lá dentro. Vai para
   `public/images/uploads/` no repositório, é publicado, e é servido de
   `https://agrotrades.co.mz/images/uploads/logo.svg`.
2. Esse caminho **não** tem entrada própria em `next.config.mjs` — herda a CSP global, que tem
   `script-src 'self' 'unsafe-inline'`. Um SVG aberto como documento de topo executa o script.
3. O `localStorage` é isolado por **origem**, não por caminho. O SVG está na mesma origem que
   `/admin`. Lê o token OAuth que o Decap lá guarda.
4. `connect-src 'self'` e `img-src 'self' data:` bloqueiam a exfiltração por fetch e por imagem, mas
   a CSP não restringe a navegação de topo (a diretiva `navigate-to` não é suportada): atribuir o
   token a `location` e sair para um host do atacante funciona.
5. O editor B tem de abrir o SVG como documento de topo — dentro de um `img` de pré-visualização o
   script **não** corre. Exige um empurrão social, o que reduz a probabilidade, não o impacto.

**Porque é que isto é uma escalação real e não circular:** o editor A já tem escrita no nosso
repositório, portanto roubar escrita no nosso repositório não lhe daria nada. Mas o token que ele
rouba tem scope `public_repo`, que **não está limitado a este repositório**: dá escrita em todos os
repositórios públicos da vítima e nos seus gists. O editor A sai da nossa fronteira e entra na conta
pessoal do editor B. É exatamente o género de coisa que escolher `public_repo` em vez de `repo` veio
limitar, e que aqui reaparece por outro caminho.

**Âmbito temporal:** idêntico ao SEC-01 — inofensivo com um único utilizador, real no instante em
que existir um segundo editor. Correção obrigatória **antes do primeiro convite** (Fase 6), não
necessariamente antes deste deploy — mas o custo de a fazer já é quase nulo.

**Correções (qualquer uma fecha; recomendo as duas primeiras, cumulativas):**

1. Entrada própria em `next.config.mjs` para `/images/uploads/:path*` com
   `Content-Security-Policy: sandbox; default-src 'none'` e `X-Content-Type-Options: nosniff`.
   O `sandbox` sem `allow-scripts` neutraliza o SVG mantendo-o utilizável dentro de um `img`.
2. Restringir as extensões aceites pela media library a raster (jpg, jpeg, png, webp) — nunca svg,
   nunca html.
3. Servir media de uma origem distinta. Correto, e desproporcionado para este site.

#### SEC-P5-04 — low-medium — Path=/admin no cookie de sessão vs. /api/admin/* da Fase 6

`Path=/admin` **não** cobre `/api/admin/...`. O cookie de sessão nunca chegará às rotas privilegiadas
que a arquitetura 7A.5 prevê. Hoje é inofensivo — nada o lê. O que me preocupa é o desfecho
previsível: na Fase 6 o cookie "não chega", e a saída rápida é alargar o Path para a raiz. Escrevo-o
agora para que a decisão seja deliberada: alargar para a raiz, usar um Path próprio, ou mover as
rotas para debaixo de `/admin/api/`. Qualquer uma serve; a que não serve é resolver isto à pressa no
meio de um problema de routing.

#### SEC-P5-05 — low — O uso único do state é garantido do lado do cliente

Não há estado no servidor (consequência assumida de serverless sem KV — decisão 8.2), logo "uso
único" é implementado por apagar o cookie. Um cliente que guarde o valor pode reapresentá-lo dentro
dos 10 minutos: na minha experiência, o replay manual devolveu 400 apenas porque o `code` era falso
— a verificação do `state` em si **passou**. Impacto: nulo. Quem detém as duas metades é o próprio
dono da sessão, e o valor é httpOnly e inalcançável para terceiros. Registo como residual aceite e
explícito, para não ser descoberto como "novo" mais tarde.

#### SEC-P5-06 — low — Sem limite de taxa; a saída para o GitHub é acionável por anónimos

`GET /api/auth` devolve um state; `GET /api/auth/callback` com esse state provoca **um pedido de
saída para github.com por invocação**. Um anónimo em ciclo consome quota de função da Vercel e rate
limit da nossa OAuth App. É o SEC-09 a materializar-se. Não é material para este tráfego; passa a
ser quando a Fase 6 acrescentar rotas que geram tokens de instalação. Recomendo tratá-lo lá.

#### SEC-P5-07 — low — Ver o ponto 11 das VALIDATIONS. Aceite, sem correção disponível, sem bloqueio.

#### SEC-P5-08 — low — A integridade do bundle depende de npm ci

`scripts/copy-decap-cms.mjs` copia de `node_modules` sem verificar nada. A garantia real de
integridade é o campo `integrity` do package-lock.json, que só é imposto por `npm ci` (ou por
`npm install` com o lockfile intacto). **Confirmar com o devops-engineer que o build da Vercel usa
`npm ci`.** Como defesa em profundidade barata, o script pode registar o SHA-256 do `decap-cms.js`
copiado e falhar se divergir de um valor fixado — torna visível uma substituição de bundle que hoje
passaria calada.

#### SEC-01 (herdado, high) — Segredos no ambiente Preview: SEM EVIDÊNCIA

Não posso fechá-lo e não o fecho. Nenhuma inspeção de código o consegue provar — é estado do painel
da Vercel. A parte que é da Fase 5 (GITHUB_OAUTH_CLIENT_SECRET e SESSION_SECRET **apenas** em
Production; Preview com OAuth App e repositório-sandbox separados) continua **por demonstrar**.
Enquanto não houver essa prova, um editor com push obtém os dois segredos publicando um route
handler trivial num branch. O código está correto; a defesa é configuração, e a configuração não me
foi apresentada.

Acrescento um problema prático que o developer levantou e que agrava isto: `public/admin/config.yml`
é estático, com `base_url` fixo em produção. Um ambiente de preview exige editar o ficheiro **e** a
variável de ambiente, e mantê-los sincronizados byte a byte. Um controlo que depende de dois valores
sincronizados à mão em sítios diferentes é um controlo que se vai dessincronizar. Se a Fase 0
concluir que precisa mesmo de um preview funcional do `/admin`, a resposta certa é gerar o
`config.yml` a partir de uma rota de servidor que leia OAUTH_ALLOWED_ORIGIN — uma fonte de verdade
em vez de duas. Decisão do Architect e do DevOps, não minha.

---

BLOCKERS:

- **Nenhum que impeça o avanço para o `tester` e para o `code-reviewer`.** O código pode e deve
  seguir.
- **Dois, para o deploy da Fase 5 num origin real:** SEC-P5-01 e SEC-P5-02 corrigidos e
  reverificados (são poucas linhas), e a prova de configuração do SEC-01 apresentada pelo
  `devops-engineer`.
- **Um, para a Fase 6 e para o primeiro editor adicional:** SEC-P5-03 fechado, a somar às
  pré-condições que já existiam (proteção de `main`, segredos apenas em Production).

---

REQUIRES_HUMAN_NOTIFICATION: **true**

Obrigatório, e por três razões independentes, qualquer uma delas suficiente:

1. **O SEC-01 continua `high` e continua em aberto** na parte da configuração. Não é um achado
   fechado; é um achado que ninguém me provou que está fechado.
2. Os achados `high` da revisão de desenho (SEC-01, SEC-02) exigem notificação **mesmo já
   corrigidos** — a regra do `CLAUDE.md` não me dá margem, e eu não tenho autoridade para decidir
   que "já está tratado, não vale a pena incomodar". O SEC-02 está, de facto, bem implementado; isso
   não me dispensa de o mostrar.
3. O `npm audit` reporta 34 `high`. Eu avalio-os contextualmente como `low` e explico porquê — mas
   aceitar software de terceiros com advisories `high` abertos e **sem correção disponível** na
   página que detém o token não é uma decisão que me pertença sozinho.

O que o Orchestrator deve levar ao utilizador, em concreto:

- a Fase 5, em código, está bem feita e passou os 12 testes que eu próprio tinha exigido;
- há três correções pequenas a fazer antes de a pôr num endereço real;
- há uma coisa por confirmar que não é técnica: **a prova de que os segredos não existem no ambiente
  Preview da Vercel**;
- os 34 `high` do `npm audit` são reais, são de negação de serviço no browser do editor, não têm
  correção possível sem abandonar o Decap, e a minha recomendação é aceitá-los conscientemente.

---

REQUIRED_NEXT_ACTION:

**Para o `developer` (correções desta fase, por ordem de custo):**

1. **SEC-P5-01** — `Cache-Control: no-store` nas respostas de `/api/auth` e `/api/auth/callback`.
2. **SEC-P5-02** — `secure:` derivado de `config.allowedOrigin.startsWith("https:")` nos três pontos
   onde se define um cookie; `isValidOrigin()` a rejeitar http exceto para localhost e 127.0.0.1.
3. **SEC-P5-03** — entrada em `next.config.mjs` para `/images/uploads/:path*` com
   `Content-Security-Policy: sandbox; default-src 'none'`, e restrição das extensões aceites na
   media library. Obrigatório antes do primeiro editor adicional; recomendo fazê-lo já, com o resto.
4. **SEC-P5-04** — decidir e documentar como o cookie de sessão vai chegar às rotas da Fase 6. Uma
   linha de comentário chega; o que não pode é ser descoberto no meio da Fase 6.

Reverificação: os comandos estão todos escritos na secção VALIDATIONS e são reproduzíveis com
`npm run build`, `next start` e `curl`. Volto a corrê-los. Não aceito "corrigido" como evidência.

**Para o `tester` (a seguir):** o comportamento funcional que eu não cobri — o editor Decap a
carregar de facto, as coleções, e sobretudo os três ficheiros-array (`stats`, `team`, `locations`)
que o developer sinalizou como não validados. Nada disso é segurança, e nada disso está feito.
Lembrete que já dei e mantenho: **estes controlos são invisíveis num teste funcional**. O login
funciona igualmente bem com o `state` reutilizável e com `targetOrigin` a `*`. Não repitas os meus
testes negativos a pensar que são os teus.

**Para o `code-reviewer` (depois do tester):** três coisas que passam despercebidas numa revisão
normal — (i) o `targetOrigin` é literal hoje, confirma que continua literal depois das correções;
(ii) não há nenhuma variável de módulo a guardar credenciais nesta fase (verifiquei), e tem de se
manter assim; (iii) o comentário do `next.config.mjs` sobre "a última entrada vence" está correto e
foi verificado por execução — a CSP de `/admin` **substitui** a global, não se combina com ela. Se
alguém "simplificar" essa entrada para conter só as diretivas adicionais, parte tudo em silêncio.

**Para o `devops-engineer`:** a prova do SEC-01 é tua e é pré-condição de deploy. Além disso:
confirmar que o build da Vercel usa `npm ci` (SEC-P5-08), e decidir sobre o `config.yml` estático
com `base_url` fixo — duas fontes de verdade para a mesma origem.

**Para mim (`security-engineer`), depois:** revalidação das três correções, e a revisão da Fase 6,
que é um gate separado e onde SEC-01, SEC-03 e SEC-07 voltam a ser avaliados contra código.

---

CONTEXT_FOR_NEXT_AGENT:

- **Gate 4 (security) para a Fase 5: dado, condicionado.** Não é gate para a Fase 6 nem autorização
  de deploy. Aprovar a Fase 5 não aprova a Fase 6 — está escrito desde a v4 da arquitetura e
  mantém-se.
- **O que já não precisa de ser reverificado por ninguém** (fiz por execução, com o comando
  documentado acima): `redirect_uri` não influenciável pelo pedido; `targetOrigin` literal nos dois
  sentidos do handshake; `state` de uso único, apagado antes de validar; resposta única e sem
  oráculo em todos os modos de falha; scope `public_repo`; ausência de segredos no bundle e no
  output de build; CSP global intacta e CSP de `/admin` isolada; payload do cookie de sessão sem
  token e com TTL absoluto de 60 minutos.
- **O que continua por provar e não é código:** segredos ausentes do ambiente Preview da Vercel.
- **Ficheiros que importam para quem vier a seguir:** `lib/auth/env.ts` (fonte única da origem e dos
  segredos), `lib/auth/popupMessage.ts` (o único sítio do projeto onde o servidor gera JavaScript
  para o browser), `next.config.mjs` (as duas entradas de CSP, cuja ordem é significativa),
  `public/admin/config.yml` (`media_folder`, e o `base_url` que tem de coincidir byte a byte com
  OAUTH_ALLOWED_ORIGIN).
