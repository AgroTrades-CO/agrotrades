# AGRO TRADES — instruções para o Claude

Site institucional da AGRO TRADES, LDA (Nampula/Moma, Moçambique): Next.js (App Router, TypeScript),
conteúdo em ficheiros JSON em `content/` (PT/EN, validado por Zod), alojamento na Vercel.

## Forma de trabalhar

- Trabalha diretamente: implementa, testa e verifica tu próprio. Sem subagentes, salvo pedido
  explícito do utilizador.
- Sem gates, handoffs ou ficheiros de estado. A lista de tarefas pendentes fica fora do repositório
  (`../agrotrades-docs/TAREFAS.md`).
- Tarefas maiores: apresenta um plano curto e espera pelo sim antes de implementar.

## Regras que se mantêm

- O repositório é **público**: nunca commitar segredos, valores de `.env.local`, emails pessoais,
  nem fotos originais enviadas pelo cliente (só versões otimizadas e aprovadas em
  `public/images/uploads/`).
- Documentação de trabalho não vai para o GitHub.
- `main` está protegido: alterações entram por PR. Nunca fazer push, merge ou apagar ramos sem
  confirmação explícita do utilizador.
- Nunca usar `git stash` sem nome (a pilha é partilhada entre worktrees).
- Conteúdo em PT e EN; manter paleta (`--green`, `--orange`, `--earth`) e tipografia
  (Playfair Display + DM Sans).
- Sem emojis em código, conteúdo, UI ou commits. Ícones em SVG.
- Nunca mostrar preços no site. Não mencionar o iF Social Impact Prize.
- Novas dependências ou serviços externos: só com free tier real e suficiente.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
