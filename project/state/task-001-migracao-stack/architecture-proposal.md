# Proposta de Arquitetura — Migração AgroTrades para stack dinâmica de custo zero

**Task:** 001-migracao-stack
**Agente:** software-architect (Gate 2)
**Versão:** 5 — **fecha os achados SEC-01 a SEC-09 e as ambiguidades AMB-01 a AMB-08 da revisão
antecipada do `security-engineer`** (`handoff-03-security-engineer-preview.md`). **Revisão v6
(2026-09-26, task-007): Fase 6 cancelada e cookie de sessão removido** — ver histórico de versões.
**Estado:** decisões de stack **FECHADAS pelo utilizador** (secção 0.1). O desenho técnico que delas
decorre continua a ser proposta do Architect.
**Base:** `project/context.md`, `requirements.md` (FR-01..FR-17, NFR-01..NFR-06, AC-01..AC-14),
`handoff-01-product-analyst.md`, `handoff-03-security-engineer-preview.md`.

> **Histórico de versões.**
> **v1** — Astro + JSON no repositório + Netlify + Decap CMS diferido.
> **v2** — Next.js + Vercel + Firestore + Firebase Auth + Cloudinary + painel `/admin` próprio.
> **v3** — Decap CMS com backend GitHub; conteúdo e media em ficheiros versionados.
> **v4** — acrescenta o ecrã próprio de gestão de utilizadores em `/admin/users`.
> **v5** — não altera a stack nem o âmbito. **Fecha as lacunas de segurança** encontradas na
> revisão antecipada do desenho: nove achados (dois `high`) e oito ambiguidades.
> **v6 (2026-09-26, task-007-remove-unused-session)** — **Fase 6 cancelada e cookie de sessão
> removido; gestão de editores passa para a Organização GitHub** (convites nativos, 2FA obrigatório,
> audit log; editores = papel Write; administradores = owners da organização). Aprovado pelo
> utilizador em 2026-09-26. Motivo: a Fase 6 exigia a credencial mais privilegiada do sistema
> (`Administration: write`) para replicar funções que a organização já fornece nativamente; e o
> cookie de sessão emitido na Fase 5 não tinha nenhum consumidor. O texto das secções afetadas
> **mantém-se como registo**, marcado "REVOGADO (task-007)" — não implementar. Implementação
> original da sessão recuperável no commit `9acc5c1`.
>
> **O que a v5 muda, em substância.** A v4 tinha os vetores certos identificados pelas razões
> certas, mas assentava numa premissa que não enunciava: que manter a allowlist fora do repositório
> bastava para separar editor de administrador. Não basta — **quem controla o código que lê o
> segredo, controla o segredo**, e um editor tem `push` no repositório de onde a Vercel constrói
> esse código (SEC-01). A v5 fecha esse caminho por configuração, por decisão do utilizador, e
> transforma em restrições vinculativas um conjunto de controlos que estavam escritos como
> recomendações. Vários pontos que a v4 deixava a "validado", "expiração curta" ou "guardas simples"
> passam a ter regra, número e local de aplicação.

---

## 0.1 Decisões finais do utilizador (fechadas, não questionar)

| # | Decisão | Estado |
|---|---|---|
| 1 | **Framework: Next.js** (App Router) | Confirmado |
| 2 | **Hosting: Vercel** — risco do plano Hobby (uso não-comercial) exposto e **aceite** | Confirmado, risco assumido |
| 3 | **Gestão de conteúdo: Decap CMS**, backend **`github`** | Confirmado |
| 4 | **Conteúdo: ficheiros JSON/MDX versionados no repositório** | Confirmado |
| 5 | **Editores autenticam-se com conta GitHub pessoal**; autorização = acesso de escrita ao repositório | Confirmado |
| 6 | **Proxy OAuth GitHub como função serverless na Vercel** | Confirmado |
| 7 | **Imagens e vídeos no próprio repositório**, não Cloudinary | Confirmado |
| 8 | **Âmbito de conteúdo editável: TUDO** | Confirmado |
| 9 | Repositório Git ainda não existe, **será criado** | Pré-requisito da Fase 0 |
| 10 | **Repositório público** | Confirmado — ver 7A.8 |
| 11 | **Acesso inicial: uma única pessoa** com permissão de escrita | Confirmado |
| 12 | **Ecrã próprio de gestão de utilizadores** em `/admin/users` | **Revogada (task-007, 2026-09-26)** — gestão feita na Organização GitHub |
| 13 | **Repositório único** (código + conteúdo juntos), **não** separado — com as mitigações do SEC-01 como restrições vinculativas | **Novo na v5** — decidido pelo utilizador após lhe ser apresentado o SEC-01. Ver 3.3 e 9.8 |

### 0.2 O que desapareceu da v2 (não implementar, não referenciar)

Firestore · Firebase Auth · Firebase Admin SDK · Cloudinary · painel `/admin` construído por nós ·
`content_revisions` · snapshot periódico para Git · revalidação a pedido · gestão própria de
passwords e provisionamento de contas.

---

## 0.3 Premissas e observações de facto (levantadas do código atual — inalteradas)

| # | Observação | Implicação arquitetural |
|---|---|---|
| O-1 | Conteúdo pequeno: 8 serviços × 5 campos × 2 idiomas + dicionário de traduções. | Cabe folgadamente em ficheiros versionados. |
| O-2 | `netlify.toml` tem `publish = "."`, publicando também `AvaliacaoAgroTrades/`. | Site duplicado servido publicamente hoje. Resolve-se no cutover. |
| O-3 | `sitemap.xml` declara 4 URLs; `servico.html?id=X` **não** está lá. | Os 301 das 3 URLs `.html` são obrigatórios; o de `?id=` é precaução barata. Resolve a ambiguidade 6.3. |
| O-4 | Pasta espúria `{css,js,images,pages}/` na raiz (vazia). | Lixo a remover na Fase 1. |
| O-5 | `robots.txt` já tem `Disallow: /admin/`. | Higiene de indexação, **não** controlo de acesso (9.6). |
| O-6 | i18n atual é 100% client-side. | Só a versão PT é indexável. A migração corrige (D-4). |

---

## 1. Decisão D-1 — Framework: **Next.js** (fechado)

- Páginas públicas como **Server Components**, sem `"use client"` salvo onde necessário (seletor de
  idioma, menu mobile, ecrã de gestão de utilizadores). Não regredir NFR-03.
- **App Router** (`app/`), não Pages Router.
- **Renderização:** conteúdo em ficheiros do repositório → páginas geradas estaticamente no build.
  Sem ISR, sem revalidação a pedido, sem fetch em runtime nas páginas públicas.
- **TypeScript**, com tipos derivados dos schemas Zod (D-2).
- O site público é estático; a área administrativa é dinâmica e autenticada. **Esta separação tem de
  ser nítida no código** — e, desde a v5, também na configuração de ambientes (9.8).

---

## 2. Decisão D-2 — Conteúdo: ficheiros JSON/MDX versionados, editados pelo Decap CMS

### 2.1 Estrutura

```
content/
  services/          arroz.json, cereais.json, moageira.json, terras.json,
                     campanha.json, mecanizacao.json, apoio-tecnico.json,
                     comercializacao.json            (folder collection do Decap)
  site/
    nav.json         labels de Início/Serviços/Campanha/Contactos
    hero.json        título, subtítulo, CTA, stats[] {valor, label}
    about.json       título e parágrafos
    campanha.json    título e corpo
    locations.json   [{nome, morada, tipo}] — Nampula, Moma
    contacts.json    telefone, whatsapp, email, horário
    footer.json      texto legal, links
    seo.json         defaults de title/description/og por página
  schemas/           schemas Zod + tipos TS derivados
public/images/uploads/    media_folder do Decap (D-7)
public/admin/             index.html + config.yml do Decap (D-3)
  (bundle do Decap auto-hospedado, versão exata — ver 9.9 / SEC-05)
app/admin/users/          ecrã de gestão de utilizadores (D-8)
app/api/admin/            rotas de servidor privilegiadas (D-8)
```

**Princípio mantido desde a v2:** todo o campo traduzível é um objeto `{ pt, en }` **no mesmo
ficheiro** — nunca ficheiros ou pastas paralelos por idioma. Uma tradução não pode desaparecer
silenciosamente, e no Decap as duas versões aparecem lado a lado.

### 2.2 Validação

**Schemas Zod que correm no build.** Se faltar a tradução EN de um serviço ou um campo obrigatório,
o build falha com mensagem legível — cobre AC-01/AC-02 sem depender de revisão humana, e falha
**antes** de chegar a produção.

### 2.3 Publicação

Editor grava no Decap → commit → a Vercel deteta o push → build → deploy. Um a dois minutos.

**`publish_mode: editorial_workflow` — recomendado, e reforçado na v5.** As gravações criam *pull
requests* em vez de commits diretos em `main`. Além das vantagens já conhecidas (menos builds de
produção, passo de revisão), passou a haver uma razão de segurança: com a proteção de `main`
exigida pela restrição 28, o commit direto deixa de ser possível de qualquer maneira — o editorial
workflow é o modo de funcionamento coerente com essa proteção, não uma opção paralela.

### 2.4 Rollback

Nativo do Git: reverter um commit repõe o conteúdo anterior e dispara novo deploy. A Vercel também
permite reverter para um deploy anterior. O histórico de quem alterou o quê é o histórico de commits.

---

## 3. Decisão D-3 — Decap CMS com backend GitHub

### 3.1 Componentes

1. **`public/admin/index.html`** — página que carrega o Decap, com o bundle **auto-hospedado**
   (versão exata, lockfile commitado). Ver 9.9.
2. **`public/admin/config.yml`** — collections e campos. **Público por construção**: nunca contém
   segredos.
3. **Proxy OAuth GitHub** — duas rotas serverless (`/api/auth`, `/api/callback`). Código nosso, de
   autenticação — secção 9.

### 3.2 Porque backend `github` e não `git-gateway`

`git-gateway` exigiria auto-hospedar o GoTrue — mais infraestrutura e regresso parcial ao problema
da v2 (gestão própria de identidades). Com `github`, identidade e autorização são do GitHub.

### 3.3 Repositório único vs. separado — **decisão reponderada por escrito (AMB-05, SEC-01)**

A v4 recomendava repositório único com o argumento de que os editores são "de confiança da empresa".
O `security-engineer` apontou, com razão, que toda a secção 7A é construída sobre o pressuposto
**contrário** — que um editor **não** deve poder tornar-se administrador — e que as duas premissas
não podem ser ambas verdade. O SEC-01 é o ponto onde colidem em concreto.

**Reponderação da opção (b), como exigido:**

| Opção | Avaliação à luz do SEC-01 |
|---|---|
| (a) **Repositório único** | O editor tem `push` no repositório de onde a Vercel constrói o código de servidor que lê os segredos. O vetor do SEC-01 existe e **só é fechado por configuração**: segredos ausentes de Preview, e proteção de `main` a exigir revisão de terceiro. Configuração pode ser desfeita por engano; é uma defesa mais frágil do que uma estrutural. |
| (b) **Repositório de conteúdo separado** | **Elimina o SEC-01 por construção, não por configuração** — o editor deixa de ter escrita no repositório que contém as credenciais. Custo: dois repositórios, o build tem de ir buscar conteúdo ao segundo e disparar deploy a partir dele, e o Decap passa a apontar para o repositório de conteúdo. Mais peças para manter. |

**Decisão do utilizador (decisão 13): manter repositório único**, com as mitigações do SEC-01 como
restrições vinculativas. Fica registado, como o `security-engineer` pediu, que **esta é uma decisão
de risco tomada com a análise à frente e por escrito, não por omissão**. O risco residual está
descrito em 9.8 e não é zero.

Consequência: **as mitigações deixam de ser recomendações.** Restrições 27 e 28 da secção 12. A
proteção de `main` é **pré-condição do entregável da Fase 6**, não uma boa prática a adotar quando
houver tempo.

### 3.4 Público ou privado

**Repositório público** (decisão 10). A razão é o âmbito do token OAuth: privado obrigaria ao scope
`repo`, que dá acesso a **todos** os repositórios privados de cada editor; público permite
`public_repo`. Como o conteúdo do site é público por natureza e nenhum segredo vive no repositório,
torná-lo privado não protege nada de relevante. Reavaliação completa em 7A.8.

---

## 4. Decisão D-4 — i18n (inalterada)

```
PT (idioma por defeito, na raiz):   /   /servicos/   /servicos/arroz/   /campanha/   /contactos/
EN (prefixado):                     /en/   /en/services/   /en/services/rice/   /en/campaign/   /en/contact/
```

- PT na raiz, sem prefixo `/pt/`, para preservar `/` e minimizar a perturbação de SEO (NFR-04).
- Cada página emite `<html lang>` correto, `canonical` próprio e `hreflang` para a contraparte. A
  versão EN passa a ser indexável pela primeira vez (O-6).
- **Persistência (FR-10):** idioma em `localStorage`, aplicado **apenas** quando o visitante chega a
  `/` sem indicação de idioma. Redirecionar sempre partiria links diretos e confundiria crawlers.
- **Trade-off face a NFR-05:** troca por navegação em vez de substituição no DOM. Com páginas
  pré-renderizadas e prefetch, a diferença percebida é mínima; NFR-05 admite-o desde que documentado.
- Textos sempre dos ficheiros de conteúdo, nunca de dicionários hardcoded (decisão 8).

---

## 5. Decisão D-5 — URLs, redirects e SEO (inalterada)

| De | Para | Prioridade |
|---|---|---|
| `/servicos.html` | `/servicos/` | **Obrigatório** (está no sitemap) |
| `/campanha.html` | `/campanha/` | **Obrigatório** (está no sitemap) |
| `/contactos.html` | `/contactos/` | **Obrigatório** (está no sitemap) |
| `/index.html` | `/` | Obrigatório |
| `/servico.html?id=:id` | `/servicos/:id/` | Recomendado |
| `/home` | `/` | Já existe — preservar |

Metadados por página e idioma via Metadata API; JSON-LD `Organization` a partir de
`site/contacts.json` e `site/locations.json`; `sitemap.xml` e `robots.txt` gerados (AC-14); 404 por
locale (FR-13/AC-07). **`/admin` e `/admin/users` fora do sitemap e com `noindex`.**

Precedência da secção 4 do `requirements.md` vinculativa: SEO + URLs individuais + 404 + preconnect
de `AvaliacaoAgroTrades`; **copy** dos serviços do array `SERVICES` da raiz.

---

## 6. Decisão D-6 — Formulário de contacto: fora de âmbito (inalterada)

Manter o CTA de WhatsApp (FR-03). Tarefa separada, risco elevado (dados pessoais).

---

## 7. Decisão D-7 — Media no repositório

Editor carrega no Decap → ficheiro commitado em `public/images/uploads/` → caminho no JSON →
Next.js serve de `public/`. Sem serviço externo.

**Limitação — vídeo:** binários grandes em Git são má prática (limite prático de 100 MB/ficheiro; cada
versão fica no histórico para sempre e binários não comprimem entre versões). Imagens de site
institucional: sem problema. **Vídeo: embeber do YouTube e guardar só o URL.** Limite de tamanho no
`config.yml` e imagens otimizadas antes do commit.

`next/image` em modo `unoptimized` ou loader simples — evita a quota de otimização da Vercel e mantém
a saída para outro hosting aberta.

---

## 7A. Decisão D-8 — Ecrã de gestão de utilizadores

> **REVOGADO pela task-007-remove-unused-session (2026-09-26) — não implementar.** A Fase 6 foi
> cancelada e o cookie de sessão emitido na Fase 5 foi removido do código. A gestão de editores faz-se
> na interface nativa da Organização GitHub (2FA obrigatório, audit log, editores com papel Write,
> administradores = owners). Toda a secção 7A, incluindo a tabela de sessão de 7A.3, mantém-se
> apenas como registo de decisão. Ver `project/state/task-007-remove-unused-session/`.

**Objetivo:** convidar e remover pessoas para edição de conteúdo sem ir à interface do GitHub, via
API de colaboradores do repositório.

### 7A.1 A credencial privilegiada — GitHub App

| Opção | Avaliação |
|---|---|
| **(a) GitHub App instalada só neste repositório, `Administration: write` + `Metadata: read`** | **Escolhida.** Âmbito de um repositório. **Não inclui `Contents: write`** — não escreve código nem conteúdo. Tokens de instalação de ~1 h gerados no servidor. Revogável num clique. Não presa a nenhuma pessoa. |
| (b) Fine-grained PAT | Granularidade equivalente mas presa a uma conta pessoal e com validade máxima de um ano, exigindo rotação manual. Plano B. |
| (c) PAT clássico com `repo` | **Rejeitado.** Escrita em todos os repositórios dessa pessoa, inclui `contents` — token comprometido reescreve código e conteúdo. |

**Ressalva honesta mantida:** `Administration: write` **não é inócua** — cobre definições do
repositório, incluindo alterar visibilidade, desativar proteção de branch, transferir e apagar. **Não
existe no GitHub permissão mais fina para gerir colaboradores**: é o mínimo disponível, limitação de
plataforma a conter, não descuido. Contenção em 7A.5.

**Manuseio da chave (SEC-08):** o PEM vive em variável de ambiente **codificado em base64**,
descodificado no servidor — PEMs multi-linha em env vars corrompem-se com frequência e a reação
típica é uma transformação improvisada. Um erro de parsing **nunca imprime a chave, nem parcialmente**.
JWT de autenticação da App com `RS256` **fixado no código**, TTL ≤ 10 minutos, `iat` recuado alguns
segundos para tolerar desvio de relógio.

**Cache do token de instalação — armadilha específica de serverless (SEC-08):** "gerados por pedido,
nunca guardados" tem de abranger explicitamente **estado de módulo**. Em Next.js, uma variável de
módulo **persiste entre invocações quentes** da mesma instância, logo um "cache simples"
bem-intencionado guarda a credencial em memória partilhada entre pedidos de utilizadores diferentes.
Proibido.

### 7A.2 Autorização em dois níveis — **e a resolução da AMB-04**

**Requisito absoluto: ter acesso de escrita ao repositório NÃO pode implicar poder convidar outras
pessoas.**

| Papel | Como é determinado | O que permite |
|---|---|---|
| **Editor de conteúdo** | Permissão de escrita **atual** no repositório GitHub | Entrar no Decap, editar e publicar conteúdo |
| **Administrador de utilizadores** | **Ambas** as condições: ID numérico na allowlist do servidor **E** permissão de escrita **atual** no repositório | Tudo o que o editor faz, mais convidar e remover |

**Resolução explícita da AMB-04, que a v4 deixava em aberto: sim, ter acesso de escrita ao
repositório é pré-requisito do papel de administrador.** As duas condições são verificadas **a cada
pedido** (SEC-02). A razão é fechar o caso do ex-administrador: alguém removido do GitHub mas cuja
entrada na allowlist ninguém se lembrou de apagar do painel da Vercel deixaria, de outro modo, de
poder editar conteúdo mas continuaria a poder **convidar pessoas** — o poder maior a sobreviver ao
menor. O desligamento tem dois passos em dois sistemas diferentes e nenhum lembra o outro; exigir as
duas condições faz com que **remover do GitHub baste** para cortar tudo.

**Trade-off assumido explicitamente, como o `security-engineer` pediu.** Esta exigência reabre
parcialmente o cenário de 7A.7: passa a existir uma sequência que deixa o sistema sem administrador
operacional — um administrador que se remova a si próprio como colaborador perde também o papel
administrativo. **Aceito a troca**, porque o caso do ex-administrador é um risco de segurança real e
silencioso, enquanto o auto-bloqueio é um erro operacional ruidoso, evitável por guardas e sempre
recuperável pelo proprietário do repositório (que não é colaborador). A contrapartida é que as
guardas de 7A.7 deixam de ser conveniência: passam a **vinculativas e verificadas no servidor**.

**Onde vive a allowlist.** **Nunca num ficheiro do repositório** — todos os editores lá podem
escrever, e o ficheiro seria ele próprio o caminho de escalonamento. Vive em variável de ambiente do
projeto na Vercel (`ADMIN_GITHUB_USER_IDS`), **apenas no ambiente Production** (SEC-01, restrição 27).

**Identificação por ID numérico do GitHub, nunca por username** — usernames podem ser alterados pelo
titular e, uma vez libertados, registados por outra pessoa.

Hoje a allowlist tem **uma entrada**: a pessoa inicial (decisão 11).

### 7A.3 Onde vive o ecrã, e como sabe quem está a falar

O Decap é uma SPA fechada; **não se injeta um ecrã dentro dela.**

```
/admin                    → Decap CMS (estático, public/admin/)
/admin/users              → ecrã de gestão (rota Next.js)
/api/admin/collaborators  → rota de servidor com as chamadas privilegiadas
```

**AMB-06 — requisito que acompanha o caminho, seja ele qual for.** Se houver conflito de resolução
entre `public/admin/` e `app/admin/users/`, usar caminho alternativo (ex.: `/gestao/utilizadores`).
Sem consequência arquitetural, **mas com consequência de segurança se resolvido à pressa**: qualquer
caminho alternativo herda obrigatoriamente `noindex`, `Disallow`, a mesma verificação de sessão e a
mesma resposta indistinguível de 9.6. Isto não se perde no meio de um problema de routing.

**Como o servidor obtém a identidade (AMB-08).** No callback, o servidor troca o `code` pelo token e
chama **`GET /user` na API do GitHub, no servidor, com o token acabado de trocar**, para obter o ID
numérico verificado. **Nunca** de um valor vindo do cliente, da query string ou do corpo do pedido.

> **REVOGADO (task-007):** o cookie de sessão descrito abaixo foi implementado na Fase 5 e
> **removido** na task-007 (nunca teve consumidor); a chamada `GET /user` no callback, que só servia
> para o payload da sessão, foi removida também.

**Sessão (SEC-02, SEC-04).** O ecrã **não** lê o token que o Decap guarda no `localStorage`. O
callback emite um cookie de sessão assinado:

| Propriedade | Valor | Razão |
|---|---|---|
| Flags | `httpOnly`, `Secure`, **`SameSite=Strict`** | Correto para o cookie de **sessão** (ao contrário do de `state` — ver 9.10) |
| **TTL absoluto** | **≤ 60 minutos**, **sem renovação deslizante** | Não há sessão do lado do servidor, logo não há revogação. Sem número escrito, alguém escreveria 30 dias. O TTL curto é o que limita a janela de zumbi após um offboarding. |
| Assinatura | HMAC-SHA256 com **`SESSION_SECRET` dedicado**, distinto do `client_secret` e da chave da App | Separação de segredos por função |
| Algoritmo | **Fixado no código, nunca lido do próprio token** | Evita a família `alg:none` / confusão de algoritmo |
| Verificação | Assinatura e expiração, **comparação em tempo constante** | |
| Payload | **Mínimo: ID numérico + expiração.** Sem token GitHub, sem username, sem email | Um cookie roubado não deve conter credenciais nem dados pessoais |

**Ponto a escrever de forma inequívoca, porque é a leitura errada mais provável de quem implementar
(SEC-02, ponto 3):** o entregável da Fase 5 é que **qualquer** utilizador GitHub se autentica com
sucesso. Logo qualquer pessoa do planeta obtém um cookie de sessão válido e assinado deste site.
Isto é aceitável e coerente com o modelo, desde que fique explícito: **possuir sessão válida confere
ZERO autoridade.** A sessão diz *quem* é a pessoa; não diz que ela pode fazer alguma coisa.

**Ordem de operações num pedido privilegiado — a ordem é parte do controlo:**
1. Validar assinatura e expiração do cookie → obter o ID numérico.
2. **Verificar o ID contra a allowlist.** Passo barato, sem credencial envolvida.
3. Se falhar: **404 pelo caminho de código comum** (9.6). Fim.
4. **Só então** gerar o token de instalação da GitHub App.
5. **Confirmar em tempo real a permissão de escrita atual** do ator
   (`GET /repos/{owner}/{repo}/collaborators/{username}/permission`). Se não tiver: mesmo 404.
6. Validar o `username` alvo (7A.4), resolver alvo → ID, aplicar guardas (7A.7).
7. Executar a operação. Registar o evento (7A.6).

A allowlist é verificada **antes** de a credencial privilegiada sequer existir; a permissão viva é
verificada depois, porque exige a credencial. Gerar a credencial só após a primeira decisão de
autorização é deliberado — a v4 já o fazia e mantém-se.

**CSRF (SEC-04).** `SameSite=Strict` **não é, por si, proteção CSRF suficiente**. Todas as mutações
validam o header `Origin` no servidor, e essa validação **falha fechada quando o header está
ausente** — um pedido sem `Origin` é **rejeitado**, nunca aceite por omissão. É aqui que a maioria
das validações de `Origin` reais falha.

### 7A.4 O convite, e a validação do `username` (SEC-03)

- `PUT /repos/{owner}/{repo}/collaborators/{username}` com **`permission: "push"` fixado no código
  do servidor**. Nunca vem do cliente — caso contrário um pedido forjado pediria `admin` e
  transformaria "convidar um editor" em "criar outro administrador".
- O GitHub envia um **convite** que a pessoa aceita; não há adição silenciosa. Refletir o estado
  "pendente" na UI.
- Remoção via `DELETE`; cancelamento de convites pendentes.
- Lista sempre lida **em tempo real** da API do GitHub. Sem cópia local: não há segunda fonte de
  verdade de estado de autorização para dessincronizar.

**Validação do `username` — a v4 dizia "validado" e nunca dizia como (SEC-03).** Este valor é
interpolado num caminho de URL chamado com a credencial mais privilegiada do sistema. Sem regra
escrita, o resultado provável é uma verificação de "não vazio", e um `username` com `../` ou `/` não
codificado **reescreve o caminho e atinge outro endpoint da API do GitHub** — transformando as "duas
operações de parâmetros fixos" no proxy genérico que 7A.5 declara eliminado. O vetor de 7A.5 só está
realmente fechado se este parâmetro for estanque.

Regra vinculativa, **no servidor** (validação no cliente é usabilidade):
1. **Allowlist de formato**, nunca blocklist: `^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$`.
   Tudo o resto é rejeitado com erro genérico.
2. **Além disso**, `encodeURIComponent` na construção do caminho. **Validação *e* codificação**, não
   uma ou outra.
3. Mesma regra nos três endpoints: convidar, remover, cancelar convite.

### 7A.5 Contenção do dano se a credencial da App for comprometida

Não tem `Contents: write`: **não escreve código nem conteúdo.** O ativo principal está fora do seu
alcance — consequência direta de escolher a GitHub App em vez do PAT clássico.

| Capacidade residual | Contenção |
|---|---|
| Convidar colaboradores | O nosso código fixa `permission: "push"`. Contra uso direto de uma credencial roubada não há defesa no nosso lado — daí a chave nunca sair do servidor, os tokens serem curtos, e existirem sinais fora de banda (7A.6). |
| Alterar definições: visibilidade, proteção de branch, transferência, eliminação | Não existe permissão GitHub mais fina. Mitigação: Git é distribuído, logo cada clone de cada colaborador é uma cópia completa, e o site em produção continua servido pelo último deploy mesmo que o repositório desapareça. Recuperar é reconstituir, não recomeçar. |
| Ser usada como proxy genérico da API do GitHub | **Eliminado por desenho** — nenhum endpoint aceita URL, método ou corpo arbitrário do cliente. Duas operações, parâmetros fixos, um parâmetro variável **estanque por 7A.4**. É a diferença entre expor duas ações e expor uma credencial. |

### 7A.6 Auditoria

1. **Registo do próprio GitHub — fonte primária**, porque é **externa ao sistema comprometível**:
   adições e remoções ficam registadas e o proprietário recebe email dos convites. Um atacante que
   comprometa a Vercel não o consegue apagar.
2. **Log estruturado** nos logs de runtime da Vercel (quem, quando, que ação, sobre quem).
   **Retenção curta no plano gratuito** — diagnóstico imediato, não arquivo.
3. **Organização GitHub gratuita — recomendado:** audit log completo e pesquisável, e permite
   **impor 2FA a todos os membros**, que é a proteção mais valiosa aqui, dado que a conta GitHub de
   um editor é a chave do site.

Rejeitado: ficheiro de log no repositório — os editores podem escrever lá; seria um registo que o
próprio suspeito pode editar. **Registo honesto: auditoria à prova de adulteração mantida por nós não
é alcançável a custo zero neste desenho.**

**SEC-09:** com uma entrada na allowlist é irrelevante, mas **se a allowlist crescer**, acrescentar
notificação aos restantes administradores quando alguém é convidado ou removido — é a diferença
entre detetar um abuso em horas ou nunca.

### 7A.7 Guardas — agora vinculativas e no servidor (SEC-07)

A v4 escrevia "guardas simples a implementar" e "confirmação explícita antes de remover", o que soa
a comportamento de UI. **Confirmação no ecrã é UX; a recusa é do servidor.** E, por 7A.2, estas
guardas passaram a ser o que impede o auto-bloqueio administrativo — logo não podem ser opcionais.

Regras vinculativas:
- Recusar **auto-remoção**; recusar remover o **proprietário do repositório**.
- **Comparação por ID numérico**, obtido do cookie de sessão (o ator) e da API do GitHub (o alvo) —
  **nunca** por strings vindas do cliente. Uma guarda comparada por identificador mutável é uma
  guarda contornável por renomeação, exatamente a fraqueza que 7A.2 identifica para a allowlist.
- **Resolver o alvo username → ID antes de decidir**, para que renomear não contorne a guarda.
- Recusa aplicada **na rota de servidor**. A confirmação no ecrã é adicional, nunca substitutiva.
- Avisar quando a remoção deixaria o repositório sem colaboradores com permissão de escrita.

**Recuperação garantida:** o proprietário do repositório no GitHub não é colaborador e não pode ser
removido por esta via. Somado ao controlo da conta Vercel (onde vive a allowlist), há sempre caminho
de volta.

### 7A.8 Reavaliação: o repositório deve continuar público?

**Sim** (decisão 10):
- A visibilidade não determina quem escreve. Público é legível por todos e escrevível só por
  colaboradores — igual ao privado no que toca a escrita.
- O argumento original **ganha peso** com a v4: público permite `public_repo` em vez de `repo`, e a
  gestão de utilizadores torna provável haver mais editores, logo mais tokens.
- Nenhum segredo vive no repositório — todos em variáveis de ambiente da Vercel, e apenas em
  Production (restrição 27).
- O código do ecrã e o caminho da API ficarem visíveis não é fraqueza: a segurança está na
  verificação server-side, não em desconhecer o URL (restrição 16).

**Ressalva de privacidade, não de segurança:** num repositório público o histórico de commits é
visível, logo **os usernames GitHub dos editores e o que cada um alterou ficam publicamente
associados à empresa**. Quem for convidado deve sabê-lo antes de aceitar, sobretudo usando contas
pessoais.

---

## 8. Hosting: **Vercel** (fechado, com risco aceite)

### 8.1 Risco aceite e documentado

O plano **Hobby** é, nos termos de serviço, **restrito a uso não-comercial**; o site é de uma
empresa. Verificado, apresentado ao utilizador, e **o utilizador decidiu manter a Vercel e assumir o
risco**. Desfechos possíveis: suspensão ou exigência de upgrade para Pro, colidindo com
FR-16/NFR-02. **Não é blocker.**

### 8.2 Mitigações

1. **Sem método de pagamento na conta.** O pior caso é limitação de serviço, não uma fatura.
2. **Manter saída viável.** Não usar KV/Postgres/Blob/Edge Config nem o otimizador de imagens. As
   peças específicas da plataforma são três — proxy OAuth, API de colaboradores e leitura de
   variáveis de ambiente — e devem ficar isoladas e pequenas.
3. **Documentar rollback e migração de hosting** (Fase 7).
4. **A conta Vercel é agora tão sensível como a conta GitHub** — contém o mecanismo de autorização
   de administradores. 2FA obrigatório e lista de acessos curta. O SEC-01 reforça este ponto.
5. **Nota da v5 (SEC-06):** no plano Hobby os URLs de deploy preview são **publicamente
   acessíveis** — a proteção de deployments é funcionalidade paga. É por isso que os previews não
   podem ter credenciais reais (9.8) e que a allowlist de `redirect_uri` usa um alias estável e nunca
   um URL efémero (9.11).

---

## 9. Áreas de risco elevado e abuso do próprio mecanismo

> **Como o risco evoluiu.** A v2 exigia construir autenticação de raiz. A v3 eliminou quase tudo isso
> delegando ao GitHub. A v4 voltou a subir o risco ao passar de *usar* permissões para *conceder*
> permissões. **A v5 não muda o âmbito — fecha as lacunas do desenho da v4**, com números, regras e
> locais de aplicação onde antes havia adjetivos.

### 9.1 Classificação

| Componente | Risco elevado? | Porquê |
|---|---|---|
| Site público (Fases 1-4) | Não | Páginas estáticas geradas de ficheiros, sem sessão, sem input. **Confirmado pelo `security-engineer`: nada trava as Fases 1-4.** |
| **Proxy OAuth + Decap CMS (Fase 5)** | **SIM — autenticação** | Confirmação humana + revisão do `security-engineer` **contra o código** antes de aceitar. |
| ~~**Ecrã de gestão de utilizadores (Fase 6)**~~ | **CANCELADA (task-007, 2026-09-26)** | Era: gate próprio, superfície mais privilegiada do sistema. Substituída pela gestão nativa da Organização GitHub. |
| Media no repositório | Não | Ficheiros commitados por quem já tem escrita. |

### 9.2 Open redirect no proxy OAuth

`redirect_uri` e origem de destino validados contra **allowlist fixa no servidor**, nunca
construídos a partir de valores do pedido. O que não estiver na allowlist é **rejeitado** — não
corrigido, não normalizado. **Comparação exata de origem**, sem `startsWith` nem correspondência por
sufixo: `agrotrades.co.mz.atacante.com` passaria num teste de prefixo mal feito, e
`endsWith('.vercel.app')` é ainda pior, porque `.vercel.app` é domínio partilhado onde qualquer
pessoa aloja um projeto.

O impacto justifica a severidade: o ataque não é contra o site, é contra as pessoas. Um link que
**começa em `agrotrades.co.mz`** — domínio legítimo, reconhecido pela vítima — acaba num site do
atacante, e a credibilidade da empresa torna-se o instrumento do phishing.

### 9.3 Fuga do token pelo `postMessage`

`targetOrigin` **explícito e literal**, nunca `'*'` e **nunca uma variável derivada de `location`,
`referrer` ou query string**; mais validação de `event.origin` no recetor. Ter os dois lados é o que
torna a mitigação completa.

### 9.4 Restantes controlos do proxy OAuth

| Vetor | Mitigação |
|---|---|
| Fuga do `client_secret` | Só em env de servidor, **apenas em Production**. Nunca em `public/admin/config.yml` (servido ao browser), nunca em `NEXT_PUBLIC_`, nunca no repositório — que é público, logo um segredo commitado tem de ser **rotacionado**, não basta apagar. |
| Scope | `public_repo`, não `repo`. |
| Callback como oráculo | Erro genérico, sem distinguir `state`, código ou permissão. |
| Token no `localStorage` | Inerente ao Decap. **AMB-07:** a mitigação por CSP só é real se a origem do bundle for confiável — uma CSP que permita `unpkg.com` em `/admin` torna a mitigação declarada em grande medida ilusória. Ver 9.9. |

### 9.5 Escalonamento de privilégio no ecrã de gestão

> **REVOGADO (task-007, 2026-09-26):** o ecrã de gestão (Fase 6) foi cancelado; mantém-se como
> registo. O requisito "escrita não implica poder convidar" é cumprido nativamente pelo GitHub
> (papel Write não gere acesso; só Admin do repositório / Owner da organização).

| Caminho | Mitigação |
|---|---|
| Chamar a API diretamente sem passar pelo ecrã | Verificação **na rota de servidor, a cada pedido**, das **duas** condições de 7A.2. Esconder botões não é autorização. |
| Um editor acrescentar-se à allowlist editando um ficheiro | A allowlist não está no repositório. |
| **Um editor exfiltrar a allowlist e a chave da App via código que ele próprio escreve** | **SEC-01 — ver 9.8.** É o caminho que a v4 não antecipava. |
| Pedir nível de permissão superior no convite | `permission: "push"` fixado no servidor. |
| Contornar guardas por renomeação | Comparação por ID numérico; resolução username → ID antes de decidir (7A.7). |
| **Injeção de caminho pelo `username`** | Allowlist de formato **e** `encodeURIComponent` (7A.4). Sem isto, as "duas operações" tornam-se um proxy genérico. |
| CSRF | `SameSite=Strict` **mais** validação de `Origin` que **falha fechada** se o header faltar. |

### 9.6 Resposta única para não-autorizados (AMB-01)

> **REVOGADO (task-007, 2026-09-26):** aplicava-se às rotas da Fase 6, cancelada. Mantém-se como
> registo e como boa prática para futuras rotas com controlo de acesso.

A v4 dizia "**404 ou 403**, sem detalhe". **Um "ou" numa regra de segurança é um oráculo à espera de
acontecer:** se o código devolver 403 a quem tem sessão e 404 a quem não tem, confirma-se a
existência da funcionalidade e a validade da sessão.

**Regra fixada: um único código — 404 — para todos os casos de não-autorização**, na página e na API,
**gerado pelo mesmo caminho de código**. Sem ramo `403`/`404` distinto. Gerar pelo mesmo caminho
evita também um oráculo de temporização ou uma diferença subtil de corpo ou headers.

`/admin` e `/admin/users` continuam publicamente alcançáveis, e isso é normal — não há nada sensível
nos ficheiros e o controlo de acesso está no servidor e no GitHub. `noindex` e `Disallow` são higiene
de indexação, **não** segurança.

### 9.7 Limites de taxa

A rota privilegiada é **alcançável por anónimos** e será sondada, e cada pedido autorizado gera um
token de instalação (custo e ruído no rate limit da App). Limite básico por IP/sessão nas mutações.
Não é material ao volume deste site; fica registado.

### 9.8 SEC-01 — Exfiltração de segredos por um editor, via o próprio repositório

**O achado que a v4 não antecipava, e o mais importante desta revisão.**

A v4 afirmava que a allowlist estar fora do repositório sustentava a separação de papéis. A premissa
não enunciada era que um editor não chega à variável de ambiente. **Chega** — não editando a
allowlist, mas escrevendo o código que a lê:

1. O editor tem `push`, concedido pelo próprio ecrã da Fase 6.
2. Cria um branch com um route handler trivial que devolve `process.env.GITHUB_APP_PRIVATE_KEY` e
   `process.env.ADMIN_GITHUB_USER_IDS`.
3. A Vercel constrói automaticamente um **deploy preview** desse branch.
4. Se as variáveis existirem no ambiente Preview — **o default, quando se define uma variável sem
   escolher ambiente, é aplicá-la a todos** — o código dele corre com elas.
5. Abre o URL do preview (público no plano Hobby) e lê a chave privada e a allowlist.

Obtém a credencial mais poderosa do sistema **sem tocar em `/admin/users`, sem passar por nenhuma
verificação de allowlist e sem deixar rasto como ação administrativa**. Todos os controlos de 7A.3,
7A.5 e 9.5 continuam corretos e são simplesmente contornados por baixo. A chave nunca sai do
servidor — o problema é que o editor pode escrever o servidor.

Variante mais direta: sem proteção de `main`, o mesmo push vai direto para produção, com as
variáveis de Production. A v4 recomendava proteção de branch em 3.3, mas como **recomendação**. Um
controlo de que depende toda a separação de privilégios não pode ser uma recomendação.

**Âmbito temporal:** enquanto houver um único utilizador, o SEC-01 não é explorável — não existe
segundo ator. Materializa-se **no instante em que o primeiro editor adicional é convidado**, que é
precisamente o entregável da Fase 6.

**Fecho na v5, por decisão do utilizador (decisão 13): repositório único, com mitigação por
configuração**, agora vinculativa:

1. **Segredos privilegiados apenas no ambiente Production** (restrição 27):
   o `client_secret` da OAuth App **nunca** definido para Preview nem Development. Preview usa
   **uma OAuth App distinta, ligada a um repositório-sandbox descartável**. Um segredo de teste
   roubado não vale nada. *(v6, task-007: a lista original incluía também `GITHUB_APP_PRIVATE_KEY`,
   `GITHUB_APP_INSTALLATION_ID`, `ADMIN_GITHUB_USER_IDS`, `SESSION_SECRET`, uma GitHub App de
   sandbox e uma allowlist de teste — deixaram de existir com o cancelamento da Fase 6 e a remoção
   do cookie de sessão. A mitigação continua válida para o `client_secret`.)* Marcar as variáveis como sensíveis
   na Vercel, para não serem legíveis de volta no painel.
2. **Proteção de `main` como pré-condição** (restrição 28): sem push direto; PR com revisão de
   alguém que não seja o autor; **configurada ANTES de convidar o primeiro editor adicional**. É
   pré-condição do entregável da Fase 6, não sugestão. Enquanto houver um só utilizador é
   irrelevante; passa a crítica no instante exato em que a Fase 6 cumpre o seu propósito.
3. **A opção (b) foi reponderada por escrito e rejeitada pelo utilizador** — ver 3.3.

**Risco residual, declarado sem atenuação:** a defesa passou a ser configuração, não estrutura.
Configuração pode ser desfeita por engano ou por pressa — basta alguém definir uma variável sem
escolher o ambiente, ou desativar temporariamente a proteção de `main` "só para este merge". Além
disso, com poucas pessoas envolvidas, a revisão obrigatória de PR pode degenerar em aprovação
automática entre as mesmas duas pessoas. **O `devops-engineer` deve verificar estes dois pontos na
Fase 0 e antes de cada deploy privilegiado**, e o `security-engineer` exige prova de que as
variáveis sensíveis não existem em Preview.

### 9.9 SEC-05 — Origem do bundle do Decap

`public/admin/index.html` é a página **que detém o token OAuth do editor** em `localStorage`. Carregar
aí um `<script src="https://unpkg.com/decap-cms@^3/...">` significaria executar, na página mais
privilegiada do site, **código de terceiros sem versão fixa e sem verificação de integridade**. Um
comprometimento do CDN, ou uma versão maliciosa publicada dentro de um range `^`, entregaria o token
GitHub de todos os editores **sem tocar no nosso repositório nem na nossa infraestrutura**.

Regras vinculativas:
- **Auto-hospedar o bundle**: dependência npm com **versão exata** (sem `^`, sem `~`), servida do
  próprio domínio, **lockfile commitado**.
- Se, por alguma razão, se mantiver CDN: versão exata **e** `integrity` (SRI) **e**
  `crossorigin="anonymous"`. Um range de versão com SRI é impossível — o que é, por si, o argumento
  para auto-hospedar.
- **CSP específica de `/admin` por header de rota.** Assumir que o Decap exige diretivas mais frouxas
  (`unsafe-eval`/`unsafe-inline`) e **confinar essa exceção a `/admin`**, nunca relaxar a política
  global.
- **Restrição derivada para a Fase 4:** a CSP e o HSTS são definidos **antes** de `/admin` existir.
  Montar a política **estrita por defeito**, prevendo um header próprio por rota. Não permitir que a
  chegada do Decap na Fase 5 seja resolvida a enfraquecer a política global.

### 9.10 SEC-04 — Ciclo de vida do `state`, e o conflito de `SameSite`

Dois problemas cruzados, ambos gerados por o proxy ser **serverless e sem estado partilhado** entre
`/api/auth` e `/api/callback` — facto que a v4 nunca abordava.

**(i) O `state` existia mas não tinha ciclo de vida.** Não estava dito onde é guardado (não há base
de dados nem KV, e 8.2 proíbe o Vercel KV), nem que é de **uso único**, nem que **expira**, nem qual
a fonte de aleatoriedade. Um `state` nunca invalidado após uso é reutilizável; gerado com
`Math.random()` é previsível; sem TTL é eterno. **Nenhuma destas três falhas é visível num teste
funcional — o login funciona na mesma.**

**(ii) `SameSite=Strict` é incompatível com o retorno do GitHub.** O callback é alcançado por uma
**navegação de topo cross-site** vinda de `github.com`, e um cookie `Strict` **não é enviado** nessa
navegação. Se o `state` for guardado num cookie `Strict`, não chega ao callback e a verificação ou
falha sempre — e alguém a "arranja" removendo-a, que é o desfecho mau e realista — ou é
silenciosamente ignorada. A v4 aplicava `SameSite=Strict` globalmente, tratando como um só dois
cookies com requisitos **opostos** (AMB-02).

**Fecho — dois cookies distintos, com políticas distintas:**

> **v6 (task-007, 2026-09-26):** a coluna "Cookie de sessão" está **REVOGADA** — o cookie foi
> removido do código. O cookie de `state` mantém-se integralmente como descrito.

| | Cookie de `state` | Cookie de sessão |
|---|---|---|
| `SameSite` | **`Lax`** (tem de sobreviver ao retorno do GitHub) | **`Strict`** |
| Flags | `httpOnly`, `Secure` | `httpOnly`, `Secure` |
| `Path` | Restrito à rota de callback | Restrito à área administrativa |
| TTL | **≤ 10 minutos** | **≤ 60 minutos**, absoluto, sem renovação deslizante |
| Uso | **Único — apagado no callback ANTES de qualquer validação**, mesmo quando a validação falha | Reutilizável até expirar |
| Geração | **CSPRNG ≥ 128 bits** (`crypto.randomUUID()` / `crypto.getRandomValues`). **Nunca `Math.random()`** | — |
| Comparação | **Tempo constante** | **Tempo constante** |

E, transversalmente: **`SameSite` não é, por si, proteção CSRF suficiente**; a validação de `Origin`
**falha fechada** quando o header está ausente (7A.3).

### 9.11 SEC-06 — Previews privilegiados e a tensão com a allowlist fixa

O plano corre as Fases 1-6 em deploy preview, e no plano Hobby **os URLs de preview são públicos**.
Um preview da Fase 6 com credenciais reais seria uma superfície privilegiada exposta à Internet,
protegida apenas por o URL não ser adivinhado — precisamente a proteção por obscuridade que a
restrição 16 proíbe.

Há ainda uma tensão prática que a v4 criava sem resolver (AMB-03), e que é **a fonte mais provável de
um open redirect real neste projeto**: exige-se allowlist fixa com comparação exata de origem,
enquanto os previews têm URLs que **mudam a cada deploy**. Quem implementar bate nisto no primeiro
dia, e a saída fácil é um wildcard ou `endsWith('.vercel.app')` — que reabre o 9.2 na forma exata que
o 9.2 avisa. **O desenho mandava fazer a coisa certa e criava as condições para a errada.**

**Fecho:**
- **Alias/domínio estável por ambiente** (ex.: `staging.agrotrades.co.mz` ou um alias fixo da Vercel),
  e a allowlist com **essa origem exata**. Nunca o URL efémero, nunca wildcard, **nunca**
  correspondência por sufixo em `.vercel.app`.
- **OAuth App e GitHub App separadas para não-produção**, apontadas ao repositório-sandbox. A OAuth
  App do GitHub tem a sua própria allowlist de callback: registar **apenas** o callback exato de
  produção na App de produção — defesa em profundidade gratuita, fora do nosso código.
- É a mesma medida do ponto 1 do 9.8, vista do outro lado: **uma configuração resolve os dois**.

### 9.12 SEC-08 — Logs

Proibidos em logs, explicitamente: tokens de instalação, `client_secret`, PEM (mesmo parcial), o
`code` do OAuth, o `state` e o conteúdo do cookie de sessão. **Confirmar que o handler de erro global
não serializa o objeto de pedido inteiro** — é o caminho mais comum para um segredo aparecer nos logs.

---

## 10. Plano faseado

**8 fases (0-7).** As Fases 1-6 correm em *deploy preview* — **as Fases 5 e 6 com credenciais de
sandbox, nunca as de produção** (9.8/9.11). **O domínio de produção só é tocado na Fase 7.**

**Estado dos gates de segurança após a v5:**
- **Fases 1-4:** READY. O `security-engineer` confirmou explicitamente que nada na revisão as trava.
- **Fase 5:** estava BLOCKED por SEC-02, SEC-04, SEC-05 e SEC-06. **Fechados nesta v5** (7A.3, 9.9,
  9.10, 9.11) → **desbloqueada no desenho**.
- **Fase 6:** estava BLOCKED por SEC-01, SEC-02, SEC-03, SEC-06 e SEC-07. **Fechados nesta v5** (9.8
  com a decisão 13, 7A.2, 7A.4, 9.11, 7A.7) → **desbloqueada no desenho**. **v6: CANCELADA
  (task-007, 2026-09-26)** — ver "Fase 6" abaixo.
- **Isto não é aprovação de implementação.** Desenho aprovado nunca é implementação aprovada: ambas
  as fases continuam a exigir **revisão do `security-engineer` contra o código**, com evidência
  reproduzível, **mais confirmação humana** antes de implementar. O Gate 4 **não** está dado.

---

### Fase 0 — Pré-requisitos, contas e separação de ambientes (sem código)
**Âmbito:** criar o repositório Git remoto, **público**; criar o projeto Vercel **sem método de
pagamento**; criar **duas** OAuth Apps ~~e **duas** GitHub Apps~~ (produção e não-produção), a de
não-produção ligada a um **repositório-sandbox descartável**; definir um **alias estável** para o
ambiente de preview; definir as variáveis de ambiente **apenas em Production** para as de produção
(restrição 27), marcadas como sensíveis; ~~definir `ADMIN_GITHUB_USER_IDS` com o ID numérico da pessoa
inicial;~~ `.gitignore` com `.env*` **antes do primeiro commit**.
*(v6, task-007: as GitHub Apps e `ADMIN_GITHUB_USER_IDS` só serviam a Fase 6, cancelada.)*
**Entregável:** contas, apps, alias e variáveis criadas, com prova de que **as variáveis sensíveis
não existem em Preview nem Development**; ninguém além da pessoa inicial com acesso de escrita.
**Decisão humana:** confirmar a pessoa inicial (decisão 11) e ponderar mover o repositório para uma
**Organização GitHub gratuita** (impõe 2FA, dá audit log completo — recomendado, 7A.6).
**Nota:** confirmar contra a documentação do GitHub, nesta fase, a semântica exata das permissões da
GitHub App — não contra este documento.

---

### Fase 1 — Fundação e paridade visual da homepage
**Âmbito:** Next.js (App Router, TypeScript); portar `css/style.css` com paleta e tipografia intactas
(FR-05/FR-06/AC-08); fontes via `preconnect` + `<link>`; layout base (header, nav, footer, botão
flutuante WhatsApp); homepage **em PT, com texto ainda embutido no código**; remover a pasta espúria
`{css,js,images,pages}/`.
**Entregável:** preview com a homepage PT visualmente indistinguível da atual, desktop e mobile.
**Verifica:** AC-03 (parcial), AC-08. **Decisão humana:** aceitação visual.

---

### Fase 2 — Camada de conteúdo (sem alteração visual)
**Âmbito:** estrutura `content/`; schemas Zod + tipos TS; migrar **todo** o conteúdo atual
(`SERVICES` + `translations` + textos dos HTML); ligar a homepage; validação no build.
**Entregável:** build falha de forma legível se faltar tradução ou campo obrigatório; homepage
pixel-idêntica à Fase 1, sem texto no código.
**Verifica:** NFR-01 e AC-11 (fundação). **Decisão humana:** nenhuma.

---

### Fase 3 — Rotas completas, 8 páginas de serviço e i18n
**Âmbito:** todas as rotas PT e EN (D-4); as 8 páginas de serviço de `content/services/` com o **copy
da raiz**; listagem, campanha, contactos; 404 por locale; seletor de idioma com persistência.
**Entregável:** site completo navegável no preview, nos dois idiomas.
**Verifica:** AC-01, AC-02, AC-04, AC-07, AC-09, AC-10, FR-17.
**Decisão humana:** esquema de slugs EN (`/en/services/rice/` traduzido — recomendado).
**Nota:** divisível em 3a (rotas PT) e 3b (EN + seletor).

---

### Fase 4 — SEO, metadados, redirects e **política de segurança de base**
**Âmbito:** metadados por página e idioma; `hreflang`; JSON-LD `Organization`; `sitemap.xml` e
`robots.txt` gerados; redirects 301 (D-5); headers de segurança migrados do `netlify.toml` sem
regressão, mais **CSP e HSTS**.
**Requisito antecipado do `security-engineer` (SEC-05):** montar a CSP **estrita por defeito** e
prever que `/admin` venha a ter header próprio por rota. **Não construir uma CSP global que depois
precise de ser enfraquecida para o Decap caber.**
**Entregável:** HTML com todos os metadados de AC-05; JSON-LD validado; cada redirect testado; CSP
estrita ativa.
**Verifica:** AC-05, AC-06, AC-14, NFR-04. **Decisão humana:** confirmar a `og:image`.

---

### Fase 5 — Decap CMS e proxy OAuth
> ### RISCO ELEVADO — AUTENTICAÇÃO
> Desenho desbloqueado pela v5 (SEC-02/04/05/06 fechados). **Continua a exigir revisão do
> `security-engineer` CONTRA O CÓDIGO e confirmação humana explícita antes de implementar.**

**Âmbito:** `public/admin/index.html` com bundle **auto-hospedado em versão exata** (9.9) +
`config.yml`; CSP própria de `/admin` por header de rota; proxy OAuth com allowlist fixa de
`redirect_uri` sobre **alias estável** (9.11), `targetOrigin` literal (9.3), **cookie de `state`
`SameSite=Lax`, TTL ≤ 10 min, uso único, CSPRNG ≥ 128 bits** (9.10), scope `public_repo`, segredos só
em Production; ~~identidade via `GET /user` no servidor (AMB-08); **emissão do cookie de sessão
`SameSite=Strict`, TTL ≤ 60 min, HMAC-SHA256 com `SESSION_SECRET` dedicado, payload mínimo** (7A.3);~~
*(v6: implementado na Fase 5 e removido na task-007 — sem consumidor)*
`media_folder` com limite de tamanho; `noindex` em `/admin`; `editorial_workflow`.
**Executado em preview com credenciais de sandbox.**
**Entregável:** um editor entra com conta GitHub, altera o resumo PT do serviço "arroz", publica, e a
alteração aparece no site em poucos minutos sem tocar em código — **AC-11**. Um utilizador GitHub
**sem** acesso de escrita autentica-se e não consegue gravar nada.
**Decisão humana: CONFIRMAÇÃO OBRIGATÓRIA antes de começar.**

---

### Fase 6 — Ecrã de gestão de utilizadores — **CANCELADA**
> ### CANCELADA em 2026-09-26 (task-007-remove-unused-session), aprovado pelo utilizador
> **Motivo:** exigiria a credencial mais privilegiada do sistema (GitHub App com
> `Administration: write`, que permite mudar visibilidade, desativar a proteção de `main`,
> transferir e apagar o repositório) para replicar funções que a Organização GitHub já fornece
> nativamente (convites, remoção, 2FA obrigatório, audit log).
> **Substituição (configuração, a aplicar pelo `devops-engineer`):** exigir 2FA na organização;
> permissões base dos membros "No permission" ou "Read"; editores com papel **Write** no
> repositório (equipa `editores` ou colaboradores externos), **nunca** *team maintainer*;
> administradores = owners da organização (1-2 no máximo); desativar o convite de colaboradores
> externos por Admins de repositório se não houver Admins além dos owners. A **restrição 28**
> (proteção de `main`) mantém-se como pré-condição de convidar o primeiro editor adicional.
> O texto abaixo mantém-se como registo — **não implementar**.

> ### RISCO ELEVADO — AUTORIZAÇÃO PRIVILEGIADA
> Gate próprio, separado do da Fase 5. Desenho desbloqueado pela v5 (SEC-01/02/03/06/07 fechados).
> **Continua a exigir revisão do `security-engineer` CONTRA O CÓDIGO e confirmação humana.**

**Pré-condição não negociável (restrição 28):** proteção de `main` ativa — sem push direto, PR com
revisão de terceiro — **antes de convidar o primeiro editor adicional**.
**Âmbito:** rota `/admin/users`; autorização com as **duas condições por pedido** (allowlist por ID
numérico **e** permissão de escrita atual confirmada em tempo real), na ordem de 7A.3; API
`/api/admin/collaborators` com duas operações de parâmetros fixos, **sem proxy genérico**, com
`username` validado por regex **e** `encodeURIComponent` (7A.4); GitHub App com tokens de instalação
por pedido, **nunca em variável de módulo** (7A.1); `permission: "push"` fixado no servidor; listagem
em tempo real incluindo convites pendentes; guardas de auto-remoção e do proprietário **por ID, no
servidor** (7A.7); CSRF com `Origin` a falhar fechada; **404 único pelo mesmo caminho de código**
(9.6); log de operações (7A.6); limite de taxa básico (9.7).
**Entregável:** o administrador inicial convida uma segunda pessoa pelo ecrã; ela aceita e passa a
editar conteúdo no Decap — **sem conseguir aceder a `/admin/users`**. Uma chamada direta à API por
essa pessoa é negada **com a mesma resposta que um anónimo**.
**Decisão humana: CONFIRMAÇÃO OBRIGATÓRIA antes de começar.**

---

### Fase 7 — Cutover para produção
**Âmbito:** apontar `agrotrades.co.mz` para o projeto Vercel; verificar redirects, metadados e
desempenho; confirmar que `AvaliacaoAgroTrades/` deixou de ser servido (O-2); documentar rollback e
migração de hosting (8.2).
**Entregável:** `agrotrades.co.mz` serve o novo site; URLs antigas redirecionam.
**Verifica:** AC-12, AC-13, NFR-03.
**Decisão humana: CONFIRMAÇÃO OBRIGATÓRIA** — única fase que afeta o site público.
**Rollback:** reversão instantânea na Vercel, ou reapontar o DNS para a Netlify, que se mantém
intacta até validação. O `devops-engineer` confirma **antes** do cutover.

---

## 11. Sobre o `ux-ui-designer`

**Não é necessário em nenhuma fase.** Fases 1-4 visam paridade visual; a Fase 5 usa o interface do
Decap sem personalização. *(v6, task-007: a menção à Fase 6 — ecrã administrativo mínimo — foi
retirada com o cancelamento dessa fase.)*

---

## 12. Restrições vinculativas para o Developer

> **v6 (task-007, 2026-09-26):** restrições marcadas "[REVOGADA — task-007]" deixaram de se aplicar
> com o cancelamento da Fase 6 e a remoção do cookie de sessão. O texto original mantém-se riscado
> como registo.

**Segredos e credenciais**
1. `client_secret` ~~, chave privada da GitHub App, `installation_id`, `ADMIN_GITHUB_USER_IDS` e
   `SESSION_SECRET`~~ **apenas** em variáveis de ambiente do servidor. Nunca em
   `public/admin/config.yml`, nunca em `NEXT_PUBLIC_`, nunca no repositório — que é público. `.env*`
   no `.gitignore` **antes** do primeiro commit. Segredo commitado tem de ser **rotacionado**.
2. [REVOGADA — task-007, parte de tokens de instalação] ~~Tokens de instalação gerados por pedido,
   de curta duração, nunca guardados, nunca devolvidos ao cliente, nunca escritos em logs.~~

**Fluxo OAuth (Fase 5)**
3. `redirect_uri` validado contra allowlist fixa no servidor, nunca refletido nem reconstruído.
   Comparação exata de origem, sem prefixo nem sufixo.
4. `postMessage` com `targetOrigin` explícito, nunca `'*'`; validar `event.origin` na receção.
5. Parâmetro `state` obrigatório, verificado no callback.
6. Scope `public_repo`, não `repo`.

**Gestão de utilizadores (Fase 6) — [REVOGADAS — task-007], Fase 6 cancelada**
7. [REVOGADA — task-007] ~~**A allowlist de administradores nunca fica no repositório** — variável de ambiente da Vercel.~~
8. [REVOGADA — task-007] ~~Allowlist por **ID numérico** do GitHub, nunca por username.~~
9. [REVOGADA — task-007] ~~Autorização verificada **na rota de servidor, a cada pedido**. Esconder botões não é autorização.~~
10. [REVOGADA — task-007] ~~`permission: "push"` fixado no código do servidor; nunca vem do cliente.~~
11. [REVOGADA — task-007] ~~**Nenhum endpoint proxy genérico para a API do GitHub.**~~
12. [REVOGADA — task-007] ~~Proteção CSRF em todas as mutações: cookie `SameSite=Strict` mais validação de `Origin`.~~
13. [REVOGADA — task-007] ~~Guardas contra auto-remoção e remoção do proprietário; confirmação explícita antes de remover.~~
14. [REVOGADA — task-007] ~~`/admin/users` responde de forma indistinguível a anónimos e a editores sem privilégio.~~

**Gerais**
15. Não iniciar a Fase 5 nem a Fase 6 sem confirmação humana e revisão do `security-engineer`. São
    **dois gates separados**.
16. Não proteger `/admin` por obscuridade.
17. Nenhum texto visível hardcoded: nav, botões, estatísticas do hero, moradas e rodapé vêm de
    `content/`.
18. Todo o campo traduzível `{pt,en}` no mesmo ficheiro.
19. Validação Zod a correr no build, a falhar de forma legível.
20. Não commitar vídeo; embeber do YouTube. Imagens otimizadas, com limite no `config.yml`.
21. Nenhuma conta (Vercel, GitHub) com método de pagamento associado.
22. Não usar serviços proprietários da Vercel nem o otimizador de imagens; manter proxy OAuth e API
    de colaboradores isolados e pequenos.
23. Paleta de cores e tipografia são requisito literal (FR-05/FR-06).
24. A precedência da secção 4 do `requirements.md` não é reaberta.
25. O domínio de produção não é tocado antes da Fase 7. `AvaliacaoAgroTrades/` nunca publicada.
26. Não implementar formulários que recolham dados pessoais de visitantes nesta tarefa.

**Acrescentadas na v5 pelo `security-engineer` (27-38) — vinculativas nas Fases 5 e 6**
27. Segredos privilegiados (`client_secret` da OAuth App ~~, `GITHUB_APP_PRIVATE_KEY`,
    `GITHUB_APP_INSTALLATION_ID`, `ADMIN_GITHUB_USER_IDS`, `SESSION_SECRET`~~) definidos **apenas**
    no ambiente **Production** da Vercel. Nunca em Preview nem Development. Preview usa credenciais
    descartáveis e repositório-sandbox. *(v6, task-007: variáveis da App, allowlist e
    `SESSION_SECRET` deixaram de existir.)*
28. **Proteção de `main`** (sem push direto; PR com revisão de terceiro) configurada **ANTES** de
    convidar o primeiro editor adicional. ~~**Pré-condição do entregável da Fase 6, não recomendação.**~~
    **v6: pré-condição do ato de convidar o primeiro editor adicional, seja qual for o meio (hoje, a
    interface da Organização GitHub) — não recomendação.** Protege contra o SEC-01 para o
    `client_secret`, que continua a existir.
29. [REVOGADA — task-007] ~~Autorização privilegiada exige **DUAS condições por pedido**: ID na allowlist **E** permissão de
    escrita atual confirmada em tempo real contra a API do GitHub.~~
30. [REVOGADA — task-007; cookie removido do código] ~~Cookie de sessão: **TTL absoluto ≤ 60 min, sem renovação deslizante**; HMAC-SHA256 com
    `SESSION_SECRET` dedicado; algoritmo **fixado no código, nunca lido do token**; comparação em
    tempo constante; **payload mínimo** (ID numérico + expiração), sem token GitHub.~~
31. ~~**Dois cookies distintos:**~~ Cookie de `state` (`httpOnly`, `Secure`, **`SameSite=Lax`**,
    `Path` restrito ao callback, TTL ≤ 10 min, **uso único, apagado no callback antes de validar**)
    ~~e sessão (**`SameSite=Strict`**)~~. *(v6, task-007: só o cookie de `state` se mantém.)*
32. `state` gerado com **CSPRNG, ≥ 128 bits**, comparado em tempo constante. **Nunca
    `Math.random()`**.
33. Validação de `Origin` **FALHA FECHADA** quando o header está ausente. `SameSite` sozinho **não é**
    proteção CSRF suficiente.
34. [REVOGADA — task-007] ~~`username` validado por **allowlist de formato** (regex de username do GitHub) **E** codificado
    com `encodeURIComponent` antes de entrar em qualquer caminho de URL da API do GitHub.~~
35. [REVOGADA — task-007] ~~Guardas de auto-remoção e de remoção do proprietário comparadas por **ID numérico** e aplicadas
    **na rota de servidor**. Confirmação na UI é adicional, nunca substitutiva.~~
36. Bundle do Decap **auto-hospedado, versão exata, lockfile commitado**. Se CDN: versão exata + SRI.
    CSP permissiva **confinada a `/admin` por header de rota**; nunca relaxar a CSP global da Fase 4.
37. [REVOGADA — task-007] ~~**Um único código de resposta para todos os não-autorizados (404)**, na página e na API, gerado
    **pelo mesmo caminho de código**. Sem ramo 403/404 distinto.~~
38. ~~Tokens de instalação nunca guardados — **incluindo em variáveis de módulo**, que persistem entre
    invocações quentes. Chave privada em **base64** numa env var; erros de parsing nunca imprimem a
    chave.~~ [parte da App REVOGADA — task-007] `code`, `state`, cookie ~~e PEM~~ **proibidos em logs**.
