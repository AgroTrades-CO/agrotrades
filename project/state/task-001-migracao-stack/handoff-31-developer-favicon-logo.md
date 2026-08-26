STATUS: COMPLETED
SUMMARY: Substituídas as referências ao logótipo (`next/image`) em Header.tsx e Footer.tsx de
`/images/logo.jpeg` para `/images/logo.png` (versão com fundo removido). Favicon ligado ao
`<head>` via `metadata.icons` (API de metadata do Next.js, App Router), centralizado num novo
export `siteIcons` em `content/seo.ts` para não repetir a lista em cada layout — reutiliza o
padrão já existente do projeto (`buildPageMetadata`/`content/seo.ts`, Fase 4). `siteIcons` declara
`icon` (16/32/48/192/512 PNG, com `sizes`/`type`), `apple` (180px) e `shortcut` (`/favicon.ico`,
servido automaticamente pelo Next.js a partir de `public/favicon.ico`). O `public/favicon.svg`
antigo (genérico, herdado de AvaliacaoAgroTrades, não era a marca da AgroTrades) foi removido —
decisão: não mantido como fallback, para não haver dois favicons conflituosos, já que o novo
conjunto de PNGs + `.ico` cobre todos os tamanhos/contextos necessários (browsers, iOS,
Android/PWA).

ARTIFACTS:
- components/Header.tsx (logo.jpeg -> logo.png)
- components/Footer.tsx (logo.jpeg -> logo.png)
- content/seo.ts (novo export `siteIcons`, documentado)
- app/(pt)/layout.tsx (metadata.icons -> siteIcons)
- app/en/layout.tsx (metadata.icons -> siteIcons)
- app/not-found.tsx (metadata.icons -> siteIcons, fallback de topo sem root layout próprio)
- public/favicon.svg (removido)
- (não tocados, propositadamente: images/logo.jpeg, public/images/logo.jpeg — mantidos como
  ficaram, só deixaram de ser referenciados pelo código ativo do Header/Footer)

VALIDATIONS:
- `npm run build` — sucesso (Next.js 16.3.2, Turbopack), 30 páginas geradas sem erros de
  TypeScript nem de build.
- `npm run start` + curl a `http://localhost:3000/` e `http://localhost:3000/en`: `<head>` de
  ambas as páginas contém `<link rel="shortcut icon" href="/favicon.ico">` +
  5x `<link rel="icon" ...images/favicon-{16,32,48,192,512}.png sizes=...>` +
  `<link rel="apple-touch-icon" href="/images/favicon-180.png" sizes="180x180">`.
- curl ao HTML da homepage confirma os dois `<img>` (Header e Footer) com
  `src="/_next/image?url=%2Fimages%2Flogo.png&..."` — ambos servem o novo logo com fundo removido.
- Servidor de `npm run start` parado no final (taskkill node.exe) para não deixar processo pendurado.

ISSUES (fora do âmbito, não corrigidos): `content/site/meta.json` (`ogImage`) e
`content/organization.ts` (`logo`, JSON-LD Schema.org via `OrganizationJsonLd.tsx`) continuam a
apontar para `/images/logo.jpeg` (confirmado via curl: `<meta property="og:image" content=".../images/logo.jpeg">`
ainda presente no HTML). Estes dois usos não são `next/image` (são metadata Open Graph/Twitter e
JSON-LD, não tags `<img>`), pelo que ficaram fora do âmbito definido nesta tarefa ("Header.tsx e
Footer.tsx e qualquer outro sítio que uses next/image"). Se a substituição do logótipo se
pretender total (incluindo previews de partilha em redes sociais e o Schema.org da Organization),
o Orchestrator deve decidir se abre uma tarefa dedicada — trocar `ogImage` para um PNG com fundo
removido pode não ser desejável esteticamente em previews sociais (dependendo do fundo do cliente
que renderiza o preview), pelo que pode fazer sentido usar antes `logo-square.png` (versão com
padding) em vez de `logo.png` (fundo transparente sem padding) nesses dois usos específicos.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: Tester deve validar: (1) build/lint limpos; (2) inspeção visual do Header e
Footer em `/` e `/en` a mostrar o logótipo sem fundo branco sólido; (3) inspeção do favicon do
browser (tab icon) em pelo menos uma página PT e uma EN; (4) confirmar que não há 404 nos pedidos
de `/favicon.ico`, `/images/favicon-*.png`; (5) confirmar que `public/favicon.svg` já não existe e
que nenhuma referência morta a ele ficou no código (já verificado por grep nesta ronda, mas vale
confirmação independente).

CONTEXT_FOR_NEXT_AGENT: Os ícones estão centralizados em `content/seo.ts` (`export const
siteIcons`), consumidos por `app/(pt)/layout.tsx`, `app/en/layout.tsx` e `app/not-found.tsx` (esta
última rota não tem root layout próprio — ver comentário já existente no ficheiro sobre a rota
interna `/_not-found`). Os PNGs de favicon já existiam em `public/images/` (gerados previamente
pelo Orchestrator) — este handoff só os ligou à metadata. `logo.jpeg` original permanece intacto
em `images/` e `public/images/` (não apagado, por instrução explícita da tarefa).
