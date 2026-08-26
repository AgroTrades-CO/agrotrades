STATUS: COMPLETED
SUMMARY: Especificados os 4 pontos de feedback do utilizador sobre o preview, dentro da identidade
visual já estabelecida (verde/laranja, Playfair Display + DM Sans, cartões arredondados), sem
emojis e sem dependências novas. (1) Destaques — sem alteração, confirmado. (2) Secções do
detalhe de serviço ganham imagem opcional por secção (independente entre secções do mesmo
serviço) com duas novas variantes de layout quando há imagem — "split" (imagem+texto lado a lado,
alternando o lado só entre secções desta variante) e "feature" (faixa full-width fundo
`--green-light` para uma secção-chave), ambas com lista de bullets opcional; secção sem imagem
mantém o cartão atual, inalterado. (3) "Outros serviços" no detalhe: critério de seleção fechado
como "os 3 próximos serviços na ordem canónica do array, com wrap-around" (determinístico,
alternativas aleatório/curadoria manual explicitamente rejeitadas e justificadas), reutilizando o
mesmo cartão de `/servicos` (recomenda-se extrair para componente partilhado). (4) Dropdown
"Serviços": gatilho vira `<button>` com chevron, abre por hover+click+teclado (Enter/Espaço,
Escape fecha e devolve foco, clique fora fecha), painel 2 colunas com miniatura 36x36 +
título por serviço + link final destacado "Ver todos os serviços"; em mobile, expansão inline
tipo acordeão dentro do menu hambúrguer, sem overlay, sem miniaturas (menos peso).

ARTIFACTS:
- project/state/task-001-migracao-stack/design-spec-fase2.md (especificação completa, secção a
  secção, com CSS/estrutura/estados/acessibilidade e lista de novos campos de conteúdo).
- Este handoff.

ISSUES (decisões de UX fechadas, a confirmar tecnicamente):
1. Regra "layout só pode estar presente se image também estiver" — recomendo `.refine()` no
   schema; se o `software-architect` preferir não bloquear a nível de schema, o developer deve
   pelo menos ignorar `layout` quando `image` está ausente (nunca renderizar split/feature sem
   imagem).
2. `IconChevronDown` recomendado a ficar FORA do enum `iconName` (é chrome de navegação, não
   conteúdo escolhível via CMS) — sinalizado para o `software-architect` confirmar, por ser o
   primeiro ícone do projeto que não passa pelo enum.
3. Texto exato dos novos rótulos ("Outros serviços", "Ver todos os serviços") é sugestão deste
   agente, não uma decisão de copy fechada — o Product Analyst/utilizador pode ajustar sem impacto
   estrutural.
4. Critério de seleção dos relacionados ("próximos 3 com wrap") é uma decisão de UX/produto
   fechada por este agente, com justificação registada na spec (determinismo > aleatoriedade para
   SSG, e é o pedido mínimo do utilizador sem novo campo de conteúdo). Pode ser revisto no futuro
   para curadoria manual se o catálogo crescer muito além de 8 itens.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION: próximo é o `software-architect`, para confirmar: (a) extensão de
`serviceSectionSchema` (`image?`, `layout?`, `bullets?`, e a regra de validação cruzada
layout↔image), (b) novo campo `relatedHeading` em `servicePageSchema`, (c) novo campo
`servicesViewAll` em `navSchema`, (d) decisão sobre `IconChevronDown` dentro/fora do enum
`iconName`. Nenhuma destas extensões altera CSP, hosting, routing por locale ou o modelo de
conteúdo (continuam JSON versionados, `{pt,en}`, validados por Zod) — são aditivas ao schema já
existente do redesign anterior (handoff-19). Depois disso, o `developer` implementa seguindo a
spec ficheiro a ficheiro, incluindo a extração recomendada de `ServiceCard` para componente
partilhado.

CONTEXT_FOR_NEXT_AGENT: Estados obrigatórios a implementar sem exceção — (1) secção sem `image` →
cartão atual (`.sd-section-card`), nunca split/feature; (2) `image` sem `layout` → default
`"split"`; (3) `layout: "feature"` sem `image` → inválido/ignorado, nunca renderizado; (4)
`bullets` ausente → nada renderizado, sem espaço reservado; (5) alternância de lado da variante
"split" conta-se só entre secções "split" (não entre todas as secções do serviço); (6) "Outros
serviços" mostra sempre exatamente 3 cartões (catálogo fixo de 8, `.length(8)` já no schema, seleção
determinística nunca vazia); (7) dropdown do Header: `aria-haspopup`/`aria-expanded` sempre
sincronizados, foco devolvido ao gatilho ao fechar com Escape, miniatura do painel é decorativa
(`alt=""`), mobile usa expansão inline sem overlay e sem miniaturas. Ler a spec completa em
design-spec-fase2.md antes de implementar — contém CSS exato, nomes de classes novas e reuso
deliberado de classes já existentes (`.sd-check`, `.services-grid`, `.nav-links`, `.section-title`)
para minimizar CSS novo.
