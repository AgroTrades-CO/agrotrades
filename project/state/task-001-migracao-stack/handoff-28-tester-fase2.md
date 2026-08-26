STATUS: APPROVED

SUMMARY: Validados independentemente, via build + curl + inspeção de código/HTML servido (sem
browser interativo), os 8 pontos pedidos da Fase 2. Todos passaram. Interações reais de
hover/click/teclado do dropdown e o acordeão mobile NÃO foram testadas por mim — ver
REQUIRED_NEXT_ACTION.

VALIDATIONS:
1. `npm run build` (Turbopack) — compila, `tsc` limpo, 30 páginas geradas sem erros. Corrido 3x
   (build inicial, build com mutação inválida no ponto 6, rebuild final após restauro) — todos
   consistentes.
2. `/servicos/arroz` (via `npm run start` + `curl`): as 3 variantes coexistem no HTML — 1x
   `sd-section-card`/`sd-section-card--alt` (secção 3, sem imagem), 1x `sd-section-split`/
   `sd-section-split-image`/`sd-section-split-text` (secção 1), 1x `sd-section-feature`/
   `sd-section-feature-image`/`sd-section-feature-text`/`sd-section-feature-title` (secção 2). Grep
   inicial mostrou contagens duplicadas (2x cada classe) — confirmado que é o payload RSC de
   hidratação do Next.js embutido no mesmo HTML, não uma duplicação real de DOM (1 ocorrência real +
   1 no script de serialização). `app/globals.css:397` confirma `.sd-section-feature { background:
   var(--green-light); ... }` — classe presente no HTML de `/servicos/arroz`, logo o fundo é
   efetivamente aplicado.
3. `/servicos/terras` (serviço sem `sections` no JSON): 0 ocorrências de `sd-section-card`/`split`/
   `feature`, 1x `sd-description` — fallback intacto, sem quebra. Página responde 200.
4. Relacionados testados em 2 páginas: `/servicos/terras` (posição 4/8, meio da lista canónica
   `arroz,cereais,moageira,terras,campanha,mecanizacao,apoio-tecnico,comercializacao`) devolve
   exatamente `campanha, mecanizacao, apoio-tecnico` (índices 4,5,6); `/servicos/comercializacao`
   (posição 8/8, último — testa wrap-around) devolve exatamente `arroz, cereais, moageira` (índices
   0,1,2 via `(7+n)%8`). Nenhum dos dois inclui o serviço atual. Título da secção confirmado como
   "Outros serviços" (vindo de `servicePage.json.relatedHeading`, não hardcoded — grep no ficheiro
   fonte confirma o campo).
5. Dropdown do Header — código-fonte (`components/Header.tsx`): confirmados `aria-haspopup="true"`,
   `aria-expanded={servicesOpen}`, `aria-controls="services-dropdown"` no botão; `onKeyDown` com
   `ArrowDown`/`ArrowUp`/`Escape` tanto no botão quanto no painel. HTML servido da homepage:
   `nav-services-panel` contém os 8 links de serviço na ordem canónica completa + link "Ver todos os
   serviços"; os atributos `aria-haspopup`/`aria-expanded`/`aria-controls` estão presentes no HTML
   real, não só no código-fonte.
6. Validação Zod `.superRefine()`: mutado `content/services/arroz.json` sections[0] para
   `layout:"split"` sem `image` (removendo o `image` existente). `npm run build` falhou de forma
   limpa e legível: `Conteúdo inválido em "content/services/*.json": - 0.sections.0.layout: 'layout'
   só pode ser usado numa secção que tenha 'image'; sem imagem a secção é sempre o cartão de texto` +
   instrução de correção. Ficheiro restaurado byte-a-byte ao estado original (confirmado por
   releitura completa do ficheiro) e `npm run build` voltou a passar limpo. `content/` é diretório
   não rastreado no git (`??`) nesta fase, por isso `git diff` não se aplica a ele, mas confirmei a
   igualdade de conteúdo linha a linha com a leitura original. Nota operacional: o build falhado a
   meio deixou `.next` num estado que serviu 500 nas páginas estáticas (`/servicos`, `/quem-somos`,
   `/campanha`, `/contactos`) até correr um rebuild limpo — não é um bug do código, é comportamento
   esperado de correr `next start` sobre um `.next` de um build que falhou a meio; resolvido com
   rebuild completo antes de continuar os testes.
7. Grep por ranges Unicode de emoji (`\x{1F300}-\x{1FAFF}`, `\x{2600}-\x{27BF}`, etc.) em todos os
   ficheiros novos/alterados da Fase 2 (schemas, content/index.ts, JSONs de conteúdo, icons.tsx,
   ServiceCard.tsx, ServicesListContent.tsx, ServiceDetailContent.tsx, Header.tsx, globals.css) — 0
   ocorrências.
8. Regressão pós-rebuild limpo: `/` (200), `/servicos` (200), `/quem-somos` (200), `/campanha`
   (200), `/contactos` (200), `/servicos/nao-existe` (404), `/home` (308 redirect para `/`) — todos
   OK.

ISSUES:
- Nenhum edge case adicional óbvio não coberto pelo handoff-27 encontrado nos limites do que é
  verificável sem browser. Um ponto a notar (não bloqueante): a alternância de lado da variante
  "split" (`sd-section-split--reverse`) só tem hoje 1 secção split por serviço nos exemplos
  (`arroz`, `mecanizacao`), pelo que a lógica do contador `splitCount` não foi exercitada com 2+
  splits no mesmo serviço em conteúdo real — só inspecionada no código-fonte
  (`ServiceDetailContent.tsx`). Considero aceitável como coberto pela lógica (contador incrementado
  por secção split, `% 2` determina reverse), mas fica registado para o Code Reviewer/QA avaliar se
  vale a pena um 3º exemplo de conteúdo antes do cutover.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: Antes de dar esta fase por definitivamente fechada, o Orchestrator (ou quem
tiver acesso a um browser real) tem de validar interativamente o que está fora do meu alcance nesta
sessão (sem browser interativo):
- Abrir o dropdown "Serviços" por hover e por click.
- Navegação por teclado real: `Tab` até ao botão, `Enter`/`Espaço` a abrir, `ArrowDown`/`ArrowUp`
  a navegar os 9 itens do painel, `Escape` a fechar E a devolver o foco visível ao botão gatilho,
  clique fora do painel a fechar.
- Viewport mobile (<768px): abrir o menu hambúrguer, confirmar que "Serviços" expande inline como
  acordeão (sem overlay, sem miniaturas) e que fechar o hambúrguer principal reseta o estado do
  acordeão.
Todo o resto (build, HTML servido, código-fonte, validação Zod, regressão) está aprovado por mim.

CONTEXT_FOR_NEXT_AGENT: `.next` fica num estado potencialmente inconsistente se um build falhar a
meio (visto no ponto 6) — se o Code Reviewer ou QA correrem `next start` sobre um build que falhou,
podem ver 500 em páginas estáticas; basta um `npm run build` limpo antes de `npm run start`. Ordem
canónica de `services` em `content/index.ts` confirmada como
`arroz, cereais, moageira, terras, campanha, mecanizacao, apoio-tecnico, comercializacao` — usada
tal e qual pelos testes de wrap-around acima. Nenhum ficheiro de código foi alterado por mim; a
única escrita foi a mutação temporária de `content/services/arroz.json` no ponto 6, já restaurada e
verificada.
