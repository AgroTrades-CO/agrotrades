STATUS: COMPLETED
SUMMARY: Desenhada a especificação visual/estrutural completa para as três áreas pedidas, dentro da
paleta/tipografia já estabelecida (verde/laranja/terra, Playfair Display + DM Sans), sem emojis
(ícones sempre SVG, seguindo o padrão de `components/icons.tsx`), usando placeholders locais de
imagem conforme decisão já tomada (sem dependência externa, sem alterar CSP). (1) Cartões de
`/servicos` ganham imagem de capa 640x360 no topo (16:9), com o ícone existente sobreposto como
badge circular no canto inferior-esquerdo da imagem — resto do cartão inalterado. (2) Página de
detalhe de serviço: hero com imagem de fundo 1600x600 + overlay em gradiente verde (reaproveita os
tons do `.hero` existente, não preto genérico) para legibilidade; descrição com fallback duplo —
bloco único atual quando não há `sections`, ou parágrafo introdutório + 2-3 blocos temáticos com
fundo alternado (off-white/white) e ícone+título próprios quando há; galeria de 3-6 imagens 480x360
(4:3) abaixo do corpo, condicional (secção inteira desaparece se vazia); Destaques mantidos
pixel-a-pixel iguais. (3) Quem Somos: texto institucional sem mudança de layout (só mais
parágrafos); nova secção de 6 valores (Missão/Visão/Sustentabilidade/Parceria/Inovação/Excelência)
reaproveitando o padrão `.pillar`/`.pillar-grid` já existente, com mapeamento fechado de ícones
(4 novos: target, eye, bolt, trophy; 2 reaproveitados: leaf, handshake); equipa redesenhada com
regra "primeiro membro = cartão destacado (foto 200px, bio longa, badges `.about-tag`), restantes
= grid `.team-grid` existente com acréscimos opcionais de cargo em caps pequenas + badges menores",
preparada para crescer além de 3 membros sem alteração de CSS (grid `auto-fit`). Todos os estados
de dados incompletos (placeholder de equipa sem bio/badges, serviço sem sections/gallery/imagem)
foram especificados como degradação graceful, nunca erro visual.

ARTIFACTS:
- project/state/task-001-migracao-stack/design-spec-redesign.md (especificação completa, secção a
  secção, com dimensões de imagem, cores, espaçamentos, mapeamento de ícones e resumo dos novos
  campos de conteúdo necessários)
- Este handoff.

ISSUES (decisões de UX fechadas, a confirmar tecnicamente por outros agentes):
1. Mapeamento de ícones dos 6 valores institucionais está fechado (ver tabela na spec) — mas
   requer 4 novos valores no enum `iconName` (`target`, `eye`, `bolt`, `trophy`) e os respetivos
   componentes SVG em `components/icons.tsx`, seguindo o `Base` wrapper já existente (24x24,
   stroke currentColor, strokeWidth 1.6). Não é uma decisão de UX em aberto, é apenas trabalho de
   implementação pendente de confirmação do `software-architect` quanto ao nome exato no enum.
2. Ícone de cada secção da descrição (`sections[].icon`) é opcional no conteúdo — a spec define
   fallback para `service.icon` quando ausente, para nunca renderizar uma secção sem ícone.
3. Bio curta da equipa no grid pequeno reaproveita o campo `frase` já existente (não cria campo
   novo `bio` para todos — só o cartão destacado precisa de `bio` longa nova); badges são campo
   novo opcional em ambos os tamanhos de cartão.
4. Limite `teamSchema.max(3)` deve ser removido — sinalizado como necessário para o layout fazer
   sentido com crescimento futuro, mas a alteração de schema é do `software-architect`/`developer`,
   não deste agente.

BLOCKERS: Nenhum. A ambiguidade de origem de imagens já estava resolvida antes deste agente
começar (placeholders locais, decisão comunicada no contexto da tarefa).

REQUIRED_NEXT_ACTION: Próximo agente é o `software-architect` (ou diretamente o `developer`, se o
Orchestrator considerar que as alterações de schema descritas no resumo final da spec — novos
campos em `services`, novo enum de ícones, novos campos em `team`, remoção do `.max(3)` — não
exigem uma passagem formal de arquitetura por serem extensões aditivas dentro do modelo de
conteúdo já fechado). Recomenda-se pelo menos uma confirmação rápida do `software-architect` sobre:
(a) os 4 novos valores de `iconName`, (b) a forma exata de `badges` no schema (`{pt,en}` vs array
de string simples), (c) tornar `teamSchema` sem limite máximo. Depois disso, o `developer` implementa
seguindo a spec ficheiro a ficheiro.

CONTEXT_FOR_NEXT_AGENT: Estados obrigatórios a implementar, sem exceção — (1) serviço sem
`sections` preenchido → mostra `description` como bloco único, tal como hoje, nunca uma secção
vazia; (2) serviço sem `gallery` → secção de galeria inteira não é renderizada, nunca grid vazio;
(3) membro da equipa sem `bio`/`badges` → cartão mostra só os campos existentes, sem placeholders
textuais tipo "—"; (4) `bannerImage` é campo obrigatório (build falha sem ele, via Zod, como já
acontece com outros campos bilingues) — não há estado "sem imagem" a desenhar na hero nem no
cartão da lista; (5) toda imagem tem `alt` não vazio em pt/en, nunca decorativo/vazio, exceto o
ícone SVG sobreposto no cartão de serviço (esse é puramente decorativo). Nenhum destes estados usa
emoji em nenhum ponto (ícones sempre SVG do enum `iconName`). Ler a spec completa em
design-spec-redesign.md antes de implementar — contém dimensões exatas, cores herdadas de
`app/globals.css` e reaproveitamento deliberado de classes CSS existentes (`.pillar`,
`.pillar-grid`, `.about-tag`, `.team-grid`, `.team-card`) para minimizar CSS novo.
