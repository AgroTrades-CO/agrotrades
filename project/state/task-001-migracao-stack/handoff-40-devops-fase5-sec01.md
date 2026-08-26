# Handoff 40 — DevOps Engineer — Fase 5 (fecho de configuração do SEC-01)

**Task:** 001-migracao-stack
**Agente:** devops-engineer
**Âmbito:** as 4 verificações pedidas em `handoff-39-security-engineer-fase5.md` (secção "SEC-01
(herdado, high)" e SEC-P5-08), para permitir ao security-engineer fechar SEC-01 com prova
reproduzível.

---

STATUS: BLOCKED

---

SUMMARY:

Não tenho, neste ambiente de execução, credenciais nem sessão autenticada contra a conta/organização
Vercel deste projeto — nem `VERCEL_TOKEN`, nem uma sessão de login prévia (`vercel whoami` devolve
"Logged out"), nem um `.vercel/project.json` de link local ao projeto. Não tenho acesso ao painel web
da Vercel (não é uma ferramenta que me esteja disponível). Como resultado:

- **Ponto 1 (confirmar Production-only dos dois segredos) — NÃO EXECUTADO.** Não consigo listar
  environment variables sem autenticação.
- **Ponto 2 (remover de Preview se necessário) — NÃO EXECUTADO**, pela mesma razão. Não tenho
  autoridade nem acesso para o fazer a partir deste ambiente.
- **Ponto 3 (confirmar `npm ci` no build da Vercel) — PARCIALMENTE VERIFICADO por código-fonte,
  NÃO CONFIRMADO no painel.** Ver VALIDATIONS.
- **Ponto 4 (necessidade de preview funcional de `/admin`) — VERIFICADO por código-fonte e registado
  como recomendação abaixo.**

Isto **não fecha** o SEC-01. Continua `high`, continua a bloquear deploy num origin real, exatamente
como o security-engineer deixou escrito. Não posso apresentar "está feito" sem prova — seria
precisamente o que o security-engineer explicitamente recusou aceitar.

---

ARTIFACTS:

- `project/state/task-001-migracao-stack/handoff-40-devops-fase5-sec01.md` (este ficheiro)
- Nenhum ficheiro de configuração ou de código alterado.
- Nenhuma variável de ambiente Vercel foi lida, criada, alterada ou removida (não consegui autenticar).

---

VALIDATIONS

### Tentativa de acesso à Vercel — evidência da falha de autenticação

Comando executado (via `npx vercel`, CLI instalado on-demand porque não estava disponível
localmente):

```
$ npx vercel whoami
Vercel CLI 59.5.0 (Node.js 24.16.0)
Error: Worker timed out after 10 seconds
> Logged out.
> Run `vercel deploy --temporary` to create a temporary deployment you can claim later, or `vercel login` to log in.
```

Verificações complementares, todas negativas:

```
$ env | grep -i vercel                    -> (vazio; nenhum VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
$ cat ~/.vercel/project.json              -> No such file or directory (projeto nunca foi `vercel link`ado neste ambiente)
$ ls ~/.local/share/com.vercel.cli        -> No such file or directory (nenhuma sessão de login local)
$ find . -maxdepth 1 -iname vercel.json   -> nenhum ficheiro (sem override de Install/Build Command versionado)
```

**Conclusão:** este ambiente de execução não tem, e nunca teve, uma sessão autenticada contra a
Vercel para este projeto. `vercel env ls production|preview|development` não pôde ser corrido. Isto
não é "os segredos estão bem configurados e não os verifiquei" — é "não tenho como olhar para o
painel a partir daqui, ponto".

### Ponto 3 — `npm ci` — verificação parcial por código-fonte

```
$ ls package-lock.json yarn.lock pnpm-lock.yaml
package-lock.json          (existe)
yarn.lock                  -> No such file or directory
pnpm-lock.yaml              -> No such file or directory

$ find . -maxdepth 1 -iname vercel.json
(nenhum resultado — não existe vercel.json no repositório)

$ grep -A6 '"scripts"' package.json
"predev": "node scripts/copy-decap-cms.mjs",
"dev": "next dev",
"prebuild": "node scripts/copy-decap-cms.mjs",
"build": "next build",
"start": "next start",
```

O que isto prova: **não há nenhum override versionado** do Install Command (não existe `vercel.json`
com `installCommand`, nem script customizado que chame `npm install` explicitamente). Um único
lockfile (`package-lock.json`) está presente e commitado — condição necessária para a Vercel
selecionar `npm` como gestor de pacotes em vez de `yarn`/`pnpm`.

O que isto **não prova**: se alguém definiu manualmente, no painel (Project Settings → Build and
Deployment → Install Command), um comando customizado que substitua o automático (ex.: `npm install`
sem `--ci`, ou com `--legacy-peer-deps` que ignoraria o lockfile). Essa definição vive só no painel e
não tem qualquer rasto no repositório. Sem conseguir autenticar, não posso confirmar o valor efetivo
usado no build.

### Ponto 4 — preview funcional de `/admin`: é necessário para este projeto?

`public/admin/config.yml:23`: `base_url: https://agrotrades.co.mz` — valor estático, único, de
produção. Confirmado por leitura direta do ficheiro (linhas 9–23), com o próprio comentário do
developer a documentar a fragilidade: "Este ficheiro estático não pode ler variáveis de ambiente;
manter os dois sincronizados é responsabilidade de quem faz o deploy".

`handoff-03-security-engineer-preview.md:308` regista que o plano do projeto é "as Fases 1-6 correm
em *deploy preview* da Vercel" — ou seja, **todo o desenvolvimento e validação funcional até agora
passou por Preview**, incluindo as fases anteriores. Isso é routing/UI geral do site, servido em
qualquer preview sem configuração adicional porque não depende de segredos OAuth.

`/admin` é diferente: só funciona (login OAuth completo) num ambiente cujo `OAUTH_ALLOWED_ORIGIN` e
cujo `config.yml:base_url` coincidam byte a byte, e cujos segredos existam nesse ambiente. Hoje,
**nenhum Preview cumpre isso** — `base_url` está fixo em produção, e não há prova (nem indicação) de
que exista uma segunda GitHub OAuth App dedicada a Preview/sandbox, como o `handoff-03` (SEC-06,
linhas 306–328) recomendava desde a fase de desenho.

**Registo, não decisão:** não encontrei, em nenhum handoff até este ponto (incluindo requirements.md
e o architecture-proposal), um requisito explícito de que editores precisem de testar `/admin` num
ambiente de Preview antes de o testarem em Produção. Se essa necessidade não existir formalmente, o
comportamento atual — `/admin` simplesmente não funciona em nenhum Preview, porque `base_url` não
bate certo com o origin efémero — **é uma mitigação aceitável por omissão** para o vetor SEC-01: um
editor com push para um branch não consegue provar que um segredo vazou através de um route handler
em Preview, porque para além do segredo ele precisaria de reescrever `config.yml` no próprio branch
para apontar `base_url` para esse preview — o que é um ato deliberado e visível em `git diff`, não
um acidente de configuração. Isto **reduz** a superfície do SEC-01 mas **não a fecha**: o segredo,
se estiver presente no ambiente Preview, continua acessível via qualquer route handler trivial, com
ou sem o `/admin` do Decap funcionar — o ataque descrito no handoff-39 não depende do Decap, só de o
segredo estar no `process.env` desse deployment.

Decisão formal sobre gerar `config.yml` dinamicamente a partir de `OAUTH_ALLOWED_ORIGIN` (a proposta
do developer, citada no handoff-39) continua, como lá está escrito, do Architect e do DevOps —
não a tomo aqui, só confirmo que nada a torna urgente se não houver requisito de preview funcional.

---

ISSUES

| Ref | Severidade | Título |
|---|---|---|
| SEC-01 (herdado) | **high** | Continua sem prova de que os segredos existem apenas em Production — este handoff não a produz |
| DEVOPS-01 | — | Este ambiente de execução não tem acesso autenticado à Vercel; a verificação exige um operador humano com a sessão/token corretos |
| SEC-P5-08 | low (herdado) | `npm ci` no build da Vercel: sem override no repositório (bom sinal), mas o valor efetivo do painel não pôde ser confirmado |

---

BLOCKERS:

- **Acesso.** Não tenho `VERCEL_TOKEN`, sessão de `vercel login`, nem acesso ao painel web da Vercel
  neste ambiente. Sem um destes, não consigo executar `vercel env ls` nem inspecionar
  Project Settings → Environment Variables / Build and Deployment.
- Isto bloqueia o fecho de SEC-01 e a confirmação definitiva de SEC-P5-08 (Install Command efetivo).
- **Não bloqueia** o resto do fluxo (tester/code-reviewer podem prosseguir com o código da Fase 5,
  como o próprio security-engineer já autorizou). Bloqueia especificamente **o deploy num origin
  real** e o gate de release.

---

REQUIRED_NEXT_ACTION:

Alguém com acesso humano ao painel da Vercel (ou um `VERCEL_TOKEN` válido fornecido a este ambiente)
precisa de executar o seguinte e colar o resultado literal num próximo handoff, para o
security-engineer revalidar:

1. **Autenticar:**
   ```
   npx vercel login
   npx vercel link        # ligar este diretório ao projeto correto na Vercel
   ```

2. **Listar as environment variables por ambiente** (prova reproduzível pedida):
   ```
   npx vercel env ls production
   npx vercel env ls preview
   npx vercel env ls development
   ```
   Confirmar que `GITHUB_OAUTH_CLIENT_SECRET` e `SESSION_SECRET` aparecem **apenas** na listagem de
   `production` e em **nenhuma** das outras duas. `GITHUB_OAUTH_CLIENT_ID` e `OAUTH_ALLOWED_ORIGIN`
   podem legitimamente existir também em `preview`/`development` (não são segredos, ou são valores de
   sandbox distintos) — o que não pode acontecer é o client secret ou o session secret aparecerem
   fora de Production.

3. **Se aparecerem em Preview ou Development:** removê-los desses ambientes.
   ```
   npx vercel env rm GITHUB_OAUTH_CLIENT_SECRET preview
   npx vercel env rm SESSION_SECRET preview
   # repetir para "development" se aplicável
   ```
   Depois voltar a correr o passo 2 para confirmar a remoção, e colar o resultado "depois" a par do
   "antes" no handoff seguinte — isso é a prova reproduzível.

4. **Confirmar o Install Command efetivo no painel:** Project Settings → Build and Deployment →
   Install Command. Confirmar que está em "Override: OFF" (comando automático da Vercel, que para
   npm com `package-lock.json` presente resolve para `npm ci`) ou, se houver override manual, que o
   comando escrito literalmente contém `npm ci` e não `npm install`. Copiar o valor exato do campo
   para o próximo handoff.

5. Só depois de 2–4 estarem feitos e documentados com output literal, o `security-engineer` pode
   revalidar e fechar SEC-01.

---

CONTEXT_FOR_NEXT_AGENT:

- **Para o Orchestrator:** isto é um `BLOCKED` por falta de acesso, não por decisão técnica. Segundo
  a regra 3 do CLAUDE.md ("Se um subagente reportar BLOCKED por razão não coberta na secção 4, pára e
  explica ao utilizador em vez de decidir sozinho"), isto deve ser levado ao utilizador: a verificação
  do SEC-01 exige credenciais/acesso Vercel que não estão disponíveis neste ambiente de execução do
  agente. Além disso, SEC-01 é achado herdado `high` — a secção 4 do CLAUDE.md já obriga confirmação
  humana sempre que o security-engineer reporta `high`/`critical`, independentemente deste bloqueio.
- **O que fica confirmado, e não precisa de ser repetido:** não existe `vercel.json` no repositório
  nem qualquer script que sobreponha o Install Command; existe um único lockfile
  (`package-lock.json`), condição necessária (mas não suficiente sozinha) para `npm ci` automático.
  `public/admin/config.yml:base_url` está fixo em `https://agrotrades.co.mz`, o que por si só já
  impede qualquer preview de ter `/admin` funcional sem alteração manual e visível do ficheiro nesse
  branch — reduz mas não fecha o SEC-01.
- **O que continua totalmente por provar:** o estado real das environment variables no painel Vercel,
  para os quatro ambientes relevantes (Production, Preview, Development, e a variável
  `OAUTH_ALLOWED_ORIGIN`/`GITHUB_OAUTH_CLIENT_ID` que podem legitimamente variar por ambiente).
- **Para quem retomar este handoff com acesso:** os comandos exatos a correr estão na secção
  REQUIRED_NEXT_ACTION; basta colar os outputs literais. Não é necessário voltar a ler todo o
  handoff-39 — a secção "SEC-01 (herdado, high)" de lá e este ficheiro já resumem o que falta.
