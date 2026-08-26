# Handoff 45 — DevOps Engineer — Correção SEC-P5-12 e SEC-P5-14

**Task:** 001-migracao-stack
**Agente:** devops-engineer
**Âmbito:** aplicar as duas correções atribuídas a mim no handoff-44 (`security-engineer`) —
SEC-P5-12 (`high`, exceção `/content/` do CODEOWNERS liberta código executável) e SEC-P5-14
(`low-medium`, comparação de prefixo case-sensitive no `media-guard`). Autorização explícita do
dono do projeto recebida via Orchestrator para corrigir agora.

---

STATUS: **APPROVED** (âmbito desta correção; ver BLOCKERS para o que continua fora dele)

---

SUMMARY:

Ambas as correções pedidas foram aplicadas, testadas localmente e o comportamento novo foi
verificado com um repositório git sintético (não apenas leitura do ficheiro). Não toquei em mais
nenhum ficheiro do repositório — `git status --porcelain .github/` mostra só os dois ficheiros
alterados, e o `git status` geral confirma que nenhuma das ~88 entradas pré-existentes de outras
fases foi tocada.

**SEC-P5-12** — `.github/CODEOWNERS` estreitado: as linhas `/content/` e
`/public/images/uploads/` foram substituídas por `/content/services/`, `/content/site/` e
`/public/images/uploads/`. Confirmei em `public/admin/config.yml` que são exatamente as duas
únicas superfícies que o Decap escreve sem revisão (`folder: content/services` na coleção
"services"; `file: content/site/*.json` em cada entrada da coleção "site") — não deduzi o padrão,
li o config.yml linha a linha. Isto devolve `content/index.ts`, `content/organization.ts`,
`content/routes.ts`, `content/seo.ts`, `content/service-slugs.ts` e `content/schemas/index.ts` à
regra geral `* @virgilio-24`, exigindo revisão de code owner. Também reescrevi o comentário do
ficheiro, que afirmava "ausência de código executável em content/ (apenas dados YAML/Markdown
consumidos em build)" — falso, como o security-engineer provou. O novo comentário nomeia
explicitamente as duas pastas cobertas pela exceção e a razão (dados JSON validados por schema no
build, não código), e regista a proveniência da correção (handoff-44).

**Não alterei `@virgilio-24`** como code owner — essa identidade não está verificada como
colaborador com escrita (SEC-P5-13, em aberto, atribuído ao dono do projeto no handoff-44) e não é
algo que eu possa confirmar ou substituir sem acesso ao GitHub. Ver BLOCKERS.

**SEC-P5-14** — `.github/workflows/media-guard.yml`: a comparação `f.startsWith(UPLOADS_PREFIX)`
continua a decidir quais ficheiros são validados como upload (mantém o comportamento correto
para o caminho exato), mas agora há uma segunda verificação: qualquer ficheiro alterado cujo
caminho corresponda ao prefixo `public/images/uploads/` **ignorando maiúsculas/minúsculas** mas
**não** corresponda byte a byte é explicitamente rejeitado (`fail(...)`), com mensagem própria a
explicar que a capitalização do caminho não pode ser usada para contornar a validação. Não fiz
normalização silenciosa (não passei o ficheiro por baixo do capô como se estivesse no caminho
certo) — isso esconderia o problema em vez de o recusar, e o pedido do security-engineer foi
explícito nesse ponto ("recusar explicitamente... não deixar passar silenciosamente").

---

ARTIFACTS:

- `.github/CODEOWNERS` — exceção estreitada de `/content/` para `/content/services/` +
  `/content/site/`; comentário da justificação reescrito; referência ao handoff-44 acrescentada.
- `.github/workflows/media-guard.yml` — nova constante `UPLOADS_PREFIX_LOWER`; novo bloco
  `caseMismatchFiles` com `fail()` explícito antes do `process.exit(0)` de "nenhuma alteração sob
  uploads"; comentário explicando o SEC-P5-14 no ponto exato da correção.
- `project/state/task-001-migracao-stack/handoff-45-devops-sec-p5-12-14.md` (este ficheiro).
- Nenhum outro ficheiro do repositório tocado.

---

VALIDATIONS:

**1. Sintaxe do script Node do `media-guard.yml`** — extraí o heredoc do ficheiro real (o mesmo
que corre no runner, não uma cópia) e corri `node --check`: `SYNTAX_OK`.

**2. Lógica de deteção de case-mismatch, isolada** — simulação direta da expressão
`caseMismatchFiles`:
```
normal:            public/images/uploads/x.png            -> uploadFiles=[x.png], caseMismatch=[]
mismatch de pasta:  public/images/Uploads/x.svg             -> uploadFiles=[],      caseMismatch=[x.svg]
não relacionado:    content/organization.ts                 -> uploadFiles=[],      caseMismatch=[]
extensão maiúscula: public/images/uploads/X.PNG             -> uploadFiles=[X.PNG], caseMismatch=[]
                    (correto: só a PASTA precisa de ser exata; a extensão já era
                    case-insensitive por design, via NAME_RE com flag /i, e continua a ser)
```

**3. Execução real contra um repositório git sintético** — criei um repo git isolado no
scratchpad da sessão (fora do repositório do projeto), extraí o script real do
`media-guard.yml` para um `.js`, e corri-o com `execFileSync('git', ...)` real (não mockado)
contra três commits sucessivos a partir da mesma base:

   - **Caso A — `public/images/Uploads/x.png` (pasta com maiúscula, bytes de SVG dentro):**
     `EXIT=1`, mensagem:
     `public/images/Uploads/x.png: o caminho corresponde a "public/images/uploads/" ignorando
     maiúsculas/minúsculas, mas não byte a byte. Só é aceite exatamente
     "public/images/uploads/" (tudo em minúsculas)...`
     — **antes da correção este ficheiro passava (`uploadFiles` ficava vazio e o job saía com
     PASS antes de nunca inspecionar os bytes); confirmei o comportamento antigo lendo o
     `startsWith` original antes de alterar. Agora falha, fechado.**
   - **Caso B — `public/images/uploads/valid.png` (caminho exato, PNG genuíno de 1x1):**
     `EXIT=0`, `media-guard: OK — ... PASS`. Confirma que o caminho correto continua a passar
     sem alteração de comportamento.
   - **Caso C — commit sem tocar em `public/images/`:** `EXIT=0`,
     `nenhuma alteração sob public/images/uploads/ neste PR. PASS.` Confirma que o novo bloco
     `caseMismatchFiles.length === 0` não altera o fast-path de PRs que não tocam a pasta.

   Repositório de teste apagado no fim (`rm -rf`), nada residual.

**4. `public/admin/config.yml` — fonte da verdade para o âmbito da exceção do CODEOWNERS**,
   lido linha a linha antes de editar: `folder: content/services` (coleção "services", linha
   65) e onze entradas `file: content/site/*.json` (coleção "site", linhas 191-648). Nenhum
   outro caminho sob `content/` é declarado como `folder`/`file` de uma coleção Decap — a nova
   exceção do CODEOWNERS cobre exatamente isto e nada mais.

**5. `git status --porcelain .github/`** antes do commit: só os dois ficheiros esperados
   modificados. Nenhum outro ficheiro do repositório (incluindo os ~88 pendentes de fases
   anteriores) foi tocado por este trabalho.

---

ISSUES:

Nenhum problema novo encontrado durante a implementação. Notas de âmbito, não bloqueadoras deste
handoff:

- A correção de SEC-P5-11 (escape do `JSON.stringify` em `OrganizationJsonLd.tsx`) **não é minha**
  — está atribuída ao `developer` no handoff-44 e continua aberta. Não a toquei.
- SEC-P5-13 (identidade do code owner não verificada como colaborador com escrita) **não é minha**
  — está atribuída ao dono do projeto no handoff-44. Não alterei `@virgilio-24` no CODEOWNERS por
  não ter forma de a verificar a partir daqui, e alterá-la sem verificação seria deduzir, que o
  security-engineer explicitamente proibiu ("Substituir @virgilio-24 pela identidade GitHub
  **verificada**... Não deduzir.").
- SEC-01 (segredos no ambiente Preview da Vercel) e o reteste de SEC-P5-09 contra um deployment
  real continuam meus e inalterados por este handoff — fora do âmbito pedido nesta tarefa.

---

BLOCKERS:

Nenhum para o trabalho que me foi pedido aqui — ambas as correções estão feitas e testadas.

O que continua a bloquear o **fecho do controlo SEC-P5-03/09 como um todo** (não é bloqueador
meu, é o que o handoff-44 já registava e que esta correção não resolve sozinha):

1. **SEC-P5-11 (`high`)** — ainda aberto, atribuído ao `developer`. Enquanto não corrigido, um
   editor com escrita continua a poder injetar script via `content/site/contacts.json` (e
   ficheiros irmãos) mesmo com o CODEOWNERS agora corrigido — porque `content/site/` continua,
   por desenho, sem revisão humana (é dado editável, não código). A correção de SEC-P5-12 fecha a
   via pelos `.ts`; não fecha a via pelo JSON-LD.
2. **SEC-P5-13 (`medium`)** — a validade de `@virgilio-24` como code owner com escrita continua
   por confirmar no GitHub. **A minha correção do CODEOWNERS não pode ser considerada eficaz até
   essa verificação existir** — se `@virgilio-24` não for um colaborador reconhecido, o GitHub
   ignora a regra em silêncio e a exceção estreitada de nada serve, apesar de estar
   sintaticamente correta no ficheiro local.
3. **A verificação exigida pelo pedido original — confirmação no GitHub, não no ficheiro local —
   não pôde ser feita por mim.** Não tenho acesso autenticado ao GitHub neste ambiente (mesma
   limitação registada no handoff-43). Ver REQUIRED_NEXT_ACTION para os passos exatos.

---

REQUIRED_NEXT_ACTION:

**Para o dono do projeto (`@virgilio-24` ou quem tiver acesso ao GitHub), passos exatos para
reproduzir a verificação que o security-engineer exige:**

1. Abrir `https://github.com/AgroTrades/agrotrades/blob/main/.github/CODEOWNERS` (depois deste
   commit estar em `main`, o que depende do push que o Orchestrator vai coordenar). Confirmar que
   a página mostra **"This CODEOWNERS file is valid."** sem nenhum aviso do tipo "Unknown owner on
   line X". Isto responde, de caminho, à verificação (1) do SEC-P5-13 pendente desde o handoff-44
   — é a mesma vista, grátis, e não foi feita ainda.
2. Passar o rato/clicar em cada linha do ficheiro na vista web e confirmar que o GitHub associa:
   - `*` a `@virgilio-24`;
   - `/content/services/` e `/content/site/` a "nenhum dono" (exceção, intencional);
   - `/public/images/uploads/` a "nenhum dono" (exceção, intencional, inalterada).
3. **Teste com PR real (o que o pedido original pede especificamente):** abrir um PR que altera
   **só** `content/organization.ts` (ou qualquer outro `.ts` de `content/` fora de
   `content/services/`/`content/site/`, ex.: `content/routes.ts`, `content/schemas/index.ts`) —
   uma alteração trivial, como um comentário. Confirmar na página do PR:
   - o `media-guard` continua a passar (correto — não há nada sob `public/images/uploads/`);
   - **o PR fica marcado "Review required" e pede explicitamente a revisão de `@virgilio-24`**,
     e o botão de merge fica indisponível até essa revisão — ao contrário do comportamento antes
     desta correção, em que o mesmo PR ficaria fundível sem revisor nenhum.
   Se o resultado for diferente do esperado (ex.: o PR fica fundível sem pedir revisão), isso
   reabre SEC-P5-13 como bloqueador direto — significa que `@virgilio-24` não está a ser
   reconhecido como code owner válido, e a correção do CODEOWNERS, apesar de correta no texto, não
   está a produzir efeito.
4. Complementar (recomendado pelo handoff-44, prova (b) do architect, depois de SEC-P5-11
   corrigido): PR que altera só um `.json` em `content/site/` deve continuar fundível **sem**
   pedir revisão — confirma que a exceção não ficou demasiado larga na direção oposta.
5. Se algum destes passos não puder ser feito por falta de acesso, documentar aqui o resultado
   (mesmo que "não verificado") antes de o Orchestrator avançar para o Gate 4 (security) deste
   controlo — o security-engineer já deixou escrito que não aceita ficheiro local como prova.

**Para o Orchestrator:** o push destes dois ficheiros (`.github/CODEOWNERS`,
`.github/workflows/media-guard.yml`) fica pendente de coordenação, tal como no handoff-43 — o
repositório local tem muito trabalho não commitado de outras fases e o push tem de ficar isolado
só a este commit.

**Para o `security-engineer`:** revalidar SEC-P5-12 e SEC-P5-14 depois do push e da verificação no
GitHub acima — a minha validação local (VALIDATIONS 1-5) prova que a lógica está correta, mas o
próprio handoff-44 é explícito em não aceitar prova local para P3 ("a semântica de 'última regra
que faz match' continua a ser a premissa não verificada").

---

CONTEXT_FOR_NEXT_AGENT:

- **O que está feito e testado (não precisa de ser repetido):** a lógica de ambas as correções,
  offline, contra o texto real dos dois ficheiros e contra um repositório git sintético com os
  três casos relevantes (case-mismatch rejeitado, caminho exato aceite, PR sem alterações
  relevantes ainda passa).
- **O que NÃO está e não pode ser feito por mim:** a confirmação no GitHub em si (página web do
  CODEOWNERS, teste com PR real) — falta de acesso autenticado neste ambiente, mesma limitação do
  handoff-43. Os passos ficam documentados em REQUIRED_NEXT_ACTION para o dono do projeto
  reproduzir.
- **SEC-P5-12 corrigido não fecha SEC-P5-03/09 sozinho.** SEC-P5-11 (JSON-LD sem escape) continua
  aberto e é a via que sobrevive mesmo com o CODEOWNERS correto, porque `content/site/*.json`
  continua, por desenho, na superfície sem revisão. As duas correções (11 do developer, 12 minha)
  só fecham o achado em conjunto — exatamente como o handoff-44 já tinha registado.
- **Não alterei a identidade `@virgilio-24`.** Continua a mesma incerteza do handoff-44 (SEC-P5-13)
  sobre se é um colaborador com escrita válido. Se não for, a minha correção de âmbito é
  sintaticamente correta mas inerte na prática — só o teste com PR real no GitHub resolve isto.
- **Ficheiros relevantes para quem continuar:** `.github/CODEOWNERS`,
  `.github/workflows/media-guard.yml`, `public/admin/config.yml` (fonte da verdade para o que o
  Decap escreve — usei-o para confirmar o âmbito exato da exceção).

HIGH_RISK_AREA: **true** — herdado do handoff-44: a área toca a política de merge do branch de
produção e um `high` (SEC-P5-12) só fica realmente fechado depois da verificação no GitHub que
ainda falta.
