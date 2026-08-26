# Handoff 47 — Security Engineer — Fecho do SEC-P5-13 e concessão do Gate 4

**Task:** 001-migracao-stack
**Agente:** security-engineer
**Âmbito:** estrito — **apenas** SEC-P5-13, o único ponto que retinha o Gate 4 no
`handoff-46-security-engineer-fechamento-final.md`. Não reabri 11, 12, 14, 15: disse no handoff-46 que
não seria preciso repeti-los e mantenho a palavra.
**Evidência nova:** captura de ecrã real do "Settings -> Branches -> Branch rules" do repositório,
partilhada pelo dono e vista diretamente pelo orchestrator (não é uma alegação relatada).
**Verificação de estado que fiz eu:** `HEAD` continua em `b7d25d1`, `git status --porcelain .github/`
vazio, e os quatro ficheiros que aprovei no handoff-46 têm os mesmos bytes de então
(`components/OrganizationJsonLd.tsx` `15289aa4...`, `content/schemas/index.ts` `66ed6424...`,
`.github/CODEOWNERS` `1cc12940...`, `.github/workflows/media-guard.yml` `f1e9f78c...`).
Ou seja: a aprovação que dou aqui assenta no mesmo objeto que examinei, não numa versão posterior.

---

STATUS: **APPROVED**

- **SEC-P5-13 (`medium`) — FECHADO.** A hipótese (c) do handoff-44 — "Require review from Code Owners"
  não estar ligado — está **refutada por evidência direta do ecrã de configuração**.
- **P1 + P2 + P3 estão os três provados.** O controlo composto que o architect desenhou no handoff-42
  está de pé por inteiro. "P1 é teatro sem P3" deixa de se aplicar: P3 existe.
- **Isto é o Gate 4 (security) para o controlo SEC-P5-03 / SEC-P5-09.** Digo-o explicitamente, como me
  foi pedido, e sem condição pendente: **Gate 4 = CONCEDIDO** para esta ronda de correções
  (SEC-P5-11 a SEC-P5-16). Não tenho mais nada a verificar neste âmbito.
- Fica **um achado novo `low`, não bloqueante** (SEC-P5-17, lista de bypass), outro (SEC-P5-18) e **um
  gate permanente vinculativo** para o momento em que existir um segundo colaborador. Nenhum deles
  retém o Gate 4 — e explico abaixo por que é que não estou a fazer batota comigo próprio ao dizê-lo.
- `REQUIRES_HUMAN_NOTIFICATION: true` — obrigatório, e **não** por causa deste fecho. Ver a secção.

---

SUMMARY:

O que eu exigia no handoff-46 era uma coisa concreta e falsificável: prova de que
`require_code_owner_reviews` está ligado na proteção de `main`, distinta de "há um PR obrigatório" e
distinta de "há um required check". A captura mostra exatamente isso, no sítio certo da hierarquia —
`Require review from Code Owners` **ativo**, dentro das definições adicionais da regra
`Require a pull request before merging`, na proteção de `main`. É o objeto, não uma frase sobre o
objeto. Aceito-a e fecho o achado.

Três consequências que vale a pena escrever, porque são o que o controlo realmente ganha:

1. **`.github/` está coberto.** A regra do CODEOWNERS que apanha `.github/workflows/media-guard.yml` é
   a regra geral `* @virgilio-24` (verifiquei outra vez que nenhuma das três exceções —
   `/content/services/`, `/content/site/`, `/public/images/uploads/` — casa com `.github/`). Logo, o
   cenário que me fez bloquear duas vezes — **um PR único que reescreve o `media-guard.yml` para passar
   sempre e traz o SVG no mesmo commit** — passa a exigir aprovação de `@virgilio-24`. Era este o
   cenário; está fechado.
2. **O CODEOWNERS usado é o do branch base.** Um PR que tente neutralizar o controlo alterando o
   próprio `.github/CODEOWNERS` continua a ser avaliado contra a versão que está em `main`, portanto
   continua a precisar do dono. Não há auto-desbloqueio.
3. **Combina com o que já estava provado:** o PR #4 mostrou `media-guard / media-guard (pull_request)`
   com a etiqueta **Required**, e a captura confirma "Require status checks to pass" ativo. O segundo
   item que eu tinha pedido no ponto 1 do REQUIRED_NEXT_ACTION do handoff-46 (`media-guard` nos
   contextos obrigatórios) estava, portanto, já satisfeito — não o volto a pedir.

**Sobre "Required approvals: 0", que é o ponto fino e a razão de ser desta revalidação.** Analisei-o e
a resposta é: **não anula a exigência de revisão do code owner** — mas quero ser preciso sobre o meu
nível de confiança, porque essa foi a pergunta feita e porque é exatamente o tipo de detalhe onde este
projeto já se enganou uma vez. Ver VALIDATIONS 2. Resumo: é **inferência de alta confiança apoiada no
modelo de dados documentado da GitHub**, e **não** uma citação de documentação que trate o caso `0`
explicitamente. Assumo essa distinção em vez de a esconder atrás de uma afirmação categórica.

**Por que fecho mesmo assim, e por que isto não é a "inferência confortável" que recusei no handoff-46.**
A diferença é material e não retórica. No handoff-46 pediam-me para inferir **um facto sobre a
configuração deste repositório** ("a caixa deve estar ligada") a partir de evidência que não o mostrava.
Agora a configuração está **vista**. O que sobra é uma questão sobre a **semântica da plataforma**, que
é: (i) verificável por qualquer pessoa, a qualquer momento, sem acesso privilegiado; (ii) idêntica para
todos os repositórios do mundo, portanto não é um risco específico deste projeto que eu esteja a deixar
passar em silêncio; e (iii) **sem exposição viva hoje**, porque — como o próprio handoff-46 estabeleceu
— com o SEC-P5-11 corrigido este risco **volta a depender da existência de um segundo editor**, que não
existe. Recuso-me a bloquear indefinidamente um controlo por uma questão de semântica de plataforma
cuja materialização depende de uma condição que ainda não ocorreu — desde que prenda a verificação ao
momento exato em que essa condição ocorrer. É o que faço no gate permanente abaixo, e faço-o
**vinculativo, não recomendado**.

---

ARTIFACTS:

- `project/state/task-001-migracao-stack/handoff-47-security-engineer-gate4-final.md` (este ficheiro)
- **Nenhum ficheiro do repositório criado ou alterado.** `HEAD` = `b7d25d1`, `.github/` sem alterações
  locais, md5 dos quatro ficheiros aprovados idênticos aos do handoff-46.

---

VALIDATIONS:

### 1. O que a captura prova, item a item

| Definição observada | Estado | O que fecha |
|---|---|---|
| `Require a pull request before merging` | ativo | Já se sabia. Não prova nada sobre code owners — foi precisamente a confusão que apontei. |
| - `Require review from Code Owners` | **ATIVO** | **Refuta a hipótese (c) do handoff-44.** É o item que retinha o Gate 4. |
| - `Required approvals` | **0** | Ver secção 2. Não anula o anterior. |
| - `Dismiss stale approvals on new commits` | desativado | Ver secção 3 — residual, não bloqueia. |
| - `Require approval of most recent reviewable push` | desativado | Ver secção 3 — residual, não bloqueia. |
| - `Require conversation resolution` | desativado | Irrelevante para este controlo. |
| - `Require review from specific teams` | desativado | Irrelevante — a exigência vem do CODEOWNERS. |
| - `Additional approval for unattributed Copilot PRs` | ativo | Reforço, não conta como controlo. |
| `Require status checks to pass` | ativo | Com `media-guard` marcado **Required** no PR #4. P2 confirmado. |
| `Block force pushes` | ativo | Impede reescrita do histórico de `main` a contornar tudo o resto. |
| `Restrict deletions` | ativo | Impede apagar `main` para desfazer a proteção. |

`Block force pushes` e `Restrict deletions` não estavam na minha lista de exigências, e reforçam o
controlo em duas vias que eu não tinha coberto: sem eles, um ator com escrita podia reescrever `main`
diretamente em vez de passar por um PR. Registo-os como ganho.

### 2. "Required approvals: 0" + "Require review from Code Owners" — analise, com confianca declarada

**Conclusão: são exigências independentes, e a segunda continua a bloquear o merge mesmo com a primeira
a 0.** Um PR que altere um ficheiro com dono não é fundível até esse dono aprovar.

**O que é conhecimento documentado da GitHub (confiança alta):**

- São **dois campos distintos** no modelo de dados da proteção de branch, não dois aspetos do mesmo:
  `required_approving_review_count` (inteiro) e `require_code_owner_reviews` /
  `require_code_owner_review` (booleano). A API aceita e persiste `0` + `true` em simultâneo — não é um
  estado inválido nem uma combinação que a plataforma normalize ou rejeite. A própria UI permite
  guardá-la, que é o que a captura mostra.
- A exigência de code owner é avaliada **por ficheiro alterado**, contra o CODEOWNERS do **branch
  base**: para cada ficheiro com dono, é preciso uma aprovação de um dos donos desse ficheiro. É uma
  condição de natureza diferente de "contar N aprovações quaisquer" — é uma condição sobre **quem**
  aprovou, não sobre **quantos**.

**O que é inferência minha (confiança alta, mas inferência — e digo-o porque me foi perguntado):**

- Que, sendo condições de natureza diferente e campos independentes, a de code owner é avaliada mesmo
  quando a contagem exigida é `0`. **Não tenho presente uma frase da documentação da GitHub que trate
  explicitamente o caso "required approvals = 0" combinado com code owners.** A minha conclusão assenta
  na independência dos dois campos e no comportamento consistentemente reportado (o PR fica em "Review
  required" e o botão de merge indisponível até o dono aprovar, ainda que a contagem esteja a zero).
  Não a apresento como facto documentado. Apresento-a como o que é.

**Se eu estiver errado, o que acontece:** P3 é inerte e o cenário do PR único que reescreve o
`media-guard.yml` volta a estar aberto — a mesma consequência de sempre. É por isso que **não deixo
isto por conta da minha confiança**: fica preso ao gate permanente abaixo, que é o teste que converte
inferência em facto observado, e que é obrigatório **antes** de o risco poder materializar-se.

**Nota de leitura correta do `0`, que não é um defeito:** "Required approvals: 0" significa que
ficheiros **sem** dono — `content/site/`, `content/services/`, `public/images/uploads/` — se fundem sem
qualquer revisão humana. Isto é **intencional** e já estava analisado e aceite: é o preço de o Decap CMS
poder publicar sozinho, e só é aceitável porque essas três pastas têm as suas próprias defesas
(validação de esquema, `media-guard` como required check, e o escape do JSON-LD do SEC-P5-11). O `0`
não é uma fraqueza nova; é a decisão de arquitetura já registada, agora visível na configuração.

### 3. Residuais que examinei e que decidi **não** transformar em bloqueio

Digo o que são e por que não bloqueiam, em vez de os omitir:

- **`Dismiss stale approvals` e `Require approval of the most recent push` desativados.** Permitem, em
  teoria, o padrão "PR limpo -> dono aprova -> autor faz push de um commit malicioso -> funde com a
  aprovação antiga". É um vetor real e conhecido. **Não bloqueia hoje**: exige um autor com escrita
  distinto do dono, que é a mesma condição que não existe, e o `media-guard` continua a correr sobre o
  push novo como required check. Fica registado como **SEC-P5-18 (`low`)**, com correção de trinta
  segundos: ligar as duas caixas. **Recomendo ligá-las antes de admitir o segundo colaborador**, e
  nessa altura passa a ser condição, não recomendação.
- **A captura não mostra a lista de bypass nem "Do not allow bypassing".** Se a conta administradora
  (`AgroTrades`) tiver bypass, pode fundir alterações a `.github/` sem a aprovação de `@virgilio-24` —
  e `AgroTrades` foi quem fundiu os PR #2 e #5. **Não bloqueia**: o adversário modelado no SEC-P5-03 é
  um **editor com escrita e sem privilégios de administração**, e esse não beneficia de bypass; o
  bypass do administrador é o dono a contornar o seu próprio controlo, que é risco de processo aceite
  num projeto de um só responsável, não uma via de ataque. Fica como **SEC-P5-17 (`low`)**.
- **Um PR autorado pelo próprio `@virgilio-24`** não pode ser aprovado por ele: quando o único dono dos
  ficheiros é o autor, a exigência não acrescenta escrutínio. É inerente ao modelo de um único dono e
  não tem correção técnica — corrige-se com um segundo revisor humano, se e quando existir.

Nenhum destes três é o achado que retinha o Gate 4, nenhum é `high`, e nenhum abre a via que eu andava
a defender. Registo-os para não desaparecerem, não para adiar o fecho.

### 4. Estado do objeto aprovado (para a aprovação não transitar por engano)

`HEAD` = `b7d25d1`, `git status --porcelain .github/` vazio, md5 dos quatro ficheiros idênticos aos do
handoff-46. **Mantém-se integralmente a nota do handoff-46 ao Orchestrator:** a correção do SEC-P5-11
(`components/OrganizationJsonLd.tsx`, `content/schemas/index.ts`) **continua por commitar**. O que
aprovo é o conteúdo com aqueles md5. Se o commit da Fase 5 os alterar, **a aprovação não transita** e
tem de voltar a mim. Confirmar o diff final destes dois ficheiros no commit continua por fazer.

---

ISSUES:

| Ref | Severidade | Título | Estado |
|---|---|---|---|
| SEC-P5-13 | medium | P3 não provado — `require_code_owner_reviews` | **FECHADO** — confirmado no ecrã de configuração (VALIDATIONS 1) |
| SEC-P5-03 | medium | SVG na media library rouba o token de outro editor | **FECHADO** — P1+P2+P3 provados os três |
| SEC-P5-09 | medium | CSP contornável com %2F | **FECHADO** — mitigado por P1+P2 (incl. capitalização), com P3 a proteger a definição do workflow |
| SEC-P5-11 | high | XSS armazenado via JSON-LD | **CORRIGIDO** — verificado por mim (handoff-46) |
| SEC-P5-12 | high | Exceção `/content/` do CODEOWNERS | **CORRIGIDO** — verificado em `main` (handoff-46) |
| SEC-P5-14 | low-medium | `public/images/Uploads/` escapava a P1 | **CORRIGIDO** — verificado por execução real (handoff-46) |
| SEC-P5-15 | low | `z.string().url()` aceitava `javascript:`/`data:` | **CORRIGIDO** — testado (handoff-46) |
| SEC-P5-16 | low | Dois comentários falsos (`config.yml` ~50-52, `next.config.mjs` 137-139) | **ABERTO** — quarta vez que o peço. Não bloqueia |
| SEC-P5-17 | **low (novo)** | Lista de bypass da regra de `main` não observada | **ABERTO** — não bloqueia (VALIDATIONS 3) |
| SEC-P5-18 | **low (novo)** | `Dismiss stale approvals` e `most recent push` desativados | **ABERTO** — não bloqueia hoje; passa a condição antes do 2.º colaborador |
| SEC-P5-07 | high | `npm audit` sem correção disponível | **ABERTO** — fora deste âmbito, pré-condição de deploy |
| SEC-01 | high | Segredos no ambiente Preview da Vercel | **ABERTO** — fora deste âmbito, pré-condição de deploy |

**Nenhuma vulnerabilidade `high` ou `critical` aberta dentro do âmbito deste Gate 4.** As duas `high`
que existem são as conhecidas, fora deste âmbito, e continuam a bloquear **o deploy público** — não
esta fase.

---

BLOCKERS:

**Nenhum dentro deste âmbito.** SEC-P5-13 era o blocker único do handoff-46 e está fechado.

Fora do âmbito e inalterados, ambos ainda `high` e ambos pré-condições de **deploy público**, com dono
no `devops-engineer`: **SEC-01** (segredos no ambiente Preview da Vercel) e **SEC-P5-07** (`npm audit`).
Recordo que o Gate 4 que concedo aqui é para o controlo SEC-P5-03/09 e para a ronda SEC-P5-11..16 —
**não é uma autorização de deploy** e não deve ser lido como tal por nenhum agente a jusante.

---

REQUIRES_HUMAN_NOTIFICATION: **true**

Obrigatório e não discricionário. **Não** por causa deste fecho — este fecho é boa notícia — mas por
três razões independentes que se mantêm:

1. **Regra 2 do meu mandato:** SEC-P5-11 e SEC-P5-12 foram `high`. **Mesmo corrigidas e verificadas**,
   uma severidade `high` é sempre notificada. Não me cabe decidir que já não vale a pena incomodar.
2. **SEC-01** continua `high` e aberto.
3. **SEC-P5-07** continua `high` sem correção disponível.

**O que o Orchestrator deve levar ao dono do projeto:**

- **Está fechado.** A caixa que faltava estava mesmo ligada. O controlo que protege o repositório —
  workflow + check obrigatório + revisão pelo dono do código — está completo e é o Gate 4 de segurança
  desta ronda. Bloqueei isto duas vezes; desbloqueio-o agora com a mesma clareza.
- **A pergunta do "Required approvals: 0" era pertinente e a resposta é: não é problema.** Exigir
  revisão do dono e contar aprovações são regras diferentes; o 0 só significa que ficheiros **sem**
  dono (os dados do CMS) publicam sem revisão, que é o que foi decidido de propósito.
- **Um ponto de honestidade que faço questão de deixar escrito:** esta última afirmação é a minha
  leitura, muito segura, do funcionamento da GitHub — não é uma frase que eu possa citar da
  documentação deles a tratar este caso exato. Por isso deixei um teste obrigatório amarrado ao momento
  em que isso passar a ter consequências (ver abaixo). Não fiz de conta que era certeza.
- **A única coisa que fica pendente, e é para o futuro:** no dia em que der acesso ao CMS ou escrita a
  outra pessoa, há três verificações de cinco minutos a fazer **antes** de lhe dar o acesso. Estão
  listadas abaixo e não são opcionais.
- **Nada `critical`.** As duas falhas graves que continuam abertas são as já conhecidas e são de
  **deploy**, não desta fase: os segredos no ambiente Preview da Vercel e as vulnerabilidades do
  `npm audit`. O site não deve ir a público sem essas duas resolvidas.

---

REQUIRED_NEXT_ACTION:

**GATE PERMANENTE — vinculativo, não recomendação. Dono: o dono do projeto.**
**Antes** de conceder escrita no repositório ou acesso ao Decap CMS a qualquer nova pessoa, executar,
por esta ordem, e só depois conceder o acesso:

1. **Teste comportamental de P3** (é o teste que converte a minha inferência em facto observado):
   PR aberto pela conta que **não** é code owner, a tocar em `.github/workflows/media-guard.yml` ou num
   `.ts` de `content/` -> tem de ficar em **"Review required"**, com `@virgilio-24` pedido, e o merge
   indisponível. **Se este teste falhar, o controlo SEC-P5-03/09 cai e o Gate 4 é revogado** — voltar a
   mim imediatamente.
2. **Ligar** "Dismiss stale pull request approvals when new commits are pushed" **e** "Require approval
   of the most recent reviewable push" (SEC-P5-18). Sem isto, uma aprovação dada a um PR limpo cobre um
   commit malicioso empurrado a seguir.
3. **Prova (b) do architect**, nunca executada: PR que altera **só** um `.json` de `content/site/` ->
   deve continuar verde e fundível **sem** revisão, confirmando que a exceção não ficou larga nem
   estreita de mais.

**Para o dono do projeto — quando quiser, trinta segundos, não bloqueia nada:**

4. SEC-P5-17: confirmar a lista de bypass da regra de `main` (ou ligar "Do not allow bypassing"). Se a
   conta `AgroTrades` puder contornar, saber disso explicitamente em vez de por omissão.

**Para o `developer` — nada bloqueante, mas é a quarta vez:**

5. SEC-P5-16: `public/admin/config.yml` ~50-52 (a defesa real contra SVG com script é o `media-guard`,
   não o `next.config.mjs`) e `next.config.mjs` 137-139 (o workflow já existe em `main`; nomeá-lo).
   Comentários falsos neste projeto já custaram caro uma vez — foi um deles que me fez passar ao lado
   do SEC-P5-11 no handoff-41.

**Para o `devops-engineer`:** inalterado — SEC-01, `npm ci` no build da Vercel (SEC-P5-08) e o reteste
do SEC-P5-09 contra um deployment real. São pré-condições de deploy, não deste gate.

**Para o Orchestrator:** confirmar que o commit da Fase 5 inclui `components/OrganizationJsonLd.tsx` e
`content/schemas/index.ts` **exatamente** com o conteúdo aprovado (md5 em VALIDATIONS 4). Se o diff os
alterar, a aprovação não transita.

**Para mim (`security-engineer`):** **nada.** Não há revalidação pendente neste âmbito. Só volto a
entrar se (i) o teste 1 do gate permanente falhar, (ii) os dois ficheiros do SEC-P5-11 forem alterados
antes do commit, ou (iii) surgir âmbito novo.

---

CONTEXT_FOR_NEXT_AGENT:

- **GATE 4 (security) = CONCEDIDO** para o controlo SEC-P5-03/09 e para a ronda de correções
  SEC-P5-11 a SEC-P5-16. Não há nada em aberto da minha parte neste âmbito. O `code-reviewer` e o
  `qa-engineer` podem prosseguir sem esperar por mim.
- **Gate 4 não é autorização de deploy.** SEC-01 e SEC-P5-07 continuam `high` e abertos, e continuam a
  ser pré-condições de qualquer publicação pública. O `release-manager` não deve ler este handoff como
  Gate 4 satisfeito para o workflow `release`.
- **O que está provado e ninguém precisa de reverificar:** a proteção de `main` exige PR, exige revisão
  de **Code Owner**, exige o check `media-guard` (etiqueta Required, PR #4), bloqueia force-push e
  proíbe apagar o branch; `@virgilio-24` é colaborador reconhecido e é dono de tudo exceto as três
  pastas de dados; `.github/` cai na regra `*` e portanto exige a sua revisão; o escape do JSON-LD; o
  CODEOWNERS estreitado; a rejeição de variantes de capitalização e a verificação de assinatura de
  bytes do `media-guard` (offline, com o script real); o fail-closed do `media-guard`; `httpUrl` a
  rejeitar `javascript:`/`data:`.
- **O que continua por observar, e não deve ser descrito como provado:** o comportamento real de um PR
  de um **não**-owner retido em "Review required" (é inferência de alta confiança, não observação — ver
  VALIDATIONS 2); a lista de bypass da regra; a verificação de assinatura a correr no runner real da
  GitHub.
- **Precondição temporal, e é a chave para ler este handoff:** com o SEC-P5-11 corrigido, o risco do
  SEC-P5-03 **volta a depender da existência de um segundo editor**. Não existe. É por isso que os
  residuais `low` acima são residuais e não blockers — e é por isso que o gate permanente está amarrado
  exatamente ao momento em que essa condição mudar. **Quem admitir um segundo colaborador sem correr os
  pontos 1-3 do REQUIRED_NEXT_ACTION está a operar fora do que eu aprovei.**
- **Lição de método desta ronda, que confirma a do handoff-46:** a distinção que me fez bloquear duas
  vezes — "o ficheiro CODEOWNERS ser válido", "a proteção exigir revisão de code owner" e "haver um
  required check" — eram mesmo três coisas diferentes, e só a captura do ecrã de configuração as
  separou. Nenhuma inferência a partir da UI dos PRs as teria distinguido, porque as três produzem a
  mesma UI. Valeu a pena insistir.

HIGH_RISK_AREA: **true** — mantenho a classificação. A área continua a tocar a política de merge do
branch de produção e o ativo continua a ser um token OAuth com escrita. O que mudou é que o controlo
está agora completo e provado nas três peças; a classificação serve para que qualquer alteração futura
a `.github/`, ao CODEOWNERS ou às regras de `main` volte a passar por segurança, e não para sinalizar
exposição atual.
