STATUS: COMPLETED
SUMMARY: Implementada a Fase 4 (SEO, metadados e cabeçalhos de segurança) dentro do âmbito exato
pedido, sem tocar em Decap CMS, proxy OAuth, gestão de utilizadores ou produção. Todo o texto/URL
usado nos metadados vem de `content/` (nunca hardcoded na página); a arquitetura de metadados foi
centralizada em dois novos ficheiros (`content/seo.ts`, `content/organization.ts`) reutilizados por
todas as páginas, para garantir consistência entre as 12 rotas e não duplicar a estrutura
canonical/hreflang/og/twitter em cada `page.tsx`.

  1) Metadados completos por página/idioma (FR-12/AC-05): `title`, `description`, `canonical`,
     `alternates.languages` (hreflang PT<->EN, incluindo `x-default` = PT, coerente com D-4),
     `og:title/description/type/url/image/site_name/locale`, `twitter:card` — em homepage (PT/EN),
     8 páginas de serviço (PT/EN, via `generateMetadata` porque o título/descrição dependem do
     `id`/`slug`), Quem Somos, Campanha, Contactos e a listagem de Serviços (incluída por
     consistência com o requisito "todas as rotas" da secção 5 e por já estar prevista no
     sitemap). `og:image`/`twitter:image` reutilizam `public/images/logo.jpeg` (nenhuma imagem
     nova gerada, conforme instruído) via novo campo `meta.ogImage` em `content/site/meta.json`.
  2) hreflang: `content/seo.ts` recebe sempre os dois caminhos (PT e EN) de cada página — construídos
     a partir de `content/routes.ts` (`path()`/`serviceDetailPath()`, já existentes da Fase 3) — e
     gera `alternates.languages` correto nos dois sentidos (confirmado por curl, ver VALIDATIONS).
  3) Favicon: copiado `AvaliacaoAgroTrades/uploads/agrotrades/images/favicon.svg` (existia, não foi
     necessário adaptar o logo) para `public/favicon.svg`, referenciado via `metadata.icons` nos
     dois root layouts e em `app/not-found.tsx` (rota especial "/_not-found", que não herda de
     nenhum dos dois root layouts).
  4) JSON-LD `Organization` (FR-12/AC-06): novo `content/organization.ts` monta o objeto a partir de
     `content/site/contacts.json` (nome da empresa = `contacts.ceo.company`, telefone =
     `contacts.phones[0]`, email = `contacts.emails[0]`) e `content/site/locations.json`
     (endereço da localização `"escritorio"`) — nunca hardcoded. Novo componente
     `components/OrganizationJsonLd.tsx` (script `application/ld+json`) incluído apenas em
     `app/(pt)/page.tsx` e `app/en/page.tsx`, replicando o schema já usado na variante
     AvaliacaoAgroTrades (mesmos campos: name/url/logo/telephone/email/address).
  5) `app/sitemap.ts`: gerado a partir de `content/routes.ts` (`PAGE_KEYS` — novo export — e
     `path()`) e `content/index.ts` `services` + `serviceDetailPath()` — nunca uma lista de URLs
     escrita à mão. 26 URLs no total (5 páginas fixas + 8 serviços, x2 idiomas), cada uma com
     `alternates.languages` para a contraparte.
  6) `app/robots.ts`: permite tudo, `Disallow: /admin` (preparação para a Fase 5, sem implementar
     nada de auth), `Sitemap: https://agrotrades.co.mz/sitemap.xml`.
  7) `next.config.mjs` `headers()`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
     (migrados do `netlify.toml`, mesmos valores), mais `Strict-Transport-Security`
     (`max-age=63072000; includeSubDomains` — sem `preload`, ver ISSUES), `Permissions-Policy`
     restritiva, e uma CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src
     'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;
     img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action
     'self'; frame-ancestors 'none'; upgrade-insecure-requests`. Sem nenhuma origem de terceiros em
     `script-src` (nenhum CDN, nenhum `unpkg.com`). Comentário extenso no próprio `next.config.mjs`
     (pedido explícito da tarefa) a explicar: (a) por que `'unsafe-inline'` está em `script-src` —
     confirmei por inspeção do HTML gerado que o próprio Next.js App Router injeta um `<script>`
     inline sem `src` com o payload de hidratação RSC (`self.__next_f.push(...)`), independente de
     qualquer código nosso, e que não há nonce por pedido possível sem middleware (fora do âmbito
     desta fase); (b) que esta CSP global é a restrição vinculativa e NÃO deve ser relaxada quando
     o Decap chegar na Fase 5 — a Fase 5 deve acrescentar uma entrada de `headers()` própria com
     `source: "/admin/:path*"`, mais permissiva, sem tocar nesta.
  8) `next.config.mjs`, redirects 301 existentes da Fase 3 (D-5) — não tocados, confirmados por
     curl (ver VALIDATIONS, sem regressão).
  9) Não introduzido `netlify.toml` novo; o antigo na raiz não foi tocado nem apagado, tal como
     `index.html`/`css/`/`js/`/`AvaliacaoAgroTrades/` do site antigo.

ARTIFACTS:
  Criados:
    content/seo.ts (helper `buildPageMetadata` — canonical/hreflang/og/twitter centralizados)
    content/organization.ts (JSON-LD Organization a partir de content/)
    components/OrganizationJsonLd.tsx
    app/robots.ts
    app/sitemap.ts
    public/favicon.svg (copiado de AvaliacaoAgroTrades/uploads/agrotrades/images/favicon.svg)
  Alterados:
    content/site/meta.json (+ siteUrl, + ogImage)
    content/schemas/index.ts (metaSchema: + siteUrl com validação de URL, + ogImage)
    content/routes.ts (+ export type PageKey, + export const PAGE_KEYS, usados por app/sitemap.ts)
    app/(pt)/layout.tsx, app/en/layout.tsx (+ metadataBase a partir de meta.siteUrl, + icons.icon)
    app/not-found.tsx (+ icons.icon, mesma razão)
    app/(pt)/page.tsx, app/en/page.tsx (+ buildPageMetadata, + <OrganizationJsonLd />)
    app/(pt)/servicos/page.tsx, app/en/services/page.tsx (+ buildPageMetadata)
    app/(pt)/servicos/[id]/page.tsx, app/en/services/[slug]/page.tsx (generateMetadata agora usa
      buildPageMetadata + serviceDetailPath para os dois caminhos hreflang)
    app/(pt)/campanha/page.tsx, app/en/campaign/page.tsx (+ buildPageMetadata)
    app/(pt)/contactos/page.tsx, app/en/contact/page.tsx (+ buildPageMetadata)
    app/(pt)/quem-somos/page.tsx, app/en/about/page.tsx (+ buildPageMetadata)
    next.config.mjs (+ headers() com CSP/HSTS/demais cabeçalhos; redirects() inalterado)

VALIDATIONS:
  - `npm run build`: passa (TypeScript strict + build de produção), 30 rotas geradas (as 28 já
    existentes da Fase 3 + `/robots.txt` + `/sitemap.xml` novas).
  - Build limpo + `npm run start`, testado com curl fresco:
    * `curl -I /` → todos os headers de segurança presentes: X-Frame-Options, X-Content-Type-
      Options, Referrer-Policy, Strict-Transport-Security, Permissions-Policy, Content-Security-
      Policy (com o conteúdo exato listado acima, sem origens de terceiros em script-src).
    * `/sitemap.xml`: 26 `<url>` (5 páginas fixas + 8 serviços, x2 idiomas cada), com
      `<xhtml:link rel="alternate" hreflang="pt/en">` corretos em ambos os sentidos — confirmado
      lendo a lista completa de `<loc>`.
    * `/robots.txt`: `Allow: /`, `Disallow: /admin`, `Sitemap: https://agrotrades.co.mz/sitemap.xml`.
    * Inspecionei o `<head>` de 6 páginas (/, /en, /servicos/arroz, /en/services/rice, /quem-somos,
      /en/about): `title`, `meta description`, `canonical`, `alternate hreflang` (pt/en/x-default),
      `og:title/description/url/site_name/locale/image/type`, `twitter:card/title/description/image`
      — todos presentes, todos distintos entre páginas e entre idiomas da mesma página (confirmado
      por leitura direta do HTML gerado, não apenas pela afirmação de que o código os produz).
    * JSON-LD: presente em `/` e `/en` (confirmei o conteúdo exato via curl — nome, url, logo,
      telefone, email, endereço, todos coerentes com content/site/contacts.json e locations.json);
      confirmei explicitamente a AUSÊNCIA de JSON-LD nas outras 4 páginas inspecionadas (não é só
      homepage por omissão — é intencional e confirmado).
    * `curl -I /favicon.svg` → 200, servido de `public/`, com os headers de segurança também
      aplicados (confirma que `headers()` cobre `/:path*` incluindo assets estáticos).
    * `curl -I /images/logo.jpeg` → 200 (confirma que o `og:image` resolve para um recurso real).
  - Regressão (Fase 3, sem alterações de comportamento): `curl -I /servicos.html` → 308 para
    `/servicos` (redirect D-5 intacto); `/servicos` e `/en/services/rice` → 200; `/random-xyz` → 404
    (comportamento da Fase 3 preservado, não tocado nesta fase).
  - `npm run lint`: falha com o mesmo erro pré-existente já documentado nos handoffs 05/07/10/12/13
    (ESLint 9 sem `eslint.config.js`, incompatível com `.eslintrc.json`) — confirmei que é
    exatamente o mesmo erro, não introduzido nem agravado por esta fase.
  - Servidor de teste não ficou a correr — matei o processo na porta 3000 (`taskkill`) ao terminar.

ISSUES:
  - [DECISÃO DOCUMENTADA, não bloqueante] `script-src 'self' 'unsafe-inline'` e
    `style-src 'self' 'unsafe-inline' ...`: confirmei por inspeção do HTML gerado que o próprio
    Next.js App Router injeta inline, sem `src`, o payload de hidratação RSC
    (`self.__next_f.push(...)`), e os componentes de página usam atributos `style={{...}}` inline
    (ex. NotFoundContent). Sem middleware (fora do âmbito desta fase, e não pedido pela tarefa, que
    limita a alteração a `next.config.mjs`), não há nonce por pedido disponível para evitar
    `'unsafe-inline'` sem quebrar a hidratação do site. Esta é a CSP mais estrita alcançável dentro
    do âmbito pedido ("via headers() em next.config.mjs", "sem middleware" implícito nas decisões já
    fechadas da arquitetura D-1) — nenhuma origem de terceiros foi adicionada a `script-src`, o que
    cumpre "sem scripts de terceiros". Sinalizo para o Tester/Code Reviewer avaliarem se este
    trade-off é aceitável, e para o `software-architect` decidir formalmente, se e quando for
    necessário reforçar isto, se vale introduzir middleware com nonce por pedido — isso seria uma
    decisão de arquitetura, não uma correção pontual minha.
  - [DECISÃO DOCUMENTADA, não bloqueante] `Strict-Transport-Security` sem a diretiva `preload`:
    incluí `max-age=63072000; includeSubDomains` mas deixei `preload` de fora deliberadamente —
    submeter à lista de preload dos browsers é um compromisso praticamente irreversível que deveria
    ser uma decisão explícita do `devops-engineer` antes do cutover de produção (Fase 7), não uma
    consequência silenciosa de código escrito nesta fase, muito antes de o domínio de produção ser
    tocado (restrição 25). Comentário no próprio `next.config.mjs` explica esta decisão.
  - [FORA DE ÂMBITO, apenas registo] `next/image` sem `unoptimized` nas fotos de equipa — já
    registado nos handoffs 10/12/13 como não-bloqueante e fora do âmbito, não tocado nesta fase.
  - [FORA DE ÂMBITO, apenas registo] `npm run lint` continua a falhar por incompatibilidade ESLint 9
    / `.eslintrc.json` — pré-existente, não alterado nesta fase (mesmo erro dos handoffs anteriores).
  - [SUGESTÃO, não bloqueante] Incluí a página de listagem `/servicos` e `/en/services` no conjunto
    de páginas com metadados completos e no sitemap, embora a instrução da tarefa liste
    explicitamente "homepage, 8 páginas de serviço, Quem Somos, Campanha, Contactos" sem mencionar a
    listagem por nome. Decisão minha: a listagem já fazia parte das "todas as rotas" exigidas para
    o sitemap (ponto 5 da tarefa, que cita explicitamente FR-14/AC-14 "todas as URLs finais") e do
    requisito geral FR-12 ("cada página"), por isso tratá-la com o mesmo padrão evita uma exceção
    arbitrária. Sinalizo para o Tester confirmar se isto é aceitável ou se deveria ter ficado fora.

BLOCKERS: Nenhum. Não toquei em autenticação, tokens, sessões, integração bancária, schema de
produção, contratos de API de terceiros, dados pessoais de clientes, Decap CMS, proxy OAuth nem
gestão de utilizadores — apenas nos ficheiros listados em ARTIFACTS, todos dentro do âmbito exato
pedido (metadados, hreflang, favicon, JSON-LD, sitemap, robots, cabeçalhos de segurança).

REQUIRED_NEXT_ACTION: Próximo agente é o `tester`. Sugiro validar, além de repetir os testes já
descritos em VALIDATIONS:
  1. Todas as 12 páginas com metadados (não só as 6 que já inspecionei) têm os campos completos de
     AC-05 e nenhum campo vazio/undefined (ex.: confirmar que `generateMetadata` das páginas de
     serviço não devolve `{}` para nenhum dos 8 serviços válidos).
  2. Validar o JSON-LD com um validador de rich results (ou manualmente contra o schema.org
     Organization) para confirmar AC-06 de forma mais rigorosa do que a inspeção visual que fiz.
  3. Confirmar que a CSP não bloqueia nada no browser real (não só por curl) — abrir o site num
     browser com a consola aberta e confirmar zero erros de CSP, incluindo a troca de idioma
     (client component) e o botão flutuante de WhatsApp.
  4. Decidir, com o Orchestrator, se os dois ISSUES marcados "DECISÃO DOCUMENTADA" (unsafe-inline;
     HSTS sem preload) são aceitáveis como estão ou exigem escalonamento.
  5. Confirmar a `og:image` com o utilizador (decisão humana already prevista na arquitetura,
     secção "Fase 4", "Decisão humana: confirmar a og:image") — usei o logo existente
     (`public/images/logo.jpeg`) por não haver imagem dedicada, conforme instruído, mas a
     confirmação humana explícita ainda não aconteceu nesta conversa.

CONTEXT_FOR_NEXT_AGENT: Toda a lógica de metadados está centralizada em `content/seo.ts`
(`buildPageMetadata`) e `content/organization.ts` (`organizationJsonLd`) — se encontrar uma página
com metadados incompletos ou inconsistentes, o bug provavelmente está num destes dois ficheiros ou
na chamada feita por essa página específica, não espalhado por 12 ficheiros diferentes. `PAGE_KEYS`
e `PageKey` foram exportados de `content/routes.ts` nesta fase especificamente para `app/sitemap.ts`
— não existiam antes. O favicon está em `public/favicon.svg` (não em `app/icon.svg`, que seria a
convenção mais moderna do Next.js, mas escolhi seguir literalmente a instrução da tarefa "copia o
ficheiro para public/"). A CSP e o HSTS estão comentados extensivamente dentro do próprio
`next.config.mjs` (não só neste handoff) — quem for implementar a Fase 5 deve ler esse comentário
antes de tocar em `headers()`.
