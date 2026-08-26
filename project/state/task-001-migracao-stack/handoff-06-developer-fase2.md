STATUS: COMPLETED
SUMMARY: Implementada a Fase 2 da migração — camada de conteúdo, sem alteração visual. Criada a
estrutura `content/` na raiz do repositório (idiomático para Next.js App Router; não `src/`, já
que o projeto não usa `src/`): `content/schemas/index.ts` com schemas Zod (todo campo traduzível é
`{pt, en}`, ambos obrigatórios e não vazios, validados no mesmo ficheiro — nunca ficheiros
paralelos por idioma); `content/services/*.json` (8 ficheiros, um por serviço, extraídos do array
`SERVICES` de `js/main.js`, com `icon` como nome de ícone SVG já existente em `components/icons.tsx`
— nunca emoji); `content/site/*.json` (nav, hero, stats, about, team, campanha, locations, contacts,
footer, sections); `content/index.ts` — loader único que importa todos os JSON, valida-os contra os
schemas Zod e exporta objetos tipados (`services`, `nav`, `hero`, `stats`, `about`, `team`,
`campanha`, `locations`, `contacts`, `footer`, `sections`) mais um helper `pick(field, lang)`. A
validação corre ao nível do módulo: como `app/layout.tsx` (usado por todas as rotas) importa
`Header`/`Footer`/`WhatsappFloat`, que por sua vez importam `content/index.ts`, a validação de
TODAS as coleções corre sempre no build, mesmo para as ainda não renderizadas nesta fase (`team`,
`contacts`, `campanha` completo, `sections`). Um erro de validação lança uma `Error` com a lista de
campos inválidos e o ficheiro a corrigir — o `next build` falha com essa mensagem. Componentes
(`Header.tsx`, `Footer.tsx`, `WhatsappFloat.tsx`, `app/page.tsx`) já não têm texto visível
hardcoded: leem de `content/`. Criado `components/icon-map.tsx` (mapa nome-de-ícone -> componente
SVG de `components/icons.tsx`) para os campos `icon` do conteúdo. Criado placeholder neutro
`public/images/team/placeholder.svg` (silhueta simples, sem foto real) para os 3 membros de equipa
placeholder. `zod` (já presente como dependência transitiva via `eslint-config-next`) foi promovido
a dependência direta explícita em `package.json` (versão exacta `4.4.3`, igual à já instalada —
`package-lock.json` atualizado via `npm install`, sem mudar a versão resolvida). Nenhuma rota nova
foi construída (`/quem-somos`, `/servicos/:id`, etc. continuam por fazer — Fase 3), nenhuma
variável de ambiente nova, nenhum serviço externo novo.
ARTIFACTS:
  Criados:
    - content/schemas/index.ts
    - content/index.ts
    - content/services/{arroz,cereais,moageira,terras,campanha,mecanizacao,apoio-tecnico,comercializacao}.json
    - content/site/{nav,hero,stats,about,team,campanha,locations,contacts,footer,sections}.json
    - components/icon-map.tsx
    - public/images/team/placeholder.svg
  Alterados:
    - app/page.tsx (lê hero/stats/about/services/campanha/locations/sections de content/)
    - components/Header.tsx (lê nav de content/; nav.about existe no conteúdo mas não é renderizado
      — rota /quem-somos é Fase 3)
    - components/Footer.tsx (lê nav/footer/hero/services de content/)
    - components/WhatsappFloat.tsx (lê contacts.whatsapp.url de content/)
    - package.json (zod promovido a dependência direta)
    - package-lock.json (npm install após a alteração acima)
  Não tocados (referência para Fase 3, não apagar): index.html, servicos.html, servico.html,
  campanha.html, contactos.html, css/, js/main.js, netlify.toml, robots.txt, sitemap.xml,
  AvaliacaoAgroTrades/.
VALIDATIONS:
  - `npm install` sem erros bloqueantes (mesmos avisos de peer-deps já existentes na Fase 1, sem
    impacto).
  - `npm run build` (Next.js 16.3.2, Turbopack): compilação e geração estática de `/` e
    `/_not-found` com sucesso, sem erros de TypeScript nem de build.
  - `npm run start` + `curl`: `/` devolveu HTTP 200; `/servicos` continua a devolver HTTP 404
    (esperado, rota ainda não construída — Fase 3, não é regressão desta fase).
  - Paridade textual verificada por grep de 27 trechos de texto exato (tag do hero, títulos, motto,
    stats, about, tags do about, CEO, os 4 blurbs de preview de serviços — incluindo os títulos
    encurtados "Cereais e legumes"/"Processamento industrial" que diferem do título canónico do
    serviço —, banner da campanha, localizações, footer) contra o HTML servido por `curl
    http://localhost:3000/`: todas as 27 ocorrências encontradas exactamente 1 vez, nenhuma
    alterada.
  - Grep de intervalos Unicode de emoji (`\u{1F300}-\u{1FAFF}`, `\u{2600}-\u{27BF}`) no HTML
    servido: zero ocorrências.
  - `wa.me/258841031220`: exactamente 1 ocorrência no HTML servido (o `WhatsappFloat`; o botão do
    hero também aponta para o mesmo URL, ambos lidos de `content/site/contacts.json`).
  - Teste de falha de validação (reprodução do bug ANTES de confirmar a correção como concluída,
    conforme exigido): removido temporariamente `en` de `hero.tag` em
    `content/site/hero.json` → `npm run build` falhou com:
    `Conteúdo inválido em "content/site/hero.json": - tag.en: Invalid input: expected string,
    received undefined` — mensagem legível, indica exactamente o campo e o ficheiro a corrigir.
    Ficheiro restaurado a seguir; `npm run build` voltou a passar de forma limpa. Confirma
    AC/restrição 19 (validação Zod a correr no build, a falhar de forma legível).
  - Teste adicional: removido temporariamente `content/services/terras.json` (simulando "faltar um
    serviço") → `npm run build` falhou de imediato com erro de módulo não encontrado apontando
    exactamente para a linha de import em `content/index.ts`, também uma falha legível e anterior à
    geração de páginas. Ficheiro restaurado; build voltou a passar.
  - `git status --short`: confirmado que não há `.env*` nem segredos novos; `project/context.md`
    aparece modificado mas essa alteração já existia no working tree antes desta tarefa (a adição de
    âmbito "Quem Somos" mencionada no pedido do Orchestrator) — não foi tocado por mim.
ISSUES:
  - Extensão mínima ao modelo de conteúdo, fora do que foi literalmente enumerado no pedido, mas
    necessária para cumprir a exigência estrita de paridade pixel-a-pixel: os 4 serviços mostrados
    no preview da homepage (arroz, cereais, mecanização, moageira) já tinham, na Fase 1 (e no
    `index.html` original), um título e um resumo mais curtos do que o `title`/`summary`
    "canónicos" do serviço (usados nas futuras páginas de detalhe, fonte `js/main.js`). Para não
    escolher entre "mudar o texto visível da homepage" e "duplicar o mesmo texto sem necessidade",
    adicionei campos opcionais `homeTitle`/`homeBlurb` ao schema de serviço, populados apenas nos 4
    serviços da homepage e no serviço `campanha` (usado no rodapé com o rótulo curto "Campanha
    2025/2026"). Ausentes nos outros 4 serviços. Sinalizo isto para o Orchestrator/Tester
    validarem que é uma decisão aceitável e não decisão de arquitetura por minha conta — não decidi
    isto às escondidas, mas também não é literalmente o que a lista de campos do pedido descrevia.
  - Adicionei uma pequena coleção `content/site/sections.json` (tags/títulos das secções "O que
    fazemos"/"Os nossos serviços" e "Localização"/"Onde estamos" da homepage) que não estava
    explicitamente listada nas coleções pedidas — sem isto, esse texto ficaria hardcoded em
    `app/page.tsx`, violando a restrição 17 da arquitetura ("nenhum texto visível hardcoded").
  - `content/site/campanha.json` inclui, além do banner da homepage, todo o conteúdo da futura
    página `/campanha` (hero, quote, vision, pillars, timeline, cta), extraído de `campanha.html`.
    Não é renderizado nesta fase (só o banner da homepage é), mas já está validado no build — pronto
    para a Fase 3 sem trabalho de extração adicional.
  - `content/site/contacts.json` inclui todo o conteúdo de `contactos.html` (telefones, emails,
    embed do mapa, CEO) para a futura página `/contactos`; não é renderizado nesta fase.
  - Os handoffs `handoff-04-developer-fase1.md` e `handoff-05-tester-fase1.md` aparecem como `??`
    (não rastreados) no `git status` — não foram tocados por mim nesta fase; sinalizo para o
    Orchestrator confirmar se devem ser adicionados ao commit da Fase 2 ou eram já-para-commitar de
    uma fase anterior pendente.
BLOCKERS: Nenhum. Nada nesta fase tocou autenticação, dados pessoais, pagamentos ou schema de
produção — confirma-se a classificação SMALL/MEDIUM sem sinais de escalonamento (context.md).
REQUIRED_NEXT_ACTION: Próximo agente é o `tester`. Deve validar: (1) `npm run build` passa sem
erros; (2) a homepage em `/` continua pixel-idêntica à validada na Fase 1 (comparação lado a lado ou
diff estrutural de HTML/CSS, incluindo os 4 cartões de preview de serviços, a stats-bar, o about, o
banner da campanha e as 2 localizações); (3) reproduzir o teste de falha: remover `en` (ou `pt`) de
qualquer campo obrigatório num ficheiro em `content/` (por exemplo `content/site/about.json` ->
`title.en`, ou apagar um item de `content/services/`) e confirmar que `npm run build` falha com uma
mensagem legível que identifica o ficheiro e o campo — depois restaurar o ficheiro e confirmar que o
build volta a passar; (4) confirmar ausência de emojis, `.env*` e segredos (repetir os greps já
feitos, ver VALIDATIONS); (5) revisar os dois pontos assinalados em ISSUES (`homeTitle`/`homeBlurb`
e `sections.json`) e confirmar que não são regressão nem scope creep problemático.
CONTEXT_FOR_NEXT_AGENT: Estrutura de conteúdo em `content/schemas/index.ts` (schemas) e
`content/index.ts` (loader + validação + exports tipados `services`, `nav`, `hero`, `stats`,
`about`, `team`, `campanha`, `locations`, `contacts`, `footer`, `sections`, mais o helper
`pick(field, lang)`). Só PT é lido pelos componentes nesta fase (`.pt` direto, nunca `pick(...)`
ainda usado nos componentes — fica pronto para a Fase 3 trocar para `pick(field, lang)` quando o
routing por locale existir). Servidor de dev/produção não fica a correr entre sessões — o Tester
deve arrancar com `npm run dev` ou `npm run build && npm run start` (porta 3000) dentro de
`C:\Users\virgilio.jose\source\repos\agrotrades`. Nenhuma rota nova foi criada; `/servicos`,
`/campanha`, `/contactos`, `/servicos/:id` continuam a dar 404 propositadamente (Fase 3, não é
regressão). O ficheiro de referência visual continua a ser `index.html`/`css/style.css` na raiz do
repo (inalterados). Nenhuma variável de ambiente nem dependência com custo foi introduzida — apenas
`zod` (já usada indiretamente antes) passou a dependência direta.
