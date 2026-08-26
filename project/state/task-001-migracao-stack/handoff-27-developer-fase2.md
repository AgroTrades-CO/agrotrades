STATUS: COMPLETED

SUMMARY: Implementados os 4 pontos da Fase 2 (feedback pós-preview) seguindo à letra o
design-spec-fase2.md e os schemas definidos no handoff-26. (1) `serviceSectionSchema` estendido
com `image?`, `layout?` (`z.enum(["split","feature"])`), `bullets?`, com `.superRefine()` a
recusar `layout`/`bullets` sem `image`; helper puro `resolveSectionLayout()` fora do Zod, usado
como ponto único de derivação ("card" | "split" | "feature") tanto pelo schema quanto pelo
componente. `relatedHeading` acrescentado a `servicePageSchema`/`servicePage.json` e
`servicesViewAll` a `navSchema`/`nav.json`. `IconChevronDown` criado em `components/icons.tsx`
como export solto, fora do `iconName`/`icon-map.tsx`, com comentário fixando a convenção
conteúdo-vs-chrome. (2) `ServiceDetailContent.tsx` agora renderiza 3 variantes por secção: "card"
(inalterado), "split" (grid imagem+texto, alternância de lado só entre secções split via contador
`splitCount`, imagem sempre primeiro no DOM, `order` CSS só na coluna de texto) e "feature" (faixa
full-width `--green-light`, imagem à direita fixa, ícone da secção ignorado). Bullets opcionais
renderizados em split/feature via componente `SectionBullets`. `content/services/arroz.json` foi
atualizado para demonstrar as 3 variantes no mesmo serviço (secção 1 = split por omissão, secção 2
= feature + bullets, secção 3 = card sem imagem); `mecanizacao.json` ganhou um exemplo adicional de
split + bullets. (3) Nova secção "Outros serviços" no detalhe: função pura `relatedServices(id)`
em `content/index.ts` calcula os 3 próximos na ordem canónica de `services` com wrap-around,
sempre excluindo o atual; extraído `components/ServiceCard.tsx` (mesmo markup/estilo do cartão de
`/servicos`) e reutilizado em ambos os locais, eliminando duplicação de JSX. (4) `Header.tsx`
reescrito: item "Serviços" passa a `<button>` com `IconChevronDown` (rotação 180° quando aberto),
`aria-haspopup`/`aria-expanded`/`aria-controls` sincronizados, abre por hover (`mouseenter`/
`mouseleave` no `<li>`), click (`toggle`), teclado (`Enter`/`Espaço` nativos do `<button>`,
`ArrowDown` abre e foca o 1º item, `ArrowUp`/`ArrowDown` navegam os 9 itens do painel, `Escape`
fecha e devolve o foco ao gatilho, clique fora fecha via listener `mousedown` no `document`).
Painel desktop: grid 2 colunas, miniatura 36x36 (`alt=""`, decorativa) + título por serviço, mais
"Ver todos os serviços →" destacado a laranja. Em mobile, o mesmo estado (`servicesOpen`) e o mesmo
DOM viram, só por CSS (`@media max-width:768px`), uma expansão inline tipo acordeão sem overlay e
sem miniaturas; fechar o menu hambúrguer principal reseta `servicesOpen` (`useEffect` em `open`).
Item "Serviços" fica "ativo" quando `pathname.startsWith(path("services", lang))`.

ARTIFACTS:
- `content/schemas/index.ts` — `serviceSectionLayout`, `serviceSectionSchema` (+`.superRefine()`),
  `resolveSectionLayout()`, `navSchema.servicesViewAll`, `servicePageSchema.relatedHeading`.
- `content/index.ts` — re-exporta `resolveSectionLayout`, nova função `relatedServices(id)`,
  export dos tipos `ResolvedSectionLayout`/`ServiceSectionLayout`.
- `content/site/nav.json`, `content/site/servicePage.json` — novos campos PT/EN.
- `content/services/arroz.json` — `sections[0].image` (split), `sections[1].image`+`layout:
  "feature"`+`bullets` (reutiliza `gallery-1.svg`/`gallery-2.svg` já existentes, sem imagens
  novas), `sections[2]` sem imagem (card).
- `content/services/mecanizacao.json` — `sections[0].image` + `bullets` (split, reutiliza
  `gallery-1.svg`).
- `components/icons.tsx` — novo `IconChevronDown` (export solto, fora do enum).
- `components/ServiceCard.tsx` — novo, componente partilhado.
- `components/pages/ServicesListContent.tsx` — usa `ServiceCard`.
- `components/pages/ServiceDetailContent.tsx` — variantes split/feature/bullets + secção "Outros
  serviços".
- `components/Header.tsx` — dropdown completo (desktop + mobile).
- `app/globals.css` — classes novas: `.sd-section-split*`, `.sd-section-feature*`,
  `.sd-section-bullets`, `.sd-related-section`, `.nav-services-*` (desktop + overrides mobile no
  `@media (max-width: 768px)` já existente). Nenhuma cor/tipografia nova, tudo a partir das
  variáveis já existentes.

VALIDATIONS:
- `npm run build` (Next.js/Turbopack) passa sem erros, incluindo `tsc` — cobre a validação Zod de
  todo o `content/` no momento do build (schema falharia o build com mensagem legível se algum
  JSON violasse a regra `layout`/`bullets` sem `image`).
- `npm run start` + `curl` locais:
  - `/servicos/arroz`: confirma presença de `sd-section-card` (1), `sd-section-split` (secção com
    imagem sem `layout`) e `sd-section-feature` (secção com `layout:"feature"`) no HTML gerado —
    as 3 variantes coexistem no mesmo serviço sem quebrar.
  - `/servicos/terras` (sem `sections`): 0 ocorrências de `sd-section-card`/`split`/`feature` —
    confirma que o fallback `sd-description` continua a funcionar, inalterado.
  - `/servicos/comercializacao` (último da lista canónica, caso de wrap-around): secção "Outros
    serviços" mostra exatamente `arroz`, `cereais`, `moageira` — confirma
    `(7+1)%8, (7+2)%8, (7+3)%8` = `0,1,2`, nunca inclui `comercializacao`.
  - Home (`/`): painel do dropdown no HTML contém os 8 links de serviço (na ordem canónica) mais
    o link "Ver todos os serviços" — confirma renderização completa do painel.
- Não corri testes de teclado/hover em navegador real (ambiente sem browser interativo nesta
  sessão) — o `tester` deve validar manualmente: abertura por click, `Enter`/`Espaço` no gatilho,
  `Escape` a fechar e devolver foco, clique fora a fechar, comportamento em viewport mobile
  (acordeão inline sem overlay/miniaturas) e o toggle do menu hambúrguer a resetar `servicesOpen`.

ISSUES (fora do âmbito, não corrigidos):
- Nenhum encontrado que exigisse decisão fora do âmbito definido pelo handoff-26/design-spec-fase2.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: próximo agente é o `tester`. Validar especificamente: (1) os 3 estados
obrigatórios da secção 1e do design-spec (`card`/`split`/`feature`/`bullets ausente`/serviço sem
`sections`) nas páginas `/servicos/arroz`, `/servicos/mecanizacao` e `/servicos/terras`; (2)
alternância de lado da variante split contando só entre secções split (verificar no CSS/DOM se
`sd-section-split--reverse` aparece na 2ª secção split de um serviço, caso existisse mais que uma —
hoje só há 1 split por serviço nos exemplos, o `tester` pode decidir se vale a pena um 3º exemplo
com 2 splits para testar a alternância, ou aceitar como coberto pela lógica do contador); (3)
wrap-around dos relacionados testado com `terras` (posição 4/8, meio da lista) e com o já validado
`comercializacao` (posição 8/8, fim da lista); (4) dropdown do Header por click, teclado
(`Tab`+`Enter`, `Escape`+foco de volta ao gatilho, `ArrowDown`/`ArrowUp` dentro do painel) e em
viewport mobile (redimensionar para <768px, abrir o hambúrguer, confirmar acordeão inline sem
miniaturas); (5) confirmar que `next build` continua limpo após qualquer alteração de teste.

CONTEXT_FOR_NEXT_AGENT: A ordem do array `services` em `content/index.ts` (arroz, cereais,
moageira, terras, campanha, mecanizacao, apoio-tecnico, comercializacao) é a ordem canónica usada
por `relatedServices()` — não reordenar sem intenção (comentário já deixado no código). A regra
`layout`/`bullets` sem `image` está bloqueada no schema Zod (`.superRefine()`), portanto qualquer
JSON de teste que viole isso vai falhar o `next build` com mensagem legível, não silenciosamente.
`resolveSectionLayout()` é o único ponto de derivação do layout — o componente nunca decide
"split"/"feature" por conta própria, só chama o helper. As imagens usadas nas novas secções
reaproveitam ficheiros já existentes em `public/images/services/{arroz,mecanizacao}/gallery-*.svg`
(nenhuma imagem nova foi criada, conforme permitido pelo design-spec 1f). O servidor de produção
local (`npm run start`) foi usado só para validação manual via curl e foi terminado no final da
sessão — o `tester` deve arrancar o seu próprio (`npm run build && npm run start`, ou `npm run
dev`) para testes interativos de teclado/hover/mobile que exigem um browser real.
