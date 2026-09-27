# task-003-eslint-flat-config — handoff-02-developer

STATUS: COMPLETED

SUMMARY:
Aplicada a decisão do utilizador (opção C, `decisions.md`): devDependency `typescript` alterada de
`7.0.2` para `6.0.3` (versão exata) em `package.json` e corrido `npm install` no repositório real.
Antes do install confirmei que nenhum processo node estava a usar o `node_modules` deste projeto
(os processos ativos eram de outros repositórios). Com TS 6.0.3, `eslint.config.mjs` (criado no
handoff-01, sem alterações) carrega e o lint corre; `tsc --noEmit` e `next build` passam.
Os problemas de lint NÃO foram corrigidos (ficam para a task-014) e estão listados em ISSUES.

ARTIFACTS:
- ALTERADO `package.json` — só `"typescript": "7.0.2"` -> `"typescript": "6.0.3"`.
- ALTERADO `package-lock.json` — só alterações ligadas ao TypeScript: raiz `typescript` 6.0.3;
  entrada `node_modules/typescript` 6.0.3 (bin `tsc`/`tsserver`); removidos os 20 pacotes opcionais
  por plataforma do TS 7 (`@typescript/typescript-<os>-<cpu>` 7.0.2). Nenhuma outra dependência mudou
  ("removed 1 package, changed 1 package" no install local).
- `node_modules` atualizado; postinstall (`scripts/copy-decap-cms.mjs`) correu: 95 ficheiros em
  `public/admin/vendor/` (ignorado pelo git).
- `next-env.d.ts` foi reescrito pelo `next build` (caminhos `.next/dev/types` -> `.next/types`);
  reposto com `git checkout -- next-env.d.ts` porque estava limpo antes e não faz parte desta tarefa.
- CRIADO este handoff.
- Não mexi nas alterações das task-006/task-007 na working tree. Sem commit. Não arranquei servidores
  (só `next build`, que termina sozinho); nenhum processo node do projeto ficou ativo.

VALIDATIONS:
- `npm install` -> exit 0.
- `npm ls typescript` -> exit 0, sem "invalid"; `typescript@6.0.3` na raiz e deduped em
  `eslint-config-next` / `typescript-eslint@8.67.0` e subpacotes.
- `npx tsc --version` -> 6.0.3; `npx tsc --noEmit` -> exit 0 (o erro `@/lib/auth/session` do
  handoff-01 já não ocorre, a task-007 atualizou os imports entretanto).
- `npm run lint` (`eslint .`) -> a config `eslint.config.mjs` carrega; 7 problemas (4 erros,
  3 warnings), exit 1 (esperado enquanto a task-014 não corrigir os erros).
- `npm run build` -> exit 0, com `CONTACT_DELIVERY_MODE=dry-run`, `TURNSTILE_SITE_KEY` e
  `TURNSTILE_SECRET_KEY` de TESTE da Cloudflare definidas só no ambiente do processo do comando
  (nenhum ficheiro alterado). Next 16.3.2 (Turbopack): compilação OK, "Running TypeScript" OK
  (6.4 s), 30 páginas estáticas geradas, rotas `/api/auth`, `/api/auth/callback`, `/api/contact`
  dinâmicas. Nota: existe um `.env.local` na raiz que o Next também carregou ("Environments:
  .env.local"); não o li nem alterei — as variáveis do processo têm precedência.

ISSUES:
1. Problemas de lint atuais (não corrigidos, para a task-014). Iguais em número, localização e regra
   aos do handoff-01 — as alterações das task-006/007 não introduziram nem removeram problemas:
   - `app/not-found.tsx:66:9` — error — `@next/next/no-html-link-for-pages` (`<a href="/">` em vez de `<Link>`).
   - `components/Header.tsx:56:16` — error — `react-hooks/set-state-in-effect` (`setServicesOpen(false)` dentro de `useEffect`).
   - `components/HeroSlider.tsx:41:5` — error — `react-hooks/set-state-in-effect` (`setReducedMotion(mql.matches)` dentro de `useEffect`).
   - `components/pages/ServiceDetailContent.tsx:119:23` — error — `react-hooks/immutability` (reatribuição de `splitCount` durante o render).
   - `app/(pt)/layout.tsx:32:9` — warning — `@next/next/no-page-custom-font`.
   - `app/en/layout.tsx:28:9` — warning — `@next/next/no-page-custom-font`.
   - `components/OrganizationJsonLd.tsx:32:7` — warning — diretiva `eslint-disable` não usada (`react/no-danger`); corrigível com `--fix`.
   Os ficheiros das task-006/007 (`components/ContactForm.tsx`, `app/api/contact/route.ts`,
   `lib/contact/*`, `lib/auth/*`, `app/api/auth/*`) não geram problemas.
2. `npm install` reporta 14 vulnerabilidades (4 moderate, 9 high, 1 critical) no `npm audit`. Não
   são introduzidas por esta alteração (o único pacote alterado é o `typescript`); não investigado
   nem corrigido (fora de âmbito). Candidato a uma security-review/tarefa própria.
3. Aviso de ambiente sem impacto: `npm warn Unknown user config "python"` (config npm do utilizador).
4. Quando o `typescript-eslint` suportar TS >= 7 (issue typescript-eslint#10940), voltar ao TS 7,
   conforme `decisions.md`.

BLOCKERS:
Nenhum.

REQUIRED_NEXT_ACTION:
Orchestrator: tarefa TRIVIAL concluída; `code-reviewer` opcional (diff: `package.json`,
`package-lock.json`, `eslint.config.mjs`, remoção de `.eslintrc.json`). Criar/avançar a task-014
(correção dos 4 erros e 3 warnings de lint) antes de o CI (task-004) exigir lint limpo. Decidir se
o `npm audit` (ISSUE 2) merece uma tarefa de security-review.

CONTEXT_FOR_NEXT_AGENT:
- Lint: `npm run lint` = `eslint .` (flat config, `next lint` foi removido no Next 16). Config em
  `eslint.config.mjs` (core-web-vitals + typescript de `eslint-config-next`, `globalIgnores`).
- Build local precisa de `CONTACT_DELIVERY_MODE=dry-run` e das chaves de teste Turnstile (bloco de
  desenvolvimento local em `.env.example`), ou de um `.env.local` com elas.
- `next build` reescreve `next-env.d.ts` (`.next/types`), `next dev` volta a pô-lo com
  `.next/dev/types`; não commitar essa oscilação por engano.
- Commit por fazer: incluir `package.json`, `package-lock.json`, `eslint.config.mjs`, a remoção de
  `.eslintrc.json` e os ficheiros de `project/state/task-003-eslint-flat-config/`, separado das
  alterações das outras tarefas.
