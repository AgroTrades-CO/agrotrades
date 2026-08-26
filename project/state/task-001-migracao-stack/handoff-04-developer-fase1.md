STATUS: COMPLETED
SUMMARY: Implementada a Fase 1 da migração (fundação Next.js + paridade visual da homepage em
PT). Projeto Next.js (App Router, TypeScript) inicializado na raiz do repositório (sem
subdiretório aninhado). Repositório Git criado, remote `origin` apontado para
https://github.com/AgroTrades/agrotrades.git, `.gitignore` (com `.env*`, `node_modules`, `.next`)
criado ANTES do primeiro commit, commit inicial feito e enviado para `main`. CSS portado para
`app/globals.css`, preservando todas as variáveis de cor e a tipografia (Playfair Display + DM
Sans), com as fontes carregadas via `<link rel="preconnect">` + `<link rel="stylesheet">` no
`<head>` de `app/layout.tsx` (nunca `@import` no CSS, conforme a precedência da variante
AvaliacaoAgroTrades). Layout base construído: `components/Header.tsx` (nav com
Início/Serviços/Campanha 2025/26/Contactos, seletor PT/EN — EN desativado nesta fase, é Fase 3),
`components/Footer.tsx`, `components/WhatsappFloat.tsx` (link direto para
https://wa.me/258841031220, sem formulário). Homepage (`app/page.tsx`) construída em PT com
paridade visual ao `index.html` atual: hero, stats bar, about, preview de serviços (4 cards),
banner da campanha, localizações. Todos os emojis do design original (🌾🚜🌽🏭📍🏢🌿) foram
substituídos por ícones SVG inline próprios (`components/icons.tsx`), mantendo a paleta
verde/laranja — nenhum caractere emoji ficou no código, no texto visível nem nos commits
(confirmado por grep de intervalos Unicode de emoji no código-fonte e no HTML servido). A pasta
espúria `{css,js,images,pages}/` foi removida. O texto continua embutido no template, conforme
âmbito desta fase (extração para `content/` é Fase 2).
ARTIFACTS:
  Criados: package.json, tsconfig.json, next.config.mjs, next-env.d.ts, .eslintrc.json,
  .gitignore, app/layout.tsx, app/page.tsx, app/globals.css, components/Header.tsx,
  components/Footer.tsx, components/WhatsappFloat.tsx, components/icons.tsx,
  public/images/logo.jpeg (cópia de images/logo.jpeg para servir via Next.js).
  Removidos: pasta espúria `{css,js,images,pages}/`.
  Inicializados: repositório Git local (.git), remote `origin`, branch `main` (push feito).
  Preservados intactos, como referência para fases futuras (Fase 2/3 precisam deles — não
  apagar): index.html, servicos.html, servico.html, campanha.html, contactos.html, css/,
  js/main.js (array SERVICES e translations — copy de referência para Fase 2/3), netlify.toml,
  robots.txt, sitemap.xml, AvaliacaoAgroTrades/ (referência de leitura, nunca publicada).
VALIDATIONS:
  - `npm install` sem erros bloqueantes (apenas avisos habituais de peer-deps/deprecation do
    ecossistema npm, sem impacto funcional).
  - `npm run build` (Next.js 16, Turbopack) concluído com sucesso, sem erros de TypeScript nem de
    build, gerando `/` e `/_not-found` como conteúdo estático.
  - `npm run start` com o build de produção: `curl http://localhost:3000/` devolveu HTTP 200 e
    HTML válido; processo terminado no fim do teste.
  - Grep por intervalos Unicode de emoji (`\x{1F300}-\x{1FAFF}`, `\x{2600}-\x{27BF}`) em
    `app/`, `components/` e no HTML servido: zero ocorrências.
  - `git status` após `git add -A` confirmou que `node_modules/` e `.next/` NÃO foram staged
    (`.gitignore` eficaz antes do primeiro commit); nenhum ficheiro `.env*` existe no projeto
    nesta fase.
  - Push para `origin/main` bem-sucedido (branch nova criada no remoto).
ISSUES:
  - Não corrigido (fora do âmbito desta fase, registo para o Orchestrator): a nav do Header e o
    footer já apontam para rotas `/servicos`, `/campanha`, `/contactos` e `/servicos/:id` que
    ainda não existem (ficam 404 no preview) — isso é esperado e cai na Fase 3 (rotas completas),
    conforme o plano faseado da arquitetura. Sinalizo para o Tester não reportar isto como bug da
    Fase 1.
  - O ficheiro `package-lock.json` foi comitado (prática padrão para reprodutibilidade de
    build); não há segredos nele.
  - Detetado, mas não tocado: existe um `package-lock.json` órfão em
    `C:\Users\virgilio.jose\package-lock.json` (fora do repositório) que inicialmente fazia o
    Turbopack tentar resolver a raiz do workspace incorretamente. Mitigado dentro do projeto via
    `turbopack.root` em `next.config.mjs`, sem tocar em nada fora do repositório.
BLOCKERS: Nenhum.
REQUIRED_NEXT_ACTION: Próximo agente é o `tester`. Deve validar: (1) `npm run build` e
`npm run dev`/`npm run start` sem erros; (2) paridade visual da homepage em `/` face ao
`index.html` original (desktop e mobile, incluindo breakpoint 768px), usando o `index.html` da
raiz como referência lado a lado; (3) paleta de cores e tipografia computadas correspondem
exatamente às variáveis `--green`, `--green-dark`, `--green-light`, `--orange`, `--orange-dark`,
`--orange-light`, `--earth` e a Playfair Display + DM Sans carregadas via `<link>` (nunca
`@import`); (4) o botão flutuante de WhatsApp e o botão do hero abrem
`https://wa.me/258841031220`; (5) confirmar ausência total de emojis (código e visual); (6)
confirmar que a pasta espúria foi removida e que não há segredos nem `.env*` comitados. Após o
Tester aprovar, o Orchestrator deve pedir aceitação humana explícita do preview visual (conforme
o plano faseado, Fase 1 tem gate de decisão humana).
CONTEXT_FOR_NEXT_AGENT: O servidor de dev não está a correr — o Tester deve arrancar com
`npm run dev` (porta 3000 por defeito) dentro de
`C:\Users\virgilio.jose\source\repos\agrotrades`, ou `npm run build && npm run start` para testar
o build de produção. Os links de navegação para /servicos, /campanha, /contactos e
/servicos/:id vão dar 404 propositadamente (rotas de fases futuras) — não é regressão desta
fase, só a homepage "/" está no âmbito. O ficheiro de referência visual é
`index.html`/`css/style.css` na raiz do repo (mantidos intactos). Nenhuma variável de ambiente
foi introduzida nesta fase. Nenhuma dependência nova além de `next`, `react`, `react-dom` e
ferramentas de dev (`typescript`, `eslint`, `eslint-config-next`, tipos) — sem serviços externos
com custo.
