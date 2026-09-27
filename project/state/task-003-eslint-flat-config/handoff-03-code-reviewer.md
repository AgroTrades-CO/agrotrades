# task-003-eslint-flat-config — handoff-03-code-reviewer

STATUS: APPROVED

SUMMARY:
Revisão (Gate 5) limitada ao âmbito da task-003: `eslint.config.mjs` (novo), remoção de
`.eslintrc.json` e, em `package.json`/`package-lock.json`, apenas a descida de `typescript`
7.0.2 -> 6.0.3 decidida pelo utilizador (`decisions.md`). A config segue exatamente o exemplo
"With TypeScript" da documentação instalada, o diff das dependências não contém nada além do
TypeScript e `npm run lint` executa com os 7 problemas conhecidos. Sem findings bloqueantes.
As alterações das task-005/006/007/008 presentes na working tree foram ignoradas.

ARTIFACTS:
- CRIADO `project/state/task-003-eslint-flat-config/handoff-03-code-reviewer.md` (este ficheiro).
- CRIADO `project/state/task-003-eslint-flat-config/gates.md`.
- Nenhum ficheiro de código alterado. Sem commit.

VALIDATIONS:
1. `eslint.config.mjs` vs `node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md`
   (secção "With TypeScript", linhas 213-236): mesmos imports (`defineConfig`, `globalIgnores` de
   `eslint/config`; `eslint-config-next/core-web-vitals`; `eslint-config-next/typescript`), mesma
   ordem (`...nextVitals`, `...nextTs`, `globalIgnores`) e os 4 ignores por omissão da doc
   (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`) repostos. OK.
2. Equivalência com o `.eslintrc.json` removido (`{"extends": "next/core-web-vitals"}`, commit
   98fc350): `core-web-vitals` mantém-se; `typescript` é acrescento previsto na doc para projetos
   TS. Sem regressão de regras. OK.
3. Ignores extra: `node_modules/**` (redundante, ESLint já o ignora; inofensivo),
   `public/admin/vendor/**` (bundle Decap CMS gerado, também no `.gitignore`),
   `AvaliacaoAgroTrades/**`, `js/**`, `css/**`, `*.html` (site estático legado na raiz). Todos
   correspondem a pastas/ficheiros existentes na raiz e justificados em comentário. Confirmado por
   CLI: `index.html`, `js/main.js`, `css/style.css` ignorados.
4. `git diff package.json`: uma única linha, `"typescript": "7.0.2"` -> `"typescript": "6.0.3"`
   (versão exata, dentro do peer `>=4.8.4 <6.1.0` do `typescript-eslint@8.67.0`). OK.
5. `git diff package-lock.json` (+7 / -368): raiz `typescript` 6.0.3; entrada
   `node_modules/typescript` passa a 6.0.3 com `resolved`/`integrity` do registo npm oficial e bins
   `tsc`/`tsserver`; removidas as `optionalDependencies` e as 20 entradas
   `node_modules/@typescript/typescript-<os>-<cpu>` 7.0.2. Nenhuma outra entrada adicionada,
   removida ou alterada. OK.
6. `npm run lint` (`eslint .`) -> config carrega, 55 ficheiros analisados, 7 problemas
   (4 erros, 3 warnings), exit 1 — exatamente os listados no handoff-02 (ficam para a task-014).
7. Script `lint` em `package.json` já é `eslint .` (correto para Next 16, sem `next lint`).
8. Não revalidei `tsc --noEmit` nem `next build` (validados pelo developer no handoff-02; fora do
   pedido desta revisão).

ISSUES (não bloqueantes):
1. `project/**` não está ignorado, pelo que scripts auxiliares de outras tarefas entram no lint
   (hoje: `project/state/task-007-remove-unused-session/characterization/characterize-auth.mjs`,
   sem problemas — por isso 55 ficheiros e não os 53 do handoff-01). Decisão consciente ou não, deve
   ser tida em conta quando o CI (task-004) exigir lint limpo; acrescentar `project/**` aos ignores é
   opcional.
2. `*.html` só casa com a raiz (padrão sem `/` em flat config); não tem efeito prático porque o ESLint
   não analisa `.html` sem plugin. O comentário descreve-o corretamente.
3. `node_modules/**` é redundante. Cosmético.
4. `npm audit` com 14 vulnerabilidades (handoff-02, ISSUE 2) não é causado por esta tarefa; merece
   tarefa própria de security-review.
5. Regresso ao TS 7 quando o `typescript-eslint` o suportar (issue typescript-eslint#10940) —
   registado em `decisions.md`.

BLOCKERS:
Nenhum.

REQUIRED_NEXT_ACTION:
Orchestrator: fazer o commit da task-003 separado das restantes tarefas, contendo exatamente:
- `eslint.config.mjs` (novo)
- `.eslintrc.json` (remoção: `git rm .eslintrc.json`)
- `package.json` (só a linha `typescript` 6.0.3; confirmado que é a única alteração no ficheiro)
- `package-lock.json` (só alterações do TypeScript; confirmado que são as únicas no ficheiro)
- `project/state/task-003-eslint-flat-config/decisions.md`
- `project/state/task-003-eslint-flat-config/handoff-01-developer.md`
- `project/state/task-003-eslint-flat-config/handoff-02-developer.md`
- `project/state/task-003-eslint-flat-config/handoff-03-code-reviewer.md`
- `project/state/task-003-eslint-flat-config/gates.md`
Não incluir `next-env.d.ts`, `.env.local`, `tsconfig.tsbuildinfo` nem ficheiros das task-005/006/007/008.
Depois: criar/avançar a task-014 (4 erros + 3 warnings de lint) antes da task-004 (CI).

CONTEXT_FOR_NEXT_AGENT:
- Lint = `npm run lint` (`eslint .`, flat config). Resultado esperado até à task-014: 7 problemas,
  exit 1.
- Se `package.json`/`package-lock.json` forem alterados por outra tarefa antes do commit, voltar a
  confirmar com `git diff` que o diff continua limitado ao TypeScript.
