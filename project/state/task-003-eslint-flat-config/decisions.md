# task-003-eslint-flat-config — decisões

## 2026-09-26 — bloqueio TypeScript 7 vs typescript-eslint

handoff-01-developer.md reportou BLOCKED: `typescript` 7.0.2 incompatível com `typescript-eslint`
8.67.0 (dependência de `eslint-config-next` 16.3.2, peer `typescript >=4.8.4 <6.1.0`).

Decisão do utilizador: **baixar `typescript` para 6.0.3** (opção C, validada pelo developer numa
cópia isolada: tsc, eslint e next build passam). Voltar ao TS 7 quando o typescript-eslint o suportar.

Execução: o `npm install` só corre quando nenhuma outra tarefa estiver a meio de validar com o
`node_modules` partilhado (depois do developer da task-007 terminar).

Os 4 erros e 3 warnings de lint encontrados ficam para uma tarefa separada
(task-014-lint-errors, bug-fix SMALL), para o CI (task-004) poder exigir lint limpo.
