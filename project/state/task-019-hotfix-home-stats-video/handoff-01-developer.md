# task-019 — hotfix homepage (estatísticas + vídeo de teste) — handoff 01 (developer)

Workflow: bug-fix, SMALL (só conteúdo). Base: `main` em 6df3c8c (merge do PR #19, inclui c4eb7dc + 92bf8bb).
Worktree: `C:\Users\virgilio.jose\source\repos\agrotrades-task-019`, branch `task-019-hotfix-home-stats-video`.

```
STATUS: BLOCKED
SUMMARY: Parte 2 (vídeo) feita e verificada: o slide de vídeo placeholder (youtubeId dQw4w9WgXcQ)
  passou a "visible": false em content/site/home.json. Parte 1 (estatísticas 20 + 100) NÃO foi
  aplicada: o schema de conteúdo exige exactamente 4 estatísticas
  (content/schemas/index.ts:326 `.length(4, ...)`, e public/admin/config.yml:377-381 no Decap com
  min: 4 / max: 4). Com 5 itens o `next build` falha ("stats.items: têm de existir exactamente 4
  estatísticas na stats-bar"). Além disso, o CSS da stats-bar foi desenhado para 4 itens (ver
  VALIDATIONS). Isto exige decisão do utilizador, não de developer.
ARTIFACTS:
  - content/site/home.json — 1 linha: slide de vídeo "visible": true -> false (formatação e CRLF
    preservados, diff mínimo).
  - project/state/task-019-hotfix-home-stats-video/handoff-01-developer.md (este ficheiro).
VALIDATIONS:
  - npm ci --ignore-scripts (H-V5); o prebuild copia o Decap no build normalmente.
  - tsc --noEmit: exit 0.
  - eslint .: 7 problemas (4 erros, 3 avisos), idêntico ao baseline de main (pré-existentes em
    app/(pt)/layout.tsx, app/en/layout.tsx, app/not-found.tsx, components/Header.tsx). O único
    ficheiro alterado é JSON, fora do âmbito do ESLint. Nota: para o baseline usei `git stash` /
    `git stash pop` (antes da indicação do coordenador para não o usar); o pop foi limpo e a lista
    de stash está vazia.
  - npm run build (estado commitado): compilado com sucesso.
  - HTML pré-renderizado (.next/server/app/index.html e en.html): 2 slides, 2 dots, 0 <iframe>;
    estatísticas mantêm 2+ / 100 / 8 / MZ (inalteradas).
  - next start -p 3019, / e /en (browser): 2 slides, 2 dots ("Go to slide 1/2"), setas
    presentes; autoplay 0 -> 1 -> 0 (antes parava no slide de vídeo); setas seguinte/anterior
    OK; 0 iframes. Servidor parado no fim, porta 3019 livre.
  - Experiência NÃO commitada (schema temporariamente a 5 + stats 20 "Hectares cultivados" /
    100 "Meta de hectares" | EN "Hectares cultivated" / "Hectares target"): build OK, texto
    correcto PT/EN, e layout:
      * desktop 1366px: 5 colunas numa linha, OK.
      * 769-~888px (grid auto-fit minmax(160px)): 4 + 1 — o 5.º item fica sozinho numa 2.ª
        linha e o 4.º tem border-right na borda direita.
      * mobile 375px (repeat(2,1fr), `.stat-item:nth-child(2)` sem border): 2+2+1 — "MZ"
        órfão na 3.ª linha e border-right vadio no 4.º item ("8").
    Revertido (schema e home.json) antes do commit.
ISSUES:
  - O payload RSC da homepage continua a incluir os dados do slide oculto (youtubeId e caption),
    porque HomeContent passa `hero.slider` inteiro ao HeroSlider. Não é renderizado (sem iframe),
    é comportamento pré-existente de qualquer item visible:false e o conteúdo é público; fica
    anotado, não corrigido (exigiria alterar componente).
  - A caption do vídeo ainda menciona "via Decap CMS" (irrelevante enquanto oculto).
BLOCKERS:
  - Estatísticas: a decisão (b) (5 itens) colide com a regra de 4 itens no schema/CMS e com o
    layout 2x2 do mobile. Opções para o utilizador escolher:
      A) Manter 4 itens, só conteúdo: "20" com rótulo "Hectares cultivados (meta: 100)" /
         "Hectares cultivated (target: 100)". Diff de 1 linha, sem código. Rótulo mais longo
         (quebra em 2 linhas em mobile, aceitável).
      B) 5 itens: alterar content/schemas/index.ts (length 4 -> 5 ou min 4/max 5),
         public/admin/config.yml (min/max) e o CSS da stats-bar (mobile: 5.º item a ocupar 2
         colunas e borders por nth-child(2n); tablet: evitar 4+1). Toca código/schema de
         conteúdo — deixa de ser só conteúdo; pede code-review mais cuidado.
      C) Manter 4 trocando outro item (ex.: esconder "MZ Distrito de Moma") — explicitamente
         excluído sem decisão do utilizador.
      D) Valor composto num só item, ex.: valor "20/100" com rótulo "Hectares (actual/meta)".
    Recomendação do developer: A (menor risco para hotfix em produção), B mais tarde se
    desejado (task-017 já mexe no modelo de conteúdo).
REQUIRED_NEXT_ACTION: Orchestrator leva a decisão das estatísticas ao utilizador (A/B/C/D).
  Depois da decisão: developer aplica, depois tester, depois code-reviewer, depois release
  (confirmação humana obrigatória). A parte do vídeo pode seguir já para tester se se quiser
  separar, mas o objectivo do hotfix (informação errada na homepage) só fica resolvido com as
  estatísticas.
CONTEXT_FOR_NEXT_AGENT:
  - Nada foi pushed nem merged. Branch local task-019-hotfix-home-stats-video.
  - home.json em main mantém a formatação pré-Tina com CRLF no working tree (LF no índice,
    core.autocrlf=true). Editar linha a linha para manter diff mínimo.
  - A branch da task-017 (Tina) normalizou home.json (commits 6eb886d, a8bbc06, 1afc9de); esta
    correcção (e a das estatísticas) terá de ser reaplicada/rebaseada lá, e o schema de 4 itens
    também deve ser revisto no modelo Tina se se escolher a opção B.
  - Verificação do slider: HeroSlider consome `visibleHeroSlides` (content/index.ts:160); dots,
    setas e autoplay derivam de `slides.length`, por isso esconder o vídeo não exige código.
```
