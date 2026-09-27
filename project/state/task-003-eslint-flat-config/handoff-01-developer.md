# task-003-eslint-flat-config — handoff-01-developer

STATUS: BLOCKED

SUMMARY:
Criado `eslint.config.mjs` (flat config) segundo a documentação instalada
(`node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md`, secções "Setup ESLint"
e "With TypeScript"): `...nextVitals` (`eslint-config-next/core-web-vitals`) + `...nextTs`
(`eslint-config-next/typescript`) + `globalIgnores([...])`. Removido `.eslintrc.json` (apagado na
working tree, não staged). A config está correta, mas NÃO carrega no projeto real por uma
incompatibilidade de dependências que não é resolúvel só com configuração:

- O projeto tem `typescript` 7.0.2 (devDependency fixada desde o commit 98fc350, Fase 1).
- `eslint-config-next@16.3.2` depende de `typescript-eslint@8.67.0`, cujo peer é
  `typescript ">=4.8.4 <6.1.0"` e que lança explicitamente
  `Error: typescript-eslint does not support TS 7.0.` ao ser carregado.
- O `dist/index.js` de `eslint-config-next` (base de `core-web-vitals`) faz `require("typescript-eslint")`
  no topo, portanto QUALQUER variante de `eslint-config-next` falha, não só a de TypeScript.
- `npm ls typescript` já reporta hoje `ELSPROBLEMS ... typescript@7.0.2 invalid` (peer não satisfeito).

Resolver exige alterar a versão de uma dependência existente (TypeScript), o que muda também a
toolchain de type-check do `next build`. Isso está fora do âmbito autorizado para esta tarefa
TRIVIAL ("não adicionar dependências salvo estritamente necessário"), por isso parei e não
alterei `package.json`/`package-lock.json`/`node_modules` do projeto. Testei as alternativas numa
cópia isolada no scratchpad (resultados em VALIDATIONS) para a decisão ser tomada com evidência.

ARTIFACTS:
- CRIADO `eslint.config.mjs` (raiz) — core-web-vitals + typescript de eslint-config-next; ignores:
  `.next/**`, `out/**`, `build/**`, `next-env.d.ts` (defaults de eslint-config-next, repostos),
  `node_modules/**`, `public/admin/vendor/**`, `AvaliacaoAgroTrades/**`, `js/**`, `css/**`, `*.html`
  (só raiz; `.html` não é linted por omissão de qualquer forma).
- REMOVIDO `.eslintrc.json` (unstaged; `git status` mostra ` D .eslintrc.json`).
- CRIADO este handoff.
- Nenhuma alteração a `package.json`, `package-lock.json`, `node_modules`, nem a
  `components/ContactForm.tsx`. Sem commit.

VALIDATIONS:
Projeto real (estado atual):
- `npm run lint` -> FALHA (exit 2) ao carregar a config: "typescript-eslint does not support TS 7.0."
- `npx tsc --noEmit` -> FALHA (exit 1), mas por causa alheia a esta tarefa:
  `app/api/auth/callback/route.ts(5,36): error TS2307: Cannot find module '@/lib/auth/session'`.
  `lib/auth/session.ts` aparece como apagado (` D`) na working tree e `lib/auth/oauthState.ts`
  modificado — trabalho em curso de outra tarefa paralela (provavelmente
  task-007-remove-unused-session). Não mexi.

Cópia isolada no scratchpad (package.json/lock, config, app/, components/, lib/, content/, scripts/,
public/ copiados do projeto nesse momento, incluindo `lib/auth/session.ts` ainda presente):
- Opção A — `overrides` npm a forçar TS6 só dentro de `eslint-config-next`:
  `npm install` -> ERESOLVE ("Conflicting peer dependency"). Inviável (peer deps não aninham).
- Opção B — setup oficial "side by side" do anúncio do TS 7
  (`"typescript": "npm:@typescript/typescript6@6.0.2"`, `"@typescript/native": "npm:typescript@7.0.2"`):
  `npx tsc --noEmit` OK (TS 7.0.2), `eslint .` carrega OK, MAS `npm run build` FALHA:
  "It looks like you're trying to use TypeScript but do not have the required package(s) installed".
  Causa: Next 16.3.2 usa por omissão `experimental.useTypeScriptCli: true` e exige
  `typescript/bin/tsc`; o pacote `@typescript/typescript6` só tem `bin/tsc6`. Poderia funcionar
  com `experimental.useTypeScriptCli: false` em `next.config.mjs` (Next usa então a API TS6), mas
  isso não foi testado e implica também alterar configuração de build.
- Opção C — downgrade simples `"typescript": "6.0.3"` (última 6.0.x; dentro do peer `<6.1.0`;
  Next 16.3.2 suporta TS >= 5.1 e a própria mensagem de erro do Next sugere "install TypeScript 6"):
  `npm ls typescript` sem "invalid"; `npx tsc --noEmit` exit 0 (Version 6.0.3);
  `eslint .` carrega a config e lint corre (7 problemas, ver ISSUES);
  `npm run build` OK (todas as rotas geradas). É a opção que recomendo.
- Ignores confirmados com `ESLint#isPathIgnored` (opção C): ignorados `index.html`,
  `public/admin/index.html`, `js/main.js`, `css/style.css`, `public/admin/vendor/*`,
  `AvaliacaoAgroTrades/*`, `next-env.d.ts`, `node_modules/*`; incluídos `app/**`, `components/**`,
  `content/**`, `lib/**`, `scripts/copy-decap-cms.mjs`, `next.config.mjs`, `eslint.config.mjs`
  (53 ficheiros linted).

ISSUES:
1. Bloqueador de dependências descrito acima (TypeScript 7.0.2 vs typescript-eslint <6.1.0).
2. Problemas de lint reportados na cópia do scratchpad (config da opção C). Não corrigidos, como
   pedido. Linhas relativas ao código no momento da cópia:
   - `app/not-found.tsx:66:9` — error — `@next/next/no-html-link-for-pages` (`<a href="/">` em vez de `<Link>`).
   - `components/Header.tsx:56:16` — error — `react-hooks/set-state-in-effect` (`setServicesOpen(false)` dentro de `useEffect`).
   - `components/HeroSlider.tsx:41:5` — error — `react-hooks/set-state-in-effect` (`setReducedMotion(mql.matches)` dentro de `useEffect`).
   - `components/pages/ServiceDetailContent.tsx:119:23` — error — `react-hooks/immutability` (reatribuição de `splitCount` durante o render).
   - `app/(pt)/layout.tsx:32:9` — warning — `@next/next/no-page-custom-font`.
   - `app/en/layout.tsx:28:9` — warning — `@next/next/no-page-custom-font`.
   - `components/OrganizationJsonLd.tsx:32:7` — warning — diretiva `eslint-disable` não usada (`react/no-danger`).
   Total: 7 problemas (4 erros, 3 warnings). Com os 4 erros, `npm run lint` termina com exit 1 mesmo
   depois de resolvido o bloqueador — relevante se o lint for posto em CI.
   `components/ContactForm.tsx` não gerou nenhum problema na versão copiada (não foi editado).
3. `npx tsc --noEmit` no projeto real falha por `@/lib/auth/session` em falta — causado por trabalho
   paralelo noutra tarefa, não por esta.
4. `.eslintrc.json` já está removido; enquanto o bloqueador não for resolvido, o lint continua sem
   funcionar (tal como antes desta tarefa — não há regressão).

BLOCKERS:
Decisão necessária (Orchestrator/utilizador, eventualmente com `software-architect`/`devops-engineer`,
por alterar a toolchain do build) sobre a versão de TypeScript:
- Recomendado: opção C — alterar devDependency `typescript` de `7.0.2` para `6.0.3` e correr
  `npm install` (atualiza `package-lock.json`). Validado: tsc, lint e `next build` OK.
- Alternativa: opção B + `experimental.useTypeScriptCli: false` em `next.config.mjs` (mantém `tsc` 7
  para uso manual, Next e typescript-eslint usam a API TS6) — não validada, mais complexa.
- Alternativa: adiar o lint até `typescript-eslint` suportar TS >= 7.1
  (https://github.com/typescript-eslint/typescript-eslint/issues/10940).
Nota: correr `npm install` no repositório real mexe em `node_modules` partilhado com as tarefas
paralelas em curso — convém fazê-lo quando essas tarefas não estiverem a meio de validações.

REQUIRED_NEXT_ACTION:
Orchestrator: apresentar a decisão sobre a versão de TypeScript ao utilizador. Se aprovada a opção C,
o `developer` altera `package.json` (`"typescript": "6.0.3"`), corre `npm install`, e revalida
`npm run lint` (esperado: config carrega, 7 problemas listados acima), `npx tsc --noEmit` e
`npm run build`. A correção dos 4 erros de lint deve ser uma tarefa separada.

CONTEXT_FOR_NEXT_AGENT:
- `eslint.config.mjs` já está pronto e não precisa de alterações para a opção C.
- Documentação usada: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md`.
  `next lint` foi removido no Next 16; o lint é `eslint .` (script `lint` já correto).
- `globalIgnores` substitui os ignores por omissão de `eslint-config-next/typescript`, por isso
  `.next/**`, `out/**`, `build/**`, `next-env.d.ts` foram repostos explicitamente (como na doc).
- Deteção de TS pelo Next: `node_modules/next/dist/lib/verify-typescript-setup.js` e
  `node_modules/next/dist/lib/typescript/runTypeScriptCli.js` (modo CLI por omissão, exige
  `typescript/bin/tsc`; modo API exige `typescript/lib/typescript.js`).
- Cópia de testes (descartável): scratchpad da sessão, pasta `lintA` (atualmente com typescript 6.0.3).
- Não editar `components/ContactForm.tsx` (outra tarefa em paralelo); `lib/auth/*` também está a ser
  alterado por outra tarefa.
