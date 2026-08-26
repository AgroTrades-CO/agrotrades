# Project Context — AgroTrades

## Sobre o negócio

Site institucional da **AGRO TRADES, LDA**, empresa agrícola moçambicana (Nampula/Moma) — produção
de arroz, cereais e legumes, mecanização agrícola, preparação de terras, moageira/processamento
industrial, apoio técnico e comercialização agrícola. Site em PT/EN, com CTA principal para
WhatsApp (`+258 84 103 1220`).

## Stack atual (estado presente)

```
Linguagem:      HTML5 + CSS3 + JavaScript vanilla (sem build step)
Framework:      Nenhum — site 100% estático, multi-página
Base de dados:  Nenhuma — todo o conteúdo (textos, serviços, traduções) está hardcoded em HTML/JS
Ferramentas:    Netlify (hosting + headers de segurança + redirects), sem CI/CD além do deploy do Netlify
Framework de testes: Nenhum
i18n:           Client-side, via atributos data-i18n + dicionário JS (js/main.js), troca de texto
                no DOM após load, idioma persistido em localStorage
```

Estrutura de ficheiros (raiz):
- `index.html`, `servicos.html`, `servico.html` (detalhe via `?id=`), `campanha.html`, `contactos.html`
- `css/style.css`, `js/main.js`, `images/logo.jpeg`
- `netlify.toml` (publish=".", headers de segurança básicos, redirect `/home` → `/`)
- `robots.txt`, `sitemap.xml`

## Duas versões de design a fundir

Existem atualmente **duas variantes** do mesmo site estático, e o objetivo da migração é
**aproveitar o melhor das duas** antes/durante a reescrita na nova stack:

1. **Raiz do repo** (`index.html`, `servicos.html`, etc.) — design primário/base.
2. **`AvaliacaoAgroTrades/uploads/agrotrades/`** — mesma estrutura visual, mas com ajustes que
   valem a pena preservar:
   - SEO mais completo: favicon, `og:image`/`og:url`, `twitter:card`, JSON-LD `Organization`
     (nome, telefone, email, endereço).
   - Páginas de serviço **estáticas e individuais** (`servico-arroz.html`, `servico-cereais.html`,
     `servico-mecanizacao.html`, `servico-moageira.html`, `servico-terras.html`,
     `servico-apoio-tecnico.html`, `servico-comercializacao.html`, `servico-campanha.html`) em vez
     de uma única `servico.html?id=...` — melhor para SEO e partilha de links.
   - Página `404.html` dedicada (não existe na raiz).
   - Copy dos serviços mais desenvolvida/detalhada (resumos e descrições mais longas e
     específicas) — ver `js/main.js` (array `SERVICES`) da raiz, que já tem o texto mais completo
     incorporado, e comparar com o HTML estático da pasta `AvaliacaoAgroTrades` para os textos
     página-a-página.
   - `@import` de fontes movido para `<link rel="preconnect">` + `<link rel="stylesheet">` no
     `<head>` (mais rápido que `@import` no CSS) — melhoria de performance a manter.

CSS é praticamente idêntico entre as duas versões (só difere a forma de carregar a fonte).

## Objetivo da migração (arquitetura fechada — task-001-migracao-stack, v4)

Migração de site estático para stack dinâmica com conteúdo editável, tratada como **LARGE**
(decisão de arquitetura de fundação). Documentação completa em
`project/state/task-001-migracao-stack/` (`requirements.md`, `architecture-proposal.md` v4,
`handoff-01-product-analyst.md`, `handoff-02-software-architect.md`). Decisões fechadas com o
utilizador:

- **Framework:** Next.js (App Router, TypeScript).
- **Hosting:** Vercel. **Risco aceite conscientemente:** o plano Hobby (gratuito) proíbe uso
  comercial nos termos de serviço; um site de empresa cai nessa definição. O utilizador foi
  informado e optou por manter a Vercel mesmo assim — não é um bloqueador, mas mitigar significa
  nunca associar cartão de crédito à conta e não usar serviços proprietários da Vercel (KV,
  Postgres, Blob, otimizador de imagens) para reduzir o custo de reagir se a regra for aplicada.
- **Conteúdo:** ficheiros JSON/MDX versionados no repositório (nunca base de dados), com todo o
  campo traduzível como `{pt, en}` no mesmo ficheiro, validados por schema Zod no build.
- **Gestão de conteúdo:** **Decap CMS** (backend `github`) em `/admin` — sem painel próprio, sem
  Firebase/Firestore. Editor grava → commit → build automático. Rollback é nativo do Git.
- **Repositório:** GitHub, dentro de uma **Organização gratuita** (não conta pessoal) — permite
  obrigar 2FA a todos os colaboradores e dá audit log completo, importante porque a conta GitHub
  de cada editor passa a ser, na prática, a chave de acesso ao site. Repositório **público**
  (decisão deliberada: não há segredos no repo, e público permite ao token OAuth o scope mínimo
  `public_repo` em vez de `repo`, que daria acesso a todos os repositórios privados de cada
  editor). Consequência a comunicar a quem for convidado: os seus commits/username ficam
  publicamente visíveis e associados à empresa.
- **Gestão de utilizadores (quem pode editar):** ecrã próprio `/admin/users`, separado do Decap,
  que usa uma **GitHub App** instalada só neste repositório com permissão granular
  `Administration: write` (nunca um token clássico com scope `repo`, nunca `Contents: write` nessa
  credencial). Dois papéis distintos: *editor* = acesso de escrita no GitHub; *administrador* =
  quem pode convidar/remover editores, decidido por uma allowlist de IDs numéricos **em variável
  de ambiente da Vercel**, nunca num ficheiro do repositório (senão qualquer editor podia
  conceder-se esse poder a si próprio). Um administrador inicial confirmado para arrancar.
- **Imagens e vídeo:** commitados no próprio repositório (media folder do Decap). Vídeo grande é
  má prática em Git — usar embed do YouTube em vez de commitar o binário.
- **i18n:** routing por locale gerado no build (PT na raiz `/`, EN em `/en/`), não troca client-side.
- **`og:image` (Fase 4):** mantém-se o logótipo atual (`images/logo.jpeg`) — decisão confirmada
  pelo utilizador, sem imagem dedicada de partilha por agora. Pode ser revisitado no futuro.
- **Fora de âmbito nesta migração:** formulário de contacto (recolheria dados pessoais, reclassifica
  a tarefa — ver secção seguinte). Mantém-se apenas o CTA WhatsApp.
- **Adição de âmbito pós-Fase 1 (aprovada pelo utilizador):** nova página **"Quem Somos"** no menu
  de navegação, com todo o texto institucional já existente (o que hoje está na secção "Sobre a
  empresa" da homepage) **mais uma secção de Equipa** (nome, cargo, foto, frase curta opcional por
  membro) que não existe no site atual. A secção "Sobre a empresa" da homepage mantém-se como está
  hoje (resumo), passando a incluir um link "Saber mais" para a página completa — não é substituída.
  Dados da equipa: arrancar com placeholders (2-3 membros de exemplo), a preencher depois pelo
  utilizador via Decap CMS — não bloqueia a implementação. Isto não é uma decisão de arquitetura
  nova: cabe no modelo de conteúdo já definido (mais uma coleção `team` + rota `/quem-somos`, campos
  traduzíveis `{pt,en}` como as restantes). A incorporar nas Fases 2 (modelo de conteúdo) e 3
  (rotas) do plano faseado, sem precisar de repetir o ciclo de arquitetura.
- **`ux-ui-designer` não necessário** em nenhuma fase (paridade visual + UI própria do Decap).

**Plano faseado (0–7), cada fase com entregável verificável e aprovação humana antes da seguinte;
domínio de produção só tocado na fase de cutover final.** Três gates de confirmação humana
obrigatória + `security-engineer` antes de qualquer código, cada um separado dos outros: (1) fase
do Decap CMS + proxy OAuth GitHub, (2) fase do ecrã de gestão de utilizadores (credencial mais
privilegiada do sistema — aprovar a 1 não aprova a 2), (3) cutover de produção. Ver `architecture-
proposal.md` secção 12 para a lista completa de restrições vinculativas para o developer.

## Convenções específicas deste projeto

- Não há dados sensíveis, autenticação, pagamentos ou schema de produção neste projeto — é um
  site institucional público. Classificação de risco por defeito: **TRIVIAL/SMALL/MEDIUM**,
  nunca LARGE, salvo se no futuro for adicionado algo como formulário que recolha dados pessoais
  de clientes (nesse caso reclassificar conforme `CLAUDE.md` secção 1).
- Ao migrar, preservar: conteúdo em PT/EN, CTA de WhatsApp, paleta de cores/tipografia atual
  (`--green`, `--orange`, `--earth`, Playfair Display + DM Sans), estrutura de navegação
  (Início/Serviços/Campanha/Contactos).
- Qualquer nova dependência ou serviço externo introduzido deve ter um free tier genuíno e
  suficiente para as necessidades do site (baixo tráfego institucional) — confirmar limites antes
  de adotar.
- **Sem emojis em nenhuma parte do projeto** (código, conteúdo, UI, commits, documentação gerada
  para o utilizador final). O site atual usa emojis como ícones dos serviços (🌾🚜🌽🏭 etc.) e nos
  `about-tag` — na migração, estes têm de ser substituídos por ícones SVG (ex.: um icon set aberto
  e gratuito, mantendo a paleta de cores `--green`/`--orange`) e nunca por caracteres emoji.

## Áreas de risco elevado

Autenticação, integrações bancárias, pagamentos, schema de produção ou dados pessoais de clientes
classificam a tarefa como **LARGE** (ver `CLAUDE.md`, secção 1) — isto já não significa parar
automaticamente, significa que o `software-architect` e o `security-engineer` são sempre
acionados, e que a confirmação humana obrigatória (secção 4 do `CLAUDE.md`) se aplica antes de
qualquer implementação nestas áreas. Não se aplica hoje a este site, mas passará a aplicar-se se
for introduzido, por exemplo, um formulário que armazene dados pessoais de visitantes/clientes.
