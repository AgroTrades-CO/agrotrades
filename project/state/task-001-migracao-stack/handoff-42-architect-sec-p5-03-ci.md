# Handoff 42 — Software Architect — Decisão sobre SEC-P5-03 / SEC-P5-09 (controlo de CI para a media library)

**Task:** 001-migracao-stack
**Agente:** software-architect
**Âmbito:** decidir entre a Opção A (GitHub Action + required check) e a Opção B (route handler
próprio para a media) pedidas em `handoff-41-security-engineer-fase5-revalidacao.md`, secção
SEC-P5-09, e desenhar a solução escolhida. **Não implemento código** — o desenho segue para o
`devops-engineer`.

---

STATUS: COMPLETED

SUMMARY: **Adotada a Opção A, com âmbito alargado.** A media library continua em
`public/images/uploads/` servida estaticamente; o controlo que fecha o SEC-P5-03 passa a ser um
**GitHub Action registado como required check** na proteção de `main`, que recusa qualquer ficheiro
não-raster (por extensão **e** por assinatura de bytes) e acima de 5 MB sob `public/images/uploads/`.
A entrada de CSP `/images/uploads/:path*` em `next.config.mjs` **mantém-se** como defesa em
profundidade. A Opção B foi rejeitada: custa mais, acrescenta código de runtime na rota de leitura
de todas as imagens, obrigar-nos-ia a reimplementar um servidor de ficheiros estáticos (incluindo a
normalização de caminhos, que é exatamente a classe de bug que originou o SEC-P5-09, só que do nosso
lado), e **não dispensava na mesma o controlo de CI**.

A decisão traz uma parte que o security-engineer não pediu e que considero não-negociável: **um
required check, sozinho, não é um controlo contra um editor com escrita.** Em `pull_request`, o
GitHub executa a definição do workflow tal como ela está no PR — um editor malicioso abre um único
PR que adiciona o SVG **e** altera `.github/workflows/…` para o check passar sempre, mantendo o mesmo
nome de check. Passa a proteção de branch sem a violar. Por isso o desenho tem duas peças
obrigatórias e inseparáveis: o Action **e** um CODEOWNERS que ponha `/.github/**` (e todo o código)
fora da superfície que um editor pode auto-fundir. Implementar só a primeira é reproduzir o erro do
SEC-P5-09 noutro sítio: um controlo que parece uma camada e é zero.

---

ARTIFACTS:
- `project/state/task-001-migracao-stack/handoff-42-architect-sec-p5-03-ci.md` (este ficheiro — é
  também o registo da decisão; a secção 3 é o ADR e deve ser referenciada pelo cabeçalho do ficheiro
  de workflow quando ele existir)
- **Nenhum ficheiro de código criado ou alterado.** Não há `api-spec` — a decisão foi precisamente
  não introduzir rota nova.

---

## 1. O que está em causa, reformulado

O ativo é o token OAuth (`public_repo`) de **outro** editor, guardado em `localStorage` na origem que
serve `/admin`. A cadeia é: editor A publica um ficheiro com script ativo na mesma origem → editor B
abre-o como documento de topo → o script lê o `localStorage` da origem e exfiltra por navegação.

Duas observações que orientam tudo o resto:

1. **O adversário é um editor autenticado com escrita no repositório.** Qualquer controlo que ele
   execute no browser dele (o `accept` do `<input>`, validação no cliente do Decap) é decoração — o
   security-engineer já concluiu isto e concordo. O único sítio onde um controlo o vincula é entre o
   commit dele e o `main`: ou seja, **na política de merge**.
2. **Nenhum controlo que dependa de matching de caminho é fiável aqui.** É a lição do SEC-P5-09, e
   aplica-se à CSP tanto quanto se aplicaria a qualquer regra futura de `headers()`. A semântica de
   normalização é da plataforma, não nossa, e muda sem nos avisar.

De (1) e (2) sai que a defesa tem de atuar sobre a **existência** do ficheiro no `main`, e não sobre
a forma como ele é servido. É por aqui que a Opção A ganha à B, e não por ser mais barata.

---

## 2. Alternativas consideradas

### Opção A — GitHub Action + required check — **ADOTADA**

- Atua no ponto certo da cadeia (merge para `main`), que é o único ponto que o editor não controla.
- Custo de runtime: zero. Custo de deploy: zero. Não toca em código de aplicação, não altera a
  arquitetura de servir conteúdo, não introduz superfície nova exposta à internet.
- Encaixa no que já está decidido: `publish_mode: editorial_workflow` (tudo passa por PR) e a
  restrição vinculativa 28 (proteção de `main` antes do primeiro editor adicional). Não é âmbito
  novo — é a materialização da 28.
- Deteta a classe de ficheiro que um revisor humano **não** consegue avaliar de relance: um SVG
  hostil aparece no diff do GitHub como uma imagem inócua. É exatamente para isto que serve um check
  determinístico ao lado de uma revisão humana.
- Limitação, assumida: só cobre o que fizermos entrar no âmbito do check. Ver secção 3.2.

### Opção B — route handler próprio para a media — **REJEITADA**

Rejeitada por cinco razões, qualquer uma delas suficiente para não ser a escolha primária:

1. **Não substitui a Opção A.** Fecha a entrega de `/images/uploads/*` com os cabeçalhos certos, mas
   o ficheiro continua a existir no repositório e continua a poder ser colocado noutro caminho
   servido pela mesma origem (`public/images/banners/`, por exemplo). Ficaríamos com o custo da B
   **e** com a necessidade da A na mesma. Isto por si só decide a questão.
2. **Obriga-nos a escrever um servidor de ficheiros estáticos.** Resolução de caminho, rejeição de
   `..`, decisão de `Content-Type`, `Range`, `ETag`, `Cache-Control`. O SEC-P5-09 é um bug de
   normalização de caminho numa implementação madura; a resposta não pode ser passar essa
   responsabilidade para uma implementação nossa escrita à pressa.
3. **Custo de runtime permanente e desalinhado com o resto do projeto.** Toda a imagem do site
   passaria a sair de uma função em vez do servidor estático/CDN. O `context.md` é explícito sobre
   manter a dependência da Vercel mínima e reversível (nem sequer usamos o otimizador de imagens);
   pôr as imagens atrás de código nosso vai no sentido contrário.
4. **Fragilidade de empacotamento.** Ficheiros fora de `public/` e não importados estaticamente não
   entram no bundle serverless sem `outputFileTracingIncludes` — uma configuração que falha em
   silêncio (imagem 404 em produção, tudo bem em local) e que teria de ser reverificada a cada
   upgrade do Next.js.
5. **Mexe no Decap.** `media_folder`/`public_folder` mudam, e com eles todos os caminhos já gravados
   no conteúdo existente. Uma migração de dados por uma correção que não é a correção.

### Opção C — middleware que normaliza/rejeita separadores codificados — **REJEITADA**

Um middleware que devolva 404 a qualquer pedido cujo URL bruto contenha `%2F`/`%5C` fecharia o
bypass concreto do SEC-P5-09. Rejeitada porque: o middleware está fora de âmbito por decisão de
arquitetura anterior (`architecture-proposal.md` D-1), passa a correr em **todos** os pedidos do
site, e — decisivo — a sua eficácia depende de o middleware ver o URL **antes** da decodificação da
plataforma. É a mesma premissa não verificada que fez cair a mitigação anterior. Não troco um
controlo dependente de normalização por outro.

### Opção D — servir a media de uma origem separada — **DIFERIDA, não rejeitada**

É a correção estrutural (é o que o GitHub faz com `githubusercontent.com`): noutra origem, um script
num SVG não alcança o `localStorage` de `/admin`, seja qual for o ficheiro. Não a adoto **agora**
porque implica um segundo projeto/domínio, DNS e certificado, antes de um cutover que ainda não
aconteceu, para um site institucional com um número de editores na ordem das unidades. Fica
registada com gatilho explícito: **se o número de editores crescer para além do círculo de confiança
direto do dono, ou se alguma vez for preciso aceitar upload de ficheiro arbitrário, reabrir a Opção
D.** Combina bem com a A; não a substitui.

---

## 3. Desenho da solução adotada

### 3.1 Peças (as três são obrigatórias; nenhuma sozinha é um controlo)

| # | Peça | Onde | Quem implementa |
|---|---|---|---|
| P1 | Workflow `media-guard` que valida os ficheiros alterados no PR | `.github/workflows/media-guard.yml` | `devops-engineer` |
| P2 | Registo de P1 como **required check** na proteção de `main` | configuração do GitHub | `devops-engineer` |
| P3 | `CODEOWNERS` + "require review from Code Owners" a cobrir `/.github/**` e todo o código | `.github/CODEOWNERS` + configuração | `devops-engineer` |
| P4 | Entrada de CSP `/images/uploads/:path*` | `next.config.mjs` (**já existe**) | — mantém-se, não remover |

### 3.2 Superfície e fronteira de confiança (a parte que decide o âmbito de P1 e P3)

Divido o repositório em duas superfícies:

- **Superfície auto-fundível pelo editor** (o Decap publica sem intervenção humana):
  `content/**` e `public/images/uploads/**`. É aqui que P1 tem de ser rigoroso, porque pode não haver
  olhos humanos.
- **Tudo o resto** (`app/**`, `lib/**`, `components/**`, `scripts/**`, `public/admin/**`,
  `public/images/**` fora de uploads, `next.config.mjs`, `package.json`, **e `.github/**`**): um
  editor com escrita pode abrir um PR que toque nestes caminhos, e aí o que o protege **não** é CI —
  é P3. Um editor que consiga fundir uma alteração a `app/` tem XSS trivial sem precisar de SVG
  nenhum; discutir extensões de ficheiro nesse cenário não faz sentido.

Consequência que quero explícita para quem implementar: **P1 sem P3 é contornável pelo próprio PR
que se quer bloquear** (o PR redefine o workflow, mantém o nome do check, e o check "passa"). P3 não
é hardening opcional; é o que torna P1 um controlo.

Isto é uma **precisão da restrição vinculativa 28**, não uma alteração: a 28 exige "PR com revisão de
terceiro". Aplicada literalmente a todos os PR, mataria a publicação autónoma do Decap (qualquer
alteração de texto ficaria à espera de aprovação). O desenho resolve-o assim: **revisão de code owner
obrigatória em tudo exceto `content/**` e `public/images/uploads/**`**; nessa superfície restante,
quem faz o papel de revisor é P1. Se o dono do projeto preferir revisão humana também aí (mais
seguro, menos autónomo), é decisão dele e o desenho suporta as duas — muda só o número de aprovações
exigidas.

### 3.3 Regra de validação de P1 (especificação, não código)

Para cada ficheiro **adicionado, modificado, renomeado ou copiado** no PR (diff contra o merge base,
`--diff-filter=ACMR`) cujo caminho comece por `public/images/uploads/`:

1. **Caminho:** tem de ser exatamente `public/images/uploads/<nome>` — sem subdiretórios (o Decap
   escreve plano no `media_folder`), sem `..`, sem nome começado por ponto.
2. **Nome:** allowlist por regex, não denylist —
   `^[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.(jpg|jpeg|png|webp|gif|avif)$`, comparação **case-insensitive**
   na extensão. Tudo o que não corresponder é recusado, incluindo ficheiros sem extensão, com
   extensão dupla terminada em não-raster (`x.png.svg`), com ponto ou espaço final. A denylist
   pedida pelo security-engineer (`.svg .svgz .htm .html .xhtml .xml`) usa-se **só para a mensagem de
   erro**, para o editor perceber o que fazer; a decisão é da allowlist.
3. **Conteúdo:** os primeiros bytes têm de bater certo com a extensão (`\x89PNG`, `\xFF\xD8\xFF`,
   `GIF87a`/`GIF89a`, `RIFF….WEBP`, `ftypavif` no offset 4). Sem dependências externas — meia dúzia
   de assinaturas em Node basta. Razão: o `Content-Type` que o servidor estático emite vem da
   extensão, e a única coisa que impede um `.png` cheio de SVG de ser reinterpretado é o
   `X-Content-Type-Options: nosniff` — que vem de uma entrada de `headers()`, ou seja, de matching de
   caminho. Depois do SEC-P5-09 não assento nada nisso.
4. **Tamanho:** ≤ 5 000 000 bytes, o mesmo valor de `media_library.max_file_size` do `config.yml`.
   Esse valor é cliente e portanto não é um controlo; aqui passa a ser. Protege o repositório de
   crescer sem limite, que é o outro modo de abuso desta pasta.

Falha em qualquer ponto → job falha, com mensagem que nomeia o ficheiro e diz o que fazer
("converta para PNG/JPG/WebP e volte a carregar"). O editor vê isto no Decap como falha de
publicação; a mensagem é a única coisa que ele vai ler.

### 3.4 Restrições de implementação de P1 (o `devops-engineer` não pode violar)

- **Evento `pull_request`. Nunca `pull_request_target`.** `pull_request_target` corre com o token e
  os segredos do repositório base em código vindo do PR — transformaria o guarda no melhor vetor de
  comprometimento do repositório.
- **`permissions: contents: read`** no workflow, e nada mais. O check não precisa de escrever.
- **Sem `paths:` no trigger e sem `if:` que salte o job.** Um required check que não reporta bloqueia
  o PR para sempre — incluindo os do dono. Ver secção 4 (abuso do mecanismo). O job corre sempre e,
  se o PR não tocar em uploads, termina em sucesso imediato.
- **O workflow não executa código vindo do PR.** Nada de `npm ci` seguido de correr um script do
  repositório: a lógica de validação vive **dentro do ficheiro de workflow** ou num script chamado
  por caminho fixo, e em qualquer dos casos a integridade dela é garantida por P3, não pelo workflow.
  Não instalar dependências do `package.json` do PR para este job.
- **O nome do job/check é um contrato.** É a string que P2 regista. Renomear o job depois disso
  equivale a desligar o controlo e a bloquear todos os merges ao mesmo tempo. Documentar o nome
  escolhido no próprio ficheiro.
- Ações de terceiros, se alguma for usada, **fixadas por SHA**, nunca por tag.

### 3.5 Configuração de P2/P3

- Proteção de `main`: sem push direto (ninguém, incluindo o dono, sem passar por PR — se for preciso
  bypass, que seja explícito e registado); PR obrigatório; required status check = o nome de P1;
  "Require branches to be up to date" ligado (senão o check pode ter corrido contra uma base antiga);
  lista de atores com bypass vazia, salvo o dono.
- `CODEOWNERS`: `/.github/**` e todo o código atribuídos ao dono, com "Require review from Code
  Owners" ligado. **A verificar empiricamente, não presumir:** o CODEOWNERS do GitHub não tem
  negação, e o comportamento de "última regra que faz match" para deixar `content/**` e
  `public/images/uploads/**` sem dono tem de ser confirmado num PR de teste real, não deduzido da
  documentação. Se não for possível exprimir a exceção, a alternativa é assumir revisão humana também
  nas PR de conteúdo (ver 3.2) — e nesse caso é decisão do dono, não do `devops-engineer`.
- Definições de Actions do repositório: `GITHUB_TOKEN` por omissão em read-only; "Allow GitHub
  Actions to create and approve pull requests" **desligado** (senão o próprio CI pode aprovar PRs, o
  que anula P3).

### 3.6 O que fica igual e não deve ser mexido

- `next.config.mjs`, entrada `/images/uploads/:path*` — **mantém-se**. Cobre o caminho canónico, custa
  zero, e o argumento para a manter é o mesmo que sempre foi: é a última linha se P1 falhar ou for
  desligado. Quando P1 existir, o comentário deve passar a nomear o ficheiro de workflow (o
  `handoff-42-developer-sec-p5-10.md` já deixou o comentário correto e a apontar para "um Action
  ainda por desenhar").
- `public/admin/config.yml` — `media_folder`, `public_folder` e `max_file_size` inalterados. **Um
  ponto a corrigir:** o comentário do SEC-P5-03 nesse ficheiro (linhas ~50-55) ainda afirma que "a
  defesa real e efetiva … está em next.config.mjs". Depois do SEC-P5-09 isso é falso, e é
  exatamente o tipo de comentário órfão que o SEC-P5-10 penalizou noutro ficheiro. Uma linha, para o
  `developer`, na mesma leva do resto.

---

VALIDATIONS:

- **Opção B rejeitada** — cinco razões na secção 2, sendo a primeira decisiva e independente das
  outras: não dispensava o controlo de CI, porque não impede o ficheiro de existir noutro caminho da
  mesma origem.
- **Opção C (middleware) rejeitada** — repetiria a premissa não verificada que causou o SEC-P5-09.
- **Opção D (origem separada) diferida com gatilho escrito**, não descartada.
- **Coerência com a stack e com o `context.md`:** nenhuma tecnologia fora da stack definida. GitHub
  Actions é gratuito e ilimitado em repositórios públicos (o repositório é público por decisão
  deliberada já registada), não acrescenta serviço externo novo nem dependência de runtime, e não
  aumenta o acoplamento à Vercel. Nenhuma exceção a reportar ao Orchestrator neste ponto.
- **Coerência com a arquitetura da Fase 5:** o site continua sem rotas de mutação próprias; o Decap
  continua a escrever diretamente pela API do GitHub; nada muda no modelo de conteúdo nem nos
  caminhos já gravados.
- **Verificado no repositório, não presumido:** não existe hoje `.github/` nem qualquer CI (P1 é o
  primeiro workflow do projeto); `public/admin/vendor/` está em `.gitignore` e é regenerado por
  `scripts/copy-decap-cms.mjs`, logo não entra no diff de nenhum PR; `public/images/` contém hoje 19
  SVG de placeholder e 9 rasters, todos **fora** de `uploads/` — ver ISSUES.

---

ISSUES:

1. **Abuso do próprio mecanismo — o required check como negação de serviço editorial.** Um required
   check mal configurado bloqueia **todos** os merges para `main`, permanentemente e em silêncio: com
   `paths:` no trigger, PRs que não tocam em uploads nunca reportam o check e ficam presos para
   sempre; renomear o job produz o mesmo efeito. O site tornar-se-ia não-editável e não-atualizável, e
   a reação natural sob pressão é desligar a proteção de `main` — perder-se-ia mais do que se ganhou.
   Endereçado em 3.4 (sem `paths:`, sem `if:`, job corre sempre, nome tratado como contrato) e é o
   primeiro item da verificação em 3.5.
2. **Abuso do próprio mecanismo — o PR que neutraliza o guarda.** Em `pull_request`, a definição do
   workflow vem do PR. Um editor com escrita altera o workflow e o SVG no mesmo PR, mantendo o nome
   do check. Endereçado por P3 (CODEOWNERS sobre `/.github/**`). **Se P3 não for implementado, P1 é
   teatro** — quero isto registado sem ambiguidade.
3. **Abuso do próprio mecanismo — `pull_request_target`.** É a forma "natural" de fazer o check ter
   mais permissões, e transformaria o guarda no vetor de execução de código do atacante com o token
   do repositório base. Proibido em 3.4.
4. **Âmbito residual: os 19 SVG em `public/images/` fora de `uploads/`.** São placeholders de
   desenvolvimento, servidos sob a CSP global permissiva. Não são cobertos por P1 (de propósito:
   pertencem à superfície de código) e o que os protege é P3. **Risco aceite, com duas notas:** (i)
   se P3 não ficar como descrito, este é o caminho por onde o SEC-P5-03 volta a abrir; (ii)
   recomendo substituí-los por raster quando houver fotografias reais — higiene, não bloqueio.
5. **Extensão não é conteúdo.** Um `.png` com bytes de SVG só é inofensivo enquanto o `nosniff`
   chegar ao pedido, e o `nosniff` vem de matching de caminho. Endereçado pela verificação de
   assinatura em 3.3(3), que é precisamente para não voltarmos a depender disso.
6. **CODEOWNERS sem negação.** A exceção de `content/**` e `public/images/uploads/**` pode não ser
   exprimível como desenhado. É uma incerteza real, marcada em 3.5 para verificação empírica, com
   caminho de saída definido (revisão humana também no conteúdo, decisão do dono).
7. **Nada disto altera o SEC-01**, que continua `high`, continua a ser configuração da Vercel, e
   continua pré-condição de deploy.

---

BLOCKERS: nenhum. Não há dependência de código de aplicação; P1/P2/P3 podem ser feitos em paralelo
com o resto da Fase 5.

---

REQUIRED_NEXT_ACTION:

**Implementa a seguir o `devops-engineer`** — é dele a totalidade de P1, P2 e P3. **Não há trabalho de
`developer` no controlo em si**, e nenhuma rota nova é criada (a Opção B foi rejeitada, portanto não
há tarefa de route handler para ninguém).

Para o `devops-engineer`, por ordem:
1. **P3 primeiro, P1 e P2 depois.** Sem CODEOWNERS a cobrir `/.github/**`, o workflow que criares no
   passo seguinte é anulável pelo PR que ele devia bloquear (ISSUES 2). Esta ordem não é estética.
2. Criar `.github/workflows/media-guard.yml` conforme 3.3 (regra) e 3.4 (restrições). Referenciar
   este handoff no cabeçalho do ficheiro.
3. Registar o check em `main` conforme 3.5, com a lista de bypass vazia salvo o dono, e as definições
   de Actions em read-only.
4. **Provar com dois PR de teste**, não com a afirmação de que ficou feito: (a) um PR que adiciona
   `public/images/uploads/probe.svg` — tem de ficar bloqueado, com merge indisponível na UI; (b) um
   PR que só altera um texto em `content/` — tem de reportar o check com sucesso e ficar fundível.
   Apagar as branches de teste no fim.
5. Continuam a ser tuas, do handoff-41 e independentes disto: a prova do **SEC-01**, o `npm ci` no
   build da Vercel (SEC-P5-08), e o reteste do SEC-P5-09 contra um deployment real
   (`curl --path-as-is "<origem>/images/uploads%2F<ficheiro>.svg"`) quando ele existir.

Para o `developer` (uma linha, não bloqueia nada): corrigir o comentário do SEC-P5-03 em
`public/admin/config.yml` (~linhas 50-55), que ainda afirma que a CSP de `next.config.mjs` é "a
defesa real e efetiva" — passou a ser defesa em profundidade; a defesa real é o `media-guard`. E,
quando o workflow existir, acrescentar o nome do ficheiro ao comentário de `next.config.mjs`.

Para o `security-engineer`, depois: revalidar contra o ficheiro de workflow **e** contra a
configuração efetiva de branch protection e CODEOWNERS — em particular que um PR que altere
`.github/**` fica retido por revisão de code owner, que é a premissa de que todo o resto depende.

---

CONTEXT_FOR_NEXT_AGENT:

- **Decisão fechada: Opção A, âmbito alargado.** A media **não** sai de `public/images/uploads/`.
  Não criar route handler de media. Não alterar `media_folder`/`public_folder` no `config.yml`.
- **A entrada de CSP `/images/uploads/:path*` em `next.config.mjs` não se remove**, mesmo depois de o
  Action existir e mesmo sabendo que é contornável.
- **P1, P2 e P3 valem tudo ou nada.** Se alguma não for implementável como descrita, isso é `BLOCKED`
  e volta ao architect — não se entrega "a parte que deu", porque a parte que dá, sozinha, não é um
  controlo (ISSUES 1 e 2).
- **Fronteira de confiança a respeitar:** superfície auto-fundível pelo editor = `content/**` +
  `public/images/uploads/**` e mais nada. Tudo o resto exige revisão do dono. Alargar a superfície
  auto-fundível é uma decisão de arquitetura, não de configuração.
- **Precondição temporal inalterada:** isto tem de estar de pé **antes de existir um segundo
  editor**, e é pré-condição da Fase 6, não deste deploy. Com um único editor o risco continua nulo
  (vítima e atacante seriam a mesma pessoa).
- **Método herdado do handoff-41, que continua a valer:** nada se dá por fechado por estar escrito.
  Um controlo de CI verifica-se com um PR que tem mesmo de falhar, tal como uma CSP se verifica com
  um ficheiro que existe mesmo.

HIGH_RISK_AREA: **true** — por três razões independentes. (1) O ativo protegido é um **token OAuth**
com escrita em todos os repositórios públicos da vítima; o desenho está na fronteira da área
"autenticação/tokens" do `CLAUDE.md` secção 1. (2) O desenho altera a **política de merge do branch
de produção** (`main`) e a configuração de acesso do repositório — configuração que, mal feita,
bloqueia o site ou abre-o. (3) O mecanismo proposto é ele próprio abusável de três formas
identificadas (negação de serviço editorial, PR que neutraliza o guarda, `pull_request_target`), todas
endereçadas explicitamente na secção 3.4 e nos ISSUES 1-3. A implementação de P2/P3 exige alterações
na configuração do GitHub que só o dono do repositório pode fazer — **confirmação humana obrigatória
antes de as aplicar.**
