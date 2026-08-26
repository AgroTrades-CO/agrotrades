STATUS: COMPLETED
SUMMARY: Corrigido `next.config.mjs` para que `script-src` inclua `'unsafe-eval'` apenas quando
`process.env.NODE_ENV !== "production"`. Adicionada variável `isDev` dentro de `headers()` e a
diretiva `script-src` passou a ser construída dinamicamente (`'self' 'unsafe-inline'` mais
`'unsafe-eval'` só em dev). Acrescentado comentário curto acima da definição de `isDev` explicando
que o Next.js/Turbopack usa `eval()` em dev para Fast Refresh/debugging e nunca em produção. Nada
mais no ficheiro foi alterado (redirects, restante CSP, comentários pré-existentes mantidos
intactos).

ARTIFACTS:
- C:\Users\virgilio.jose\source\repos\agrotrades\next.config.mjs (alterado — único ficheiro tocado)

VALIDATIONS:
- Reproduzi o cenário: antes da correção, o header CSP em dev não continha `unsafe-eval` (era
  idêntico ao de produção), o que explicava o erro reportado no browser.
- Após a correção: parei todos os processos node residuais, corri `npm run dev` limpo (porta 3000)
  e confirmei via `curl -sI http://localhost:3000/` que o header `Content-Security-Policy` contém
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`.
- Corri `npm run build` (sucesso, TypeScript e geração de páginas estáticas OK, sem erros) seguido
  de `npm run start` e confirmei via `curl -sI http://localhost:3000/` que o header
  `Content-Security-Policy` em produção é exatamente:
  `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
  https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;
  connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors
  'none'; upgrade-insecure-requests` — idêntico ao valor original antes da alteração, sem
  `unsafe-eval`.
- Servidores dev/start parados no fim da validação (taskkill node.exe).

ISSUES: Nenhum problema fora do âmbito encontrado durante esta correção.

BLOCKERS: Nenhum. Não foi tocado nenhum dos sinais de risco (autenticação, dados pessoais,
integração bancária, schema de produção, contrato de API de cliente).

REQUIRED_NEXT_ACTION: Tester deve validar: (1) `npm run dev` sem o erro de eval() no browser
(consola limpa, Fast Refresh a funcionar); (2) confirmar que a CSP de produção (`npm run build &&
npm run start`) permanece byte-a-byte igual à CSP documentada antes desta alteração (sem
`unsafe-eval`); (3) confirmar que nenhuma outra parte de `next.config.mjs` foi alterada (redirects,
restantes headers de segurança, comentários da Fase 4/Fase 5).

CONTEXT_FOR_NEXT_AGENT: A alteração está isolada ao bloco `async headers()` em
next.config.mjs — foi introduzida uma constante `isDev = process.env.NODE_ENV !== "production"` e
a linha `script-src` passou de string fixa para template string condicional. Não foi necessário
adicionar/alterar variáveis de ambiente nem ficheiros `.env`; `NODE_ENV` já é definido
automaticamente pelo Next.js consoante o comando (`dev` vs `build`/`start`). Ambos os testes de
validação foram feitos localmente com `curl -I`, não por inspeção manual do browser — se o Tester
quiser confirmar visualmente o erro de eval() desapareceu na consola do browser, deve correr `npm
run dev` e abrir localhost:3000 diretamente.
