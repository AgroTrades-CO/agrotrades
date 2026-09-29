# task-019 — hotfix homepage (estatísticas + vídeo de teste) — handoff 02 (developer)

Workflow: bug-fix, SMALL (só conteúdo). Base: `main` em 6df3c8c. Branch local
`task-019-hotfix-home-stats-video` (worktree `C:\Users\virgilio.jose\source\repos\agrotrades-task-019`).
Substitui o bloqueio do handoff-01, após a decisão D-2 do utilizador (decisions.md).

```
STATUS: READY
SUMMARY: Aplicada a opção D (decisions.md D-2): o item de estatística "100 / Hectares cultivados"
  foi substituído por "20/100" com etiqueta PT "Hectares (cultivados/meta)" / EN
  "Hectares (cultivated/target)". Mantêm-se 4 estatísticas (schema e CMS intactos). O slide de
  vídeo de teste já estava oculto no commit aea617a (handoff-01, D-3). Só conteúdo, sem código.
ARTIFACTS:
  - content/site/home.json — 1 linha alterada (item stats[1]); formatação pré-Tina e CRLF
    preservados.
  - project/state/task-019-hotfix-home-stats-video/decisions.md (escrito pelo Orchestrator,
    incluído no commit).
  - project/state/task-019-hotfix-home-stats-video/handoff-02-developer.md (este ficheiro).
  - (commit anterior aea617a: slide de vídeo visible:false + handoff-01.)
VALIDATIONS:
  - tsc --noEmit: exit 0.
  - eslint .: 7 problemas (4 erros, 3 avisos) = baseline de main, todos pré-existentes em
    ficheiros não tocados; JSON fora do âmbito do ESLint. Sem git stash.
  - npm run build: compilado com sucesso (schema de 4 stats satisfeito).
  - HTML pré-renderizado (.next/server/app/index.html, en.html): stats 2+ / 20/100 / 8 / MZ
    com as etiquetas PT e EN correctas; hero com 2 slides, 2 dots, 0 <iframe>.
  - next start -p 3019, / e /en, medição no browser do item "20/100":
      * 1366px: 4 colunas numa linha; valor numa linha (43px), etiqueta numa linha, sem overflow.
      * 768px: grelha 2x2 (breakpoint mobile); valor numa linha, etiqueta numa linha, sem overflow.
      * 375px: grelha 2x2; valor numa linha (43px), sem overflow, sem scroll horizontal; a
        etiqueta quebra em 2 linhas ("Hectares" / "(cultivados/meta)", idem EN), o que torna a
        1.ª linha da grelha ~21px mais alta. Aceitável: o valor não parte.
      * Extra 320px: valor com 103px de largura em 107px úteis, numa linha, sem scroll horizontal.
    Viewport reposto; servidor parado, porta 3019 livre.
ISSUES:
  - Mobile: etiqueta do 2.º item em 2 linhas (cosmético, não foi pedido alterar CSS).
  - O botão flutuante do WhatsApp sobrepõe-se parcialmente à stats-bar em mobile quando se faz
    scroll até ela. É pré-existente e acontece com qualquer conteúdo.
  - Mantém-se a nota do handoff-01: o payload RSC inclui os dados do slide oculto (não renderizado).
BLOCKERS: nenhum.
REQUIRED_NEXT_ACTION: tester valida / e /en (stats e slider, PT/EN, 375/768/1366), depois
  code-reviewer, depois workflow release com confirmação humana obrigatória antes do Gate 8.
  Nada foi pushed nem merged.
CONTEXT_FOR_NEXT_AGENT:
  - Commits na branch: aea617a (vídeo oculto + handoff-01) e o commit deste handoff (stats).
  - A branch da task-017 (Tina) normalizou home.json (commits 6eb886d, a8bbc06, 1afc9de); as
    duas correcções (slide de vídeo visible:false e stat "20/100") têm de ser reaplicadas ou
    rebaseadas lá.
  - O slider não precisou de código: HeroSlider consome `visibleHeroSlides` e os dots, as setas e
    o autoplay derivam de `slides.length` (verificado no handoff-01: autoplay 0 -> 1 -> 0).
```
