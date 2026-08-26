STATUS: COMPLETED
SUMMARY: Implementada a Fase 3 completa — rotas PT/EN por locale (D-4), 8 páginas de serviço
geradas dinamicamente a partir de content/services/ (generateStaticParams, template único), nova
página "Quem Somos" (about + equipa), 404 por locale (FR-13), redirects 301 (D-5), e correção dos
3 achados do code-reviewer (handoff-08). Nenhum novo texto visível ficou hardcoded: tudo o que era
necessário de novo (rótulos "Saiba mais"/"Saber mais", cabeçalhos "Destaques"/"Highlights", textos
de intro das páginas, título/descrição por defeito, conteúdo da página 404, cabeçalhos da equipa)
foi acrescentado a content/site/*.json com {pt,en} e schema Zod correspondente.

Decisão técnica principal (i18n sem middleware): usei o padrão "multiple root layouts" do App
Router — grupo de rotas app/(pt)/ (sem prefixo na URL, cobre "/", "/servicos", "/servicos/[id]",
"/campanha", "/contactos", "/quem-somos") e pasta real app/en/ (introduz o prefixo "/en", cobre as
mesmas páginas em inglês com slugs de serviço traduzidos). Cada grupo tem o seu próprio root layout
com <html lang> correto (D-4), porque não há app/layout.tsx partilhado. Todas as páginas são Server
Components; o único client component é Header (usePathname() para o seletor de idioma).

Routing centralizado em content/routes.ts: path(page, lang) para as 5 páginas fixas,
serviceDetailPath(id, lang) para o detalhe de serviço, e alternatePath(pathname, lang) — usada
pelo Header para calcular a página equivalente no outro idioma preservando a página atual (ex.
/servicos/arroz -> /en/services/rice), nunca troca client-side. Slugs EN definidos em
content/service-slugs.ts (mapeamento id -> slug inglês; não é "conteúdo" traduzível, é identificador
de URL, tal como o próprio `id`): arroz->rice, cereais->cereals, moageira->milling,
terras->land-preparation, campanha->campaign, mecanizacao->mechanisation,
apoio-tecnico->technical-support, comercializacao->marketing.

Página de serviço: app/(pt)/servicos/[id]/page.tsx e app/en/services/[slug]/page.tsx partilham o
componente components/pages/ServiceDetailContent.tsx (template único, reutilizado, sem 8 ficheiros
manuais) e usam generateStaticParams a partir de content/index.ts `services` (8 ids) e
content/service-slugs.ts (8 slugs), gerando as 16 páginas estaticamente (8 PT + 8 EN).

Correções dos 3 achados do handoff-08 (code-reviewer), feitas dentro do próprio trabalho de i18n:
  (a) "Saiba mais" hardcoded em app/page.tsx — agora vem de sections.services.learnMore.{pt,en}
      (novo campo em content/site/sections.json), usado em HomeContent e ServicesListContent.
  (b) tooltip "Disponível numa fase futura" no Header — removido por completo: o botão EN deixou
      de estar `disabled`, porque agora navega para uma rota EN real (não fazia mais sentido manter
      um tooltip de "fase futura" quando o EN já existe de facto).
  (c) metadata.title/description do layout — deixaram de estar fixos em app/layout.tsx (aliás esse
      ficheiro foi removido e substituído pelos dois root layouts). Cada página usa `metadata`
      estática ou `generateMetadata` (páginas de serviço, que dependem do parâmetro dinâmico),
      construída a partir de content/site/meta.json ({titleSuffix, defaultTitle{pt,en},
      defaultDescription{pt,en}}) via o helper `buildTitle()` em content/index.ts.

Conteúdo novo/alterado (todos os campos traduzíveis são {pt,en} no mesmo ficheiro, validados por
Zod no build — restrições 17/18/19 da arquitetura):
  - content/site/meta.json (novo): título/descrição por defeito.
  - content/site/notFound.json (novo): texto da página 404 por locale.
  - content/site/servicesPage.json (novo): intro + CTA da listagem de serviços.
  - content/site/servicePage.json (novo): cabeçalho "Destaques" + rótulo "Serviços" do link de
    regresso na página de detalhe.
  - content/site/aboutPage.json (novo): tag/heading da secção de equipa em "Quem Somos".
  - content/site/sections.json: + services.learnMore.
  - content/site/about.json: `learnMoreHref` (fixo, só PT) substituído por `learnMoreLabel`
    {pt,en} — o destino em si passou a ser calculado por idioma via routes.ts (path("about",
    lang)), nunca escrito à mão por idioma no JSON. Documentado no schema como decisão desta fase.
  - content/site/contacts.json: + phoneLabel, emailLabel (títulos dos blocos de contacto).
  - content/site/campanha.json: + timelineHeading {tag,title} (secção "Calendário"/"Fases da
    campanha" da página /campanha, que antes só existia como texto estático no HTML original).

CSS: adicionadas ao app/globals.css as classes que só existiam como <style> inline no
campanha.html original (.quote-block, .pillar-grid, .pillar, .timeline, .timeline-item) e as
classes novas da equipa (.team-grid, .team-card, .team-photo, .team-role, .team-quote) — paleta e
tipografia inalteradas (FR-05/06), nada literal foi alterado, só centralizado.

next.config.mjs: adicionado `redirects()` com as 6 entradas da tabela D-5 (servicos.html,
campanha.html, contactos.html, index.html -> rotas novas; servico.html?id=:id -> /servicos/:id via
`has`/query; /home -> / preservado do netlify.toml).

BUG ENCONTRADO E CORRIGIDO durante a reprodução: as páginas dinâmicas `[id]`/`[slug]` devolviam 404
mesmo para serviços válidos (ex. /servicos/arroz), porque o Next.js 15+ tornou `params` uma
Promise nas páginas do App Router — o código inicial lia `params.id` diretamente (sincronamente),
o que resultava em `undefined` e disparava `notFound()`. Corrigido fazendo `await params` em
`generateMetadata` e no componente de página, em ambos os ficheiros ([id] e [slug]). Reproduzido
via `npm run build` + `npm run start` + curl antes de corrigir (confirmei 404 real, não just
suspeita), e voltei a testar depois (200 confirmado) — ver VALIDATIONS.

ARTIFACTS:
  Novo:
    app/(pt)/layout.tsx, app/(pt)/page.tsx, app/(pt)/not-found.tsx, app/(pt)/servicos/page.tsx,
    app/(pt)/servicos/[id]/page.tsx, app/(pt)/campanha/page.tsx, app/(pt)/contactos/page.tsx,
    app/(pt)/quem-somos/page.tsx, app/en/layout.tsx, app/en/page.tsx, app/en/not-found.tsx,
    app/en/services/page.tsx, app/en/services/[slug]/page.tsx, app/en/campaign/page.tsx,
    app/en/contact/page.tsx, app/en/about/page.tsx, app/not-found.tsx (fallback de topo),
    components/pages/HomeContent.tsx, components/pages/ServicesListContent.tsx,
    components/pages/ServiceDetailContent.tsx, components/pages/CampaignContent.tsx,
    components/pages/ContactContent.tsx, components/pages/AboutContent.tsx,
    components/pages/NotFoundContent.tsx, content/routes.ts, content/service-slugs.ts,
    content/site/meta.json, content/site/notFound.json, content/site/servicesPage.json,
    content/site/servicePage.json, content/site/aboutPage.json.
  Alterado:
    content/schemas/index.ts (novos schemas: metaSchema, notFoundSchema, servicesPageSchema,
    servicePageSchema, aboutPageSchema; extensões: sections.services.learnMore, about.learnMoreLabel
    [substitui learnMoreHref], contacts.phoneLabel/emailLabel, campanha.timelineHeading),
    content/index.ts (carrega os novos ficheiros, exporta buildTitle(), pick() passa a exigir lang
    explícito — já não tinha "pt" como default implícito da Fase 2), content/site/sections.json,
    content/site/about.json, content/site/contacts.json, content/site/campanha.json,
    components/Header.tsx (lang prop, seletor de idioma real via alternatePath, sem tooltip),
    components/Footer.tsx (lang prop, hrefs/textos por idioma), app/globals.css (+timeline/quote/
    pillar/team), next.config.mjs (+redirects).
  Removido:
    app/layout.tsx, app/page.tsx (substituídos pelos dois root layouts/páginas por locale).

VALIDATIONS:
  - `npm run build` passa de fio a pao (TypeScript strict + build de produção), gerando as 28
    rotas esperadas (confirmado na saída do Next: /, /campanha, /contactos, /quem-somos, /servicos
    + 8 /servicos/[id], e o espelho completo em /en, /en/about, /en/campaign, /en/contact,
    /en/services + 8 /en/services/[slug], mais /_not-found).
  - `npm run start` + `curl`, manualmente, depois da correção do bug do `params`:
      * PT: /, /servicos, /servicos/arroz, /campanha, /contactos, /quem-somos -> 200,
        <html lang="pt">, <title> correto (ex. "Produção de arroz — AGRO TRADES, LDA").
      * EN: /en, /en/services, /en/services/rice, /en/campaign, /en/contact, /en/about -> 200,
        <html lang="en">, <title> correto (ex. "Rice Production — AGRO TRADES, LDA").
      * 404: /servicos/nao-existe, /en/services/nao-existe, /random-xyz -> 404 real (verificado o
        HTTP status, não apenas o corpo da página), cada um com o <html lang> do contexto certo
        (pt/pt/pt — o fallback de topo assume pt por não haver indicação de idioma fiável nesse
        caso raro).
      * Seletor de idioma: verificado o href gerado pelo Header em 6 páginas diferentes
        (PT arroz->/en/services/rice, EN rice->/servicos/arroz, PT quem-somos->/en/about,
        EN about->/quem-somos, PT contactos->/en/contact, PT servicos->/en/services,
        PT campanha->/en/campaign) — confirma que a página atual é preservada, não a homepage.
      * Redirects 301(308): /servicos.html, /campanha.html, /contactos.html, /index.html, /home ->
        destinos corretos; /servico.html?id=cereais -> /servicos/cereais (com "?id=cereais"
        residual na URL final — comportamento nativo do Next.js quando o parâmetro de query do
        `has` não é consumido na `destination`; o redirecionamento funciona e chega à página
        certa, mas fica registado como comportamento do framework, não um bug, e o requisito
        3.6.3 dos requirements.md já classifica este redirect como "recomendado", não
        obrigatório).
      * "Saber mais" da homepage e team grid de "Quem Somos" inspecionados no HTML devolvido
        (grid com os 3 membros placeholder, foto placeholder.svg, nome, cargo, frase quando
        presente).
  - Inspeção de código: nenhum emoji introduzido; nenhuma dependência nova; nenhum segredo;
    paleta/tipografia inalteradas (só reorganizei CSS já existente inline para o globals.css).

ISSUES:
  - [PRÉ-EXISTENTE, não introduzido nesta fase] `npm run lint` falha porque o repositório só tem
    `.eslintrc.json` (formato antigo) e o ESLint instalado é a v9, que exige `eslint.config.js`
    (flat config). Isto já existia antes desta tarefa (não toquei em `.eslintrc.json` nem no
    `package.json` além do que já estava). Sinalizo para o Orchestrator decidir se corrige agora
    (fora do âmbito desta tarefa, que era i18n/rotas) ou mais tarde.
  - [MENOR, decisão registada] O redirect `/servico.html?id=:id` fica com o `?id=` residual na URL
    de destino (ver VALIDATIONS) — é comportamento nativo do `redirects()` do Next.js quando o
    parâmetro do `has` não é referenciado no `destination`; não há forma de o suprimir sem
    middleware, que estava fora do âmbito pedido. Não bloqueia AC-14 nem D-5, que classificam este
    redirect como precaução, não obrigatório.
  - [FORA DE ÂMBITO, registado apenas] Não implementei SEO avançado (JSON-LD, sitemap.xml gerado,
    hreflang, OG/Twitter) — é explicitamente Fase 4, conforme instrução recebida.
BLOCKERS: Nenhum. Nenhum sinal de risco elevado (autenticação, dados pessoais, pagamentos, schema
de produção, contrato de API de terceiros) foi tocado nesta fase — confirma-se o que a arquitetura
já classificava para as Fases 1-4.
REQUIRED_NEXT_ACTION: Próximo agente é o `tester`. Deve validar, no mínimo: (1) as 8 páginas de
serviço em PT e EN (conteúdo, ícones, highlights, links de regresso), (2) navegação completa nos
dois idiomas incluindo o seletor de idioma a partir de páginas profundas (não só da homepage), (3)
a página "Quem Somos" nos dois idiomas (texto institucional completo + equipa), (4) a página 404
em PT, EN, e no caminho de fallback de topo, (5) os redirects 301 um a um, (6) que o build falha de
forma legível se se remover deliberadamente uma tradução EN de algum dos novos ficheiros de
content/site/ (para confirmar que a validação Zod cobre também os campos acrescentados nesta fase,
não só os da Fase 2).
CONTEXT_FOR_NEXT_AGENT: O routing i18n não usa middleware nem cookies/localStorage — é 100% por
estrutura de ficheiros (grupo de rotas "(pt)" + pasta real "en"), decisão documentada no topo de
content/routes.ts e nos comentários dos dois layouts. Se o Tester encontrar uma página em falta,
verificar primeiro se falta o par correspondente em app/(pt)/... ou app/en/..., e não assumir que é
preciso lógica de i18n adicional — a estrutura de pastas já é a fonte da verdade. O `pick()`
exportado de content/index.ts deixou de ter "pt" como default implícito (Fase 2) — passa a exigir
o idioma explicitamente; se o Tester tiver testes antigos que chamem `pick(campo)` sem segundo
argumento, isso agora falha em tempo de compilação (TypeScript), o que é intencional.
