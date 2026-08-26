STATUS: BLOCKED
SUMMARY: O utilizador reviu o preview da Fase 1-4 e pediu melhorias visuais/de conteúdo em três áreas, sem alterar os "Destaques" (mantêm-se como estão): (1) página de detalhe de serviço — descrição deixa de ser um bloco de texto corrido e passa a ser organizada por secções/tópicos com variação visual entre elas, mais uma galeria de imagens do serviço, mais uma imagem de fundo no banner/hero de topo; (2) cartões da lista de serviços (`/servicos`) passam a ter imagem de fundo/capa, tal como o banner de detalhe; (3) página "Quem Somos" — texto institucional mais desenvolvido (missão, visão, sustentabilidade, parceria, inovação, excelência como blocos de valores) e secção de equipa redesenhada com um cartão destacado para o primeiro membro (CEO) e grid de cartões menores para os restantes, com bio e tags de especialidade. Fica ABERTA uma ambiguidade bloqueante sobre a origem das imagens (ver BLOCKERS) que tem de ser decidida pelo utilizador antes do `ux-ui-designer` avançar. Fora isto, nada requer decisão do utilizador. Classificação mantém-se MEDIUM — é conteúdo institucional público, sem sinais de risco elevado (sem autenticação, sem dados pessoais de clientes, sem schema de produção alterado além de content/).

ARTIFACTS: requirements funcionais e critérios de aceitação abaixo (não foi criado requirements.md separado — conteúdo incluído neste handoff por ser um incremento pontual sobre o requirements.md já existente da Fase 0).

ISSUES (ambiguidades identificadas):
1. [ABERTA — ver BLOCKERS] Origem das imagens (banner de serviço, galeria, fotos de equipa). O utilizador referiu como layout de equipa um site de teste próprio (https://agrotrades-teste.netlify.app/quem-somos) que usa imagens de stock do Unsplash carregadas por URL externa. Não há indicação de que o utilizador tenha fotos reais da empresa/equipa/serviços disponíveis para entregar agora.
2. [RESOLVIDA — não ambígua] Uso de emojis no site de referência (🎯🌟🌱🤝⚡🏆). Confirmado pelo utilizador que é só inspiração de layout, não de estilo — a regra "sem emojis em nenhuma parte do projeto" (context.md) mantém-se sem exceção; qualquer ícone equivalente a estes tem de ser SVG na paleta `--green`/`--orange` já usada no projeto, seguindo o mesmo padrão de `content/schemas/index.ts` (`iconName` enum). Nota para o próximo agente: os ícones necessários para os 6 valores (missão, visão, sustentabilidade, parceria, inovação, excelência) provavelmente exigem novos valores no enum `iconName` — hoje só existe `leaf` (sustentabilidade) e `handshake` (parceria) como candidatos diretos; faltam equivalentes para missão/alvo, visão/olho, inovação/raio, excelência/troféu. Isto é uma decisão de implementação (UX/Architect/Developer), não de requisitos — fica só sinalado aqui para não bloquear o design à procura de um ícone que não existe.
3. [RESOLVIDA — não ambígua] "Ajustes diferentes" entre secções da descrição do serviço foi interpretado como variação visual (não variação de conteúdo/significado) — cada secção pode ter tratamento visual distinto (ex.: alternância de layout, destaque de ícone, cor de fundo), mas o texto de cada secção continua a ser conteúdo normal vindo de content/, sem lógica condicional de negócio. Fica ao critério do `ux-ui-designer` decidir o padrão visual concreto.
4. [NOTA — não é ambiguidade, é limite de schema atual a rever] O schema `teamSchema` em `content/schemas/index.ts` tem hoje `min(2).max(3)` membros e nenhum campo de bio longa/tags. O pedido de layout "destaque + grid" implica pelo menos repensar este limite e adicionar campos novos (ver secção de campos abaixo). Isto é uma alteração de schema de conteúdo, não de arquitetura de sistema — cabe ao `ux-ui-designer`/`software-architect` confirmar o desenho exato dos novos campos, mas o requisito funcional (o que tem de existir) está definido abaixo.

BLOCKERS: Decisão humana pendente sobre a origem das imagens antes do `ux-ui-designer` desenhar o layout final (isto não é uma questão de arquitetura vinculativa que eu possa resolver sozinho — afeta CSP, sourcing de conteúdo, e prazo). Três opções, com trade-offs, para o Orchestrator apresentar ao utilizador:

  (a) Imagens placeholder locais (SVG/JPEG genéricos, como já existe para a foto de equipa em `public/images/team/placeholder.svg`), commitadas no repositório, a substituir depois por fotos reais via Decap CMS quando o utilizador as fornecer. Vantagem: nenhuma dependência externa nova, nenhuma alteração à CSP definida na Fase 4, disponível para implementar já. Desvantagem: o preview visual não fica "definitivo" (placeholders genéricos, não fotos da empresa/equipa/serviços reais).

  (b) Imagens de stock externas via URL (ex. Unsplash, como no site de referência do utilizador). Vantagem: resultado visual mais parecido com a referência mostrada, imediatamente. Desvantagem: (i) depende de um serviço fora do controlo da AgroTrades, sujeito aos termos/disponibilidade do Unsplash; (ii) exige adicionar `images.unsplash.com` (ou equivalente) à Content-Security-Policy definida como restrição vinculativa na Fase 4 — é uma alteração à arquitetura de segurança já fechada, não trivial; (iii) não são fotos reais da empresa nem da equipa, o que é especialmente estranho para os retratos da secção de equipa (pessoas de stock a representar a CEO e colaboradores reais).

  (c) O utilizador fornece desde já fotos reais (serviços, instalações, equipa) para serem commitadas no repositório (media folder do Decap, tal como já decidido na arquitetura para imagens/vídeo). Vantagem: resultado final definitivo, sem dependência externa, sem tocar na CSP. Desvantagem: exige que o utilizador tenha ou consiga estas fotos antes de continuar, o que pode atrasar o início do trabalho de design.

  Nota: a opção (a) não é mutuamente exclusiva com (c) — pode arrancar-se com (a) para não bloquear o `ux-ui-designer`, e substituir por (c) assim que houver fotos reais, sem trabalho adicional de desenvolvimento (é só troca de ficheiro/campo no Decap CMS). A opção (b) é a única que teria de ser explicitamente descartada ou aceite antes de avançar, por implicar alterar uma restrição de arquitetura já fechada (CSP).

REQUIRED_NEXT_ACTION: Orchestrator deve apresentar as três opções de origem de imagens ao utilizador e obter uma decisão explícita (secção 4 do CLAUDE.md aplica-se por prudência, mesmo não sendo um dos gatilhos formais, porque altera uma restrição de arquitetura já fechada — a CSP — se a opção (b) for escolhida). Só depois disso o `ux-ui-designer` deve avançar para desenhar: (1) o layout de secções da descrição de serviço com variação visual, (2) a galeria de imagens, (3) o banner com imagem de fundo (página de detalhe e cartões da lista), (4) o redesign da secção de equipa (cartão destacado + grid) e o layout dos 6 blocos de valores institucionais na página Quem Somos. O `ux-ui-designer` deve também confirmar com o `software-architect` a necessidade de novos valores no enum `iconName` antes de fechar os ícones dos valores institucionais.

CONTEXT_FOR_NEXT_AGENT (requisitos funcionais e critérios de aceitação completos):

## FR-1 — Página de detalhe de serviço: banner com imagem de fundo
- FR-1.1: O hero/banner no topo de cada página de detalhe de serviço (`/servicos/[slug]`, `/en/services/[slug]`) passa a ter uma imagem de fundo, além do título/tag/breadcrumb já existentes.
- FR-1.2: A imagem de fundo vem de um novo campo em `content/services/*.json` (ex. `bannerImage`), com texto alternativo traduzível `{pt, en}` para acessibilidade (`bannerImageAlt` ou equivalente) — nenhuma imagem sem `alt`.
- FR-1.3: Os "Destaques" (checklist verde de `highlights`) não são alterados — mantêm-se exatamente como estão hoje, sem mudança de conteúdo, posição ou estilo.

AC-1.1: Cada uma das 8 páginas de serviço mostra uma imagem de fundo distinta (ou pelo menos configurável por serviço) no banner de topo — testável verificando que o campo `bannerImage` de cada `content/services/*.json` é lido e renderizado, e que a secção de Destaques permanece inalterada face ao snapshot atual.
AC-1.2: Se `bannerImage` estiver em falta para um serviço, o build falha de forma legível (validação Zod), tal como já acontece para campos bilingues em falta — nenhuma página em produção sem imagem de banner silenciosamente.
AC-1.3: A imagem tem texto alternativo não vazio em `pt` e `en`.

## FR-2 — Página de detalhe de serviço: descrição estruturada por secções
- FR-2.1: O campo `description` (hoje um único bloco de texto corrido por serviço) passa a poder ser apresentado como uma lista de secções/tópicos, cada uma com um título curto `{pt, en}` e um texto `{pt, en}`, em vez de um único parágrafo longo.
- FR-2.2: Cada secção pode ter tratamento visual diferente das outras (ex. alternância de layout esquerda/direita, ícone de destaque, fundo alternado) — a variação é responsabilidade do `ux-ui-designer`, o requisito funcional é apenas que a estrutura de conteúdo suporte secções distintas identificáveis (não é preciso um único template repetido igual para todas).
- FR-2.3: Nem todos os serviços têm necessariamente "muita informação" — o campo de secções deve ser opcional por serviço; quando ausente ou vazio, a página usa o `description` atual (bloco único) como fallback, para não obrigar a reescrever todo o conteúdo de uma vez.

AC-2.1: Um serviço com o novo campo de secções preenchido mostra cada secção com o seu próprio título e texto, e não o bloco `description` original.
AC-2.2: Um serviço sem o novo campo preenchido continua a mostrar o `description` atual sem quebrar — nenhuma regressão nos 8 serviços já existentes até serem migrados individualmente.
AC-2.3: Título e texto de cada secção existem em `pt` e `en`; falha de build se faltar uma tradução, seguindo o padrão `bilingualString` já usado no resto do schema.

## FR-3 — Página de detalhe de serviço: galeria de imagens
- FR-3.1: Cada página de detalhe de serviço ganha uma galeria de imagens do serviço, distinta da imagem de banner.
- FR-3.2: A galeria vem de um novo campo em `content/services/*.json` (ex. `gallery`), array de objetos com caminho da imagem e `alt` `{pt, en}` cada.
- FR-3.3: A galeria é opcional por serviço (mesma lógica de fallback graceful do FR-2.3) — um serviço sem imagens de galeria ainda preenchidas não mostra uma secção de galeria vazia ou quebrada.

AC-3.1: Um serviço com `gallery` preenchido mostra todas as imagens listadas, cada uma com o seu `alt`.
AC-3.2: Um serviço sem `gallery` (array vazio ou campo ausente) não renderiza uma secção de galeria vazia.
AC-3.3: Nenhuma imagem de galeria sem `alt` não vazio em `pt` e `en` passa a validação de build.

## FR-4 — Cartões da lista de serviços (`/servicos`, `/en/services`): imagem de capa
- FR-4.1: Cada cartão de serviço na página de listagem passa a mostrar uma imagem de capa/fundo, reutilizando o mesmo campo `bannerImage` do FR-1 (não um campo duplicado) — a mesma imagem de banner do detalhe é usada como capa do cartão na lista, para não exigir duas imagens por serviço nesta fase.
- FR-4.2: Ícone (`icon`, do enum `iconName`) e imagem de capa coexistem — a imagem não substitui o ícone, é um elemento visual novo adicional; a decisão de como combinar os dois no cartão é do `ux-ui-designer`.

AC-4.1: Cada um dos 8 cartões de serviço na listagem mostra a imagem de `bannerImage` do respetivo serviço.
AC-4.2: Alterar `bannerImage` num ficheiro `content/services/*.json` reflete-se tanto no cartão da lista como no banner de detalhe do mesmo serviço, confirmando que é o mesmo campo/fonte de verdade.

## FR-5 — Página "Quem Somos": texto institucional mais rico
- FR-5.1: O texto institucional da página `/quem-somos` (`fullText`, hoje um array curto em `content/site/about.json`) é expandido com conteúdo mais desenvolvido, mantendo a estrutura de array de parágrafos `{pt, en}` já existente no schema — não é uma alteração de schema, é enriquecimento de conteúdo, a redigir pelo utilizador ou por quem gere o conteúdo (fora do âmbito deste agente decidir o texto final).
- FR-5.2: É acrescentada uma nova secção de "valores institucionais", com 6 blocos: Missão, Visão, Sustentabilidade, Parceria, Inovação, Excelência — cada bloco com um título curto `{pt, en}`, um texto `{pt, en}` e um ícone SVG (nunca emoji) do enum `iconName` existente ou de novos valores a acrescentar a esse enum.
- FR-5.3: Nenhum dos ícones destes 6 blocos pode ser um emoji, incluindo os que no site de referência do utilizador são 🎯🌟🌱🤝⚡🏆 — têm de ser SVG na paleta de cores do projeto (`--green`/`--orange`), reforçando a regra já vinculativa de context.md.

AC-5.1: A página `/quem-somos` (e `/en/about` ou equivalente) mostra 6 blocos de valores, cada um com título, texto e ícone SVG, em `pt` e `en`.
AC-5.2: Nenhum ficheiro de conteúdo do projeto (incluindo os novos campos deste redesign) contém caracteres emoji — verificável por inspeção/grep dos ficheiros `content/**` e do output renderizado.
AC-5.3: O texto institucional (`fullText`) tem mais parágrafos/mais desenvolvimento do que o estado atual (comparável ao nível de detalhe do site de referência do utilizador, sem copiar o texto literal desse site, que é de outra empresa/domínio de teste).

## FR-6 — Página "Quem Somos": redesign da secção de equipa
- FR-6.1: O primeiro membro da equipa (ordem no array `content/site/team.json`, tipicamente a CEO) é apresentado num cartão maior/destacado, distinto visualmente dos restantes, com: foto grande, nome, cargo, uma bio mais longa (novo campo, não existe hoje) e um conjunto de badges/tags de especialidade (novo campo, array de strings ou de `{pt,en}`).
- FR-6.2: Os restantes membros são apresentados num grid de cartões mais pequenos, cada um com: foto, cargo (estilo visual em maiúsculas pequenas é decisão de UX, não de conteúdo), nome, uma bio curta (pode reaproveitar o campo `frase` já existente ou ser um novo campo `bio` — a decidir pelo `ux-ui-designer`/`software-architect` ao desenhar o schema final) e tags.
- FR-6.3: O limite atual do schema (`min(2).max(3)` membros) tem de ser revisto — o layout "destaque + grid" só faz sentido pleno com pelo menos 1 destaque + 2 no grid (3 no total, já suportado), mas o limite máximo de 3 deve deixar de ser uma restrição rígida de schema, para permitir crescer a equipa no futuro via Decap CMS sem exigir nova alteração de código. Esta é uma recomendação de requisito, a confirmar tecnicamente pelo `software-architect`.
- FR-6.4: Nenhum ícone de tag/badge pode ser emoji — mesma regra do FR-5.3.

AC-6.1: A página `/quem-somos` mostra visualmente um cartão distinto (maior/destacado) para o primeiro membro do array `team.json`, e os restantes em formato de grid menor — testável por inspeção do DOM/CSS renderizado, comparando classes/dimensões do primeiro cartão com os seguintes.
AC-6.2: O cartão destacado mostra nome, cargo, foto, bio longa e pelo menos uma tag de especialidade; um cartão do grid mostra nome, cargo, foto, bio curta e pelo menos uma tag — se os campos de bio/tags não estiverem preenchidos para um membro (dados ainda placeholder), a página não quebra, mostra apenas os campos disponíveis.
AC-6.3: Nenhuma imagem de membro da equipa sem `alt` (implícito: usar `nome` como alt, já é o padrão razoável, a confirmar com `ux-ui-designer`).
AC-6.4: `content/schemas/index.ts` (`teamSchema`) passa a aceitar os novos campos sem quebrar a validação dos 3 membros placeholder já existentes em `team.json` (que podem ficar sem bio longa/tags preenchidas até o utilizador os editar via Decap CMS — mesma lógica de "arrancar com placeholders" já usada para a equipa na Fase 3).

## FR-7 — Sem alteração aos Destaques
- FR-7.1: A secção "Destaques" (checklist verde, campo `highlights` em `content/services/*.json`) não sofre nenhuma alteração de conteúdo, posição, estilo ou schema neste pedido.

AC-7.1: Comparação visual/estrutural antes/depois confirma que `highlights` e a sua renderização permanecem bit-a-bit iguais ao estado da Fase 4.

## Confirmação de classificação de risco
Nenhum destes requisitos introduz autenticação, dados pessoais de clientes (as bios/fotos da equipa são de colaboradores da própria empresa, conteúdo institucional já previsto e aprovado desde a Fase 3, não dados de "clientes"), integração bancária ou alteração a schema de produção fora de `content/`. Classificação mantém-se **MEDIUM**. Único ponto que tocaria uma restrição de arquitetura já fechada é a opção (b) da ambiguidade de imagens (alterar a CSP para permitir um domínio externo de imagens) — por isso está marcada como bloqueante e não decidida por este agente.
