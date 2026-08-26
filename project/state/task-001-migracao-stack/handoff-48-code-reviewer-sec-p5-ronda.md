# Handoff 48 — Code Reviewer — Ronda SEC-P5-01 a SEC-P5-18

**Task:** 001-migracao-stack
**Agente:** code-reviewer
**Âmbito:** revisão de qualidade técnica de todos os ficheiros alterados na ronda de correções de
segurança da Fase 5 (SEC-P5-01 a SEC-P5-18), depois do Gate 4 (security) concedido em
`handoff-47-security-engineer-gate4-final.md`.

---

STATUS: APPROVED

SUMMARY: A implementação em si, ficheiro a ficheiro, tem boa qualidade técnica: comentários extensos
e corretos (com duas exceções pré-conhecidas, não bloqueadoras), tratamento de erros consistente com
o padrão já estabelecido no projeto (erro genérico ao cliente, detalhe só nos logs do servidor), e as
duas confirmações específicas pedidas pelo security-engineer estão intactas no código. O bloqueio de
processo anterior — falta de validação do Tester para `components/OrganizationJsonLd.tsx` e
`content/schemas/index.ts` — está resolvido: `handoff-48-tester-sec-p5-11-14.md` (APPROVED) testou
`escapeJsonLd()` por execução contra 11 edge cases reais (string vazia, `</script>` em várias
capitalizações, U+2028/U+2029, payload de 50000 chars, acentuação) — todos PASS — e confirmou build
limpo com JSON.parse a suceder no HTML gerado em `/` e `/en`. O único ponto que o tester deixou por
fazer por execução (o helper `httpUrl` contra os 4 valores reais de produção) foi agora fechado por
mim, por leitura direta do schema e do conteúdo real — ver VALIDATIONS 5. Nada impede aprovação.

ARTIFACTS (ficheiros revistos):
- `app/api/auth/route.ts`
- `app/api/auth/callback/route.ts`
- `lib/auth/env.ts`
- `next.config.mjs`
- `public/admin/config.yml`
- `components/OrganizationJsonLd.tsx`
- `content/schemas/index.ts`
- `.github/workflows/media-guard.yml`
- `.github/CODEOWNERS`
- `content/site/contacts.json`, `content/site/meta.json` (só leitura, para fechar o gap do `httpUrl`)

VALIDATIONS:
1. **Confirmação (i) pedida pelo security-engineer** — `app/api/auth/callback/route.ts` linha 55:
   `const cookiesSecure = allowedOrigin ? allowedOrigin.startsWith("https:") : true;`. Fallback para
   `true` quando `config`/`allowedOrigin` é `null` está intacto, comentado corretamente (linhas
   50-54), e é recalculado dentro de `GET` a cada pedido — não há estado partilhado entre pedidos.
   **Confirmado.**
2. **Confirmação (ii) pedida pelo security-engineer** — a entrada `/admin/:path*` em
   `next.config.mjs` (linhas 146-192) continua autossuficiente: repete `default-src`, `object-src`,
   `frame-ancestors`, etc., por inteiro, e o comentário (linhas 40-56 e 147-150) explica corretamente
   o comportamento "a última entrada que faz match substitui, não combina" do Next.js. A ordem no
   array (`/:path*` → `/images/uploads/:path*` → `/admin/:path*`) está correta e comentada.
   **Confirmado.**
3. **SEC-P5-16, dois comentários — reconfirmo que continuam desatualizados**, exatamente como o
   security-engineer registou:
   - `public/admin/config.yml` linhas 50-52: afirma que a defesa "real e efetiva" contra um SVG com
     script é a CSP de `next.config.mjs`. Isto já não é exato — o próprio comentário de
     `next.config.mjs` (linhas 133-136) documenta que essa CSP é contornável via `%2F` codificado
     (SEC-P5-09), e a mitigação real passou a ser o `media-guard` (required check). O comentário do
     `config.yml` não foi atualizado para refletir isso.
   - `next.config.mjs` linhas 137-139: afirma "a mitigação real é um GitHub Action (required
     check)... **ainda por desenhar/adicionar**". Isto é falso desde a implementação do
     `media-guard.yml` (handoff-43) — o workflow já existe, já está em `main`, já é required check
     confirmado (handoff-47). O comentário devia nomear o ficheiro real, não descrevê-lo como futuro.
   Concordo com a classificação `low`/não-bloqueador do security-engineer, mas registo como a quarta
   vez que isto é assinalado sem correção — ver ISSUES.
4. Build/lint: não corri `npm run build` nem `npm run lint` eu próprio (revisão de código, não de
   comportamento) — os handoffs do developer/tester/devops já documentam builds limpos para os mesmos
   ficheiros e não encontrei nada no código que sugira regressão desde então.
5. **Fecho do gap deixado pelo Tester — `httpUrl` contra os 4 valores reais de produção**, por
   leitura direta:
   - `content/schemas/index.ts` linhas 33-37: `httpUrl = z.string().trim().url().regex(/^https?:/, ...)`,
     aplicado a `whatsapp.url` (linha 465), `mapEmbedUrl`/`mapsLink` (linhas 474-475) e `meta.siteUrl`
     (linha 512).
   - `content/site/contacts.json`:
     - `whatsapp.url = "https://wa.me/258841031220"` — começa por `https:`, sem espaços, sem
       maiúsculas indevidas. Passa.
     - `mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3784.1234567890!..."`
       (query string longa com `!`/`%`/`z`) — começa por `https:`, string bem formada; `z.string().url()`
       (validação já existente antes desta ronda) também a aceita, pelo que o `.regex()` adicional não
       introduz nenhuma restrição nova relevante aqui. Passa.
     - `mapsLink = "https://maps.google.com/?q=Rua+de+Tete+370+Nampula+Mocambique"` — começa por
       `https:`. Passa.
   - `content/site/meta.json`: `siteUrl = "https://agrotrades.co.mz"` — começa por `https:`, sem
     barra final (consistente com o comentário do schema, linha 505-511). Passa.
   Os 4 valores reais começam literalmente por `https:` em minúsculas, sem espaço/tab antes do
   esquema (o `.trim()` não tem nada a remover) e sem variante tipo `Https:`/`HTTPS:`. Nenhum falha o
   regex `^https?:` mais apertado, e nenhum já falhava o `.url()` anterior. Preocupação original (um
   regex mais apertado podia rejeitar um valor legítimo de produção) não se materializa nos dados
   reais atuais.

ISSUES:

- **[SUGESTÃO]** `public/admin/config.yml` linhas 50-52 — comentário desatualizado (ver VALIDATIONS
  3). Já reportado 4 vezes (SEC-P5-16); não bloqueia, mas o developer devia corrigir na próxima
  alteração a este ficheiro.
- **[SUGESTÃO]** `next.config.mjs` linhas 137-139 — comentário descreve o GitHub Action como "ainda
  por desenhar/adicionar" quando `.github/workflows/media-guard.yml` já existe e está em `main`.
  Trocar por uma referência direta ao ficheiro.
- **[SUGESTÃO]** `.github/workflows/media-guard.yml` linhas 116-120 — a função `fail(msg)` referencia
  `failures` antes de `const failures = []` ser declarado no ficheiro (funciona por hoisting de função
  + a chamada só acontecer depois da declaração, mas a ordem de leitura é confusa). Sugiro mover
  `const failures = [];` para antes da definição de `fail`, só por legibilidade — não é um defeito
  funcional.
- Nenhum outro problema de qualidade, tratamento de erro ou duplicação encontrado nos restantes
  ficheiros (`app/api/auth/route.ts`, `app/api/auth/callback/route.ts`, `lib/auth/env.ts`,
  `.github/CODEOWNERS`). Tratamento de erro é consistente com o padrão do projeto (erro genérico ao
  cliente, motivo só em log de servidor) em toda a ronda.

BLOCKERS: Nenhum.

REQUIRED_NEXT_ACTION:
1. Não bloqueante, mas registo para o `developer`: corrigir os dois comentários SEC-P5-16
   (`public/admin/config.yml` ~50-52, `next.config.mjs` ~137-139) na próxima alteração a qualquer um
   destes ficheiros.
2. Não bloqueante: considerar reordenar `failures`/`fail` em `.github/workflows/media-guard.yml`
   (linhas 116-120) por legibilidade.

CONTEXT_FOR_NEXT_AGENT: Nada — este é o último passo do fast path. Gate 5 (code review) concedido.
Todos os ficheiros da ronda SEC-P5-01 a SEC-P5-18 estão aprovados, incluindo os dois que tinham ficado
pendentes de validação do Tester (`components/OrganizationJsonLd.tsx`, `content/schemas/index.ts`),
agora fechados com Tester APPROVED + confirmação por leitura do `httpUrl` contra dados reais de
produção (ver VALIDATIONS 5).
