STATUS: BLOCKED
SUMMARY: O utilizador reviu o preview pós-redesign e pediu 6 alterações: (1) o banner da homepage passa de estático a slider com imagens e vídeo; (2) todas as páginas (não só o detalhe de serviço) passam a suportar imagem de banner; (3) os 4 cartões de serviço da homepage passam a ter imagem de capa, tal como já acontece em `/servicos`; (4) favicon a partir do logótipo (já resolvido tecnicamente, falta ligar ao `<head>`); (5) logótipo do header/footer sem fundo (já resolvido tecnicamente, falta trocar a referência de ficheiro); (6) todo o conteúdo editável no Decap CMS, incluindo poder desativar uma secção/bloco inteiro — pedido transversal que introduz um conceito novo no schema (`enabled`/`visible`), a aplicar a todas as secções opcionais existentes e futuras. Os pontos 1, 2, 3 e 6 estão especificados abaixo com critérios de aceitação verificáveis. Ficam **3 ambiguidades bloqueantes** (slider vazio, vídeo local vs. YouTube, e comportamento visual de "secção desativada") que exigem decisão explícita do utilizador antes do `ux-ui-designer` desenhar o slider e o software-architect fechar o padrão de toggle no Decap. Classificação mantém-se **MEDIUM** — nenhum destes pontos introduz autenticação, dados pessoais de clientes, integração bancária ou schema de produção fora de `content/`.

ARTIFACTS: requisitos funcionais e critérios de aceitação abaixo (incremento pontual sobre `requirements.md` da Fase 0 e sobre os schemas confirmados em `handoff-19`/`handoff-26`, tal como já é o padrão desde `handoff-17`; não foi criado ficheiro `requirements.md` separado).

ISSUES (ambiguidades identificadas):
1. [ABERTA — ver BLOCKERS] Slider da homepage vazio/sem slides é um estado válido, ou tem sempre de existir pelo menos 1 slide (com um default hardcoded se o admin não configurar nenhum)?
2. [ABERTA — ver BLOCKERS] Vídeo no slider: ficheiro local commitado no repositório (mesma restrição já registada no `handoff-19` sobre binários grandes em Git — má prática, limite de tamanho) ou embed do YouTube (sem peso no repo, mas introduz dependência/domínio externo, o que tocaria a CSP definida como restrição vinculativa na Fase 4)?
3. [ABERTA — ver BLOCKERS] Quando uma secção/bloco é desativado no admin, o espaço dela desaparece completamente da página (DOM não renderiza nada) ou fica um placeholder visualmente discreto só para quem edita perceber que a secção existe mas está desligada? Nota: um placeholder visível para todos os visitantes do site não é aceitável (mostraria "conteúdo desligado" ao público) — a opção só faz sentido se for algo exclusivo do preview do editor no Decap CMS, o que muda o esforço técnico; sinalizo isto ao Orchestrator para explicitar ao utilizador que a opção "placeholder" tem esse custo adicional.
4. [RESOLVIDA — não ambígua] Âmbito exato do ponto 6 nesta ronda: aplica-se a todas as secções/blocos hoje opcionais no schema (ver FR-6.2 abaixo) mais os novos blocos de imagem criados pelos pontos 1-3 deste pedido. Não se aplica a blocos estruturalmente obrigatórios (ex.: hero da homepage, os 8 serviços, os 6 valores institucionais com `.length(6)`) — desativar um bloco obrigatório deixaria a página num estado que o design nunca especificou; se o utilizador quiser isso também, é um pedido novo a tratar à parte.
5. [RESOLVIDA — não ambígua] Pontos 4 e 5 (favicon, logótipo transparente) não geram requisitos novos — são tarefas técnicas de ligação de assets já resolvidos, registadas apenas como nota para o developer (ver FR-7 abaixo, sem critérios de aceitação extensos).

BLOCKERS: as 3 ambiguidades acima (slider vazio, vídeo local vs. YouTube, secção desativada = ausente vs. placeholder) têm impacto direto no desenho do `ux-ui-designer` (ponto 3 impacto direto) e na CSP/arquitetura já fechada (ponto 2, se YouTube). Não posso resolvê-las sozinho sem inventar requisito não solicitado (regra 1 do meu mandato). Preciso de decisão explícita do utilizador antes de o `ux-ui-designer` avançar.

REQUIRED_NEXT_ACTION: Orchestrator apresenta as 3 ambiguidades ao utilizador e obtém resposta explícita a cada uma. Só depois disso o `ux-ui-designer` avança para desenhar: (a) o slider da homepage (nº de slots, controlos, comportamento autoplay/manual — decisão de UX, não de requisitos), (b) o padrão visual único de banner de imagem a aplicar às páginas campanha/contactos/servicos-lista/quem-somos, (c) o cartão de serviço da homepage com imagem (reutilizando o componente `ServiceCard` já existente, ver CONTEXT abaixo), (d) o padrão visual de "secção desativada" depois de resolvida a ambiguidade 3. Em paralelo, o `software-architect` deve fechar o desenho exato do campo `enabled`/`visible` (nome, posição no schema, default) para ser aplicado de forma consistente em todas as secções opcionais (FR-6), e desenhar o Decap CMS da Fase 5 já com esse padrão. As tarefas técnicas de favicon e logótipo (FR-7) não dependem de nenhuma decisão pendente e podem seguir diretamente para o `developer`.

CONTEXT_FOR_NEXT_AGENT (requisitos funcionais e critérios de aceitação completos):

## FR-1 — Banner da homepage: slider de imagens e vídeo
- FR-1.1: O banner de topo da homepage (`hero`, hoje sem imagem — `content/schemas/index.ts` `heroSchema` não tem campo de mídia) passa a suportar múltiplos "slides", cada um sendo uma imagem OU um vídeo.
- FR-1.2: O número de slots/slides não é fixado por este requisito — depende da resposta às ambiguidades 1 e 2 (ver BLOCKERS); é decisão de UX/Architect, não de negócio, desde que o schema aceite pelo menos 1 e o utilizador consiga acrescentar/remover slides no Decap CMS sem alteração de código (mesmo princípio de "array editável" já usado em `services`/`team`/`gallery`).
- FR-1.3: Cada slide de imagem tem `alt` obrigatório e traduzível `{pt,en}`, seguindo o padrão `contentImageSchema` já existente (`content/schemas/index.ts`).
- FR-1.4: Cada slide de vídeo tem uma legenda/alt textual traduzível `{pt,en}` equivalente, para acessibilidade e para SEO (ainda que a fonte final — ficheiro local ou YouTube — dependa da ambiguidade 2).
- FR-1.5: O texto/CTA atual do hero (`tag`, `titleLine1/2`, `motto`, `text`, `buttons`) não é substituído pelo slider — o slider é o fundo/background visual, o conteúdo textual mantém-se sobreposto, tal como hoje.

AC-1.1: A homepage mostra pelo menos um slide (imagem ou vídeo) no lugar do fundo estático atual do hero.
AC-1.2: Acrescentar ou remover um slide via edição do ficheiro de conteúdo correspondente (futuramente via Decap) altera o número de slides mostrados na homepage, sem alteração de código.
AC-1.3: Nenhum slide de imagem sem `alt` não vazio em `pt` e `en` passa a validação de build (mesmo padrão de falha de build já usado no resto do schema).
AC-1.4: O texto/CTA do hero continua a ser mostrado sobre o slider, sem regressão face ao estado atual.
AC-1.5: Nenhuma imagem de slide referenciada por URL externa nem caminho fora de `/images/` passa a validação (`localImagePath`) — a decisão sobre vídeo fica em aberto (ambiguidade 2) e não é coberta por este critério.

## FR-2 — Banners de imagem em todas as páginas
- FR-2.1: As páginas que hoje não têm campo de imagem de banner no schema — campanha (`campanhaSchema.hero`), contactos (`contactsSchema`), listagem de serviços (`servicesPageSchema`) e Quem Somos (`aboutPageSchema`) — passam a ter um campo de imagem de banner opcional-ou-obrigatório (decisão a confirmar pelo `software-architect`, seguindo o precedente já fechado no `handoff-19` para `bannerImage` do serviço: obrigatório, com placeholder no mesmo commit, para não haver estado "banner sem imagem" não especificado).
- FR-2.2: Cada campo de imagem de banner segue o padrão já fechado `localImagePath` + `alt` traduzível `{pt,en}` (mesmo helper `contentImageSchema`/`bannerImage`+`bannerImageAlt` já usado em `serviceSchema`) — não é inventado um padrão novo.
- FR-2.3: O hero do detalhe de serviço (já implementado) não é alterado por este requisito — fica como está, é a referência a replicar nas outras páginas.
- FR-2.4: Este requisito é independente do FR-1 (slider da homepage): a homepage já está coberta pelo FR-1, não precisa de um campo de banner "simples" adicional.

AC-2.1: Cada uma das 4 páginas listadas (campanha, contactos, `/servicos` listagem, quem-somos) mostra uma imagem de banner de topo, lida de um campo próprio em `content/`, com `alt` traduzível.
AC-2.2: Falta do campo de banner nessas páginas faz o build falhar de forma legível (mesma política já usada para `bannerImage` de serviço no `handoff-19`), a menos que o `software-architect` decida deliberadamente por opcional com fallback — nesse caso o fallback tem de estar explicitamente definido, nunca implícito.
AC-2.3: Nenhuma imagem de banner referenciada por caminho fora de `/images/` ou por URL externa passa a validação.

## FR-3 — Cartões de serviço da homepage com imagem
- FR-3.1: Os 4 cartões de serviço mostrados na homepage (`HomeContent.tsx`, `PREVIEW_SERVICE_IDS`) passam a mostrar a imagem de capa do serviço (`service.bannerImage`), tal como já acontece nos cartões de `/servicos` (componente `ServiceCard.tsx`, já existente e reutilizável — não é preciso campo de conteúdo novo, o campo `bannerImage` já existe em todos os 8 serviços desde o redesign anterior).
- FR-3.2: Não há alteração ao conteúdo dos cartões (título/texto continuam a poder usar o override `homeTitle`/`homeBlurb`, quando existente) — só é acrescentada a imagem, seguindo o padrão visual já validado em `/servicos`.
- FR-3.3: Recomenda-se ao `ux-ui-designer` reutilizar o componente `ServiceCard.tsx` já existente em vez de duplicar markup — nota de eficiência, não é uma restrição de negócio vinculativa deste agente.

AC-3.1: Cada um dos 4 cartões de serviço na homepage mostra a imagem de `bannerImage` do respetivo serviço.
AC-3.2: Alterar `bannerImage` de um dos 4 serviços (arroz, cereais, mecanização, moageira) num `content/services/*.json` reflete-se no cartão da homepage, sem exigir alteração de código — confirma que é a mesma fonte de verdade já usada em `/servicos`.
AC-3.3: `homeTitle`/`homeBlurb` continuam a ser respeitados quando presentes, sem regressão.

## FR-4 (interno, referência) — ver FR-6 abaixo para o toggle "secção visível/desativada" transversal.

## FR-5 — Sem alteração aos Destaques, sem alteração de arquitetura de sistema
- FR-5.1: Nenhum destes pedidos altera a secção "Destaques" (`highlights`) de serviço, o modelo de hosting/CMS, a CSP definida na Fase 4 (exceto se a resposta à ambiguidade 2 for "YouTube", nesse caso fica sinalizado ao `software-architect` para avaliar essa alteração pontual e específica) ou o routing por locale.

AC-5.1: Comparação antes/depois confirma `highlights` inalterado.

## FR-6 — Todo o conteúdo gerível no admin, incluindo desativar secções/blocos (pedido transversal)
- FR-6.1: Todo o texto e imagem já coberto pelo modelo de conteúdo `content/` continua a ser editável via Decap CMS na Fase 5 (isto já era verdade antes deste pedido — não é requisito novo, é confirmação de que nenhuma alteração dos pontos 1-3 introduz texto/imagem hardcoded fora de `content/`).
- FR-6.2: É introduzido um campo booleano de visibilidade (nome exato — ex. `enabled` ou `visible` — é decisão do `software-architect`, não de negócio) em **todas as secções/blocos hoje opcionais no schema**, que permite ao editor no Decap CMS desativar o bloco inteiro sem apagar o conteúdo (o texto fica gravado, só deixa de ser mostrado). Lista de blocos alvo nesta ronda (proposta, a confirmar/ajustar pelo Orchestrator/utilizador):
  - `service.sections` (secções temáticas do detalhe de serviço) — toggle por secção individual dentro do array.
  - `service.gallery` (galeria de imagens do serviço) — toggle do bloco galeria inteiro.
  - Secção "Serviços relacionados" no detalhe (`servicePage.relatedHeading` / lógica de relacionados) — toggle do bloco inteiro.
  - Secção "Valores institucionais" da página Quem Somos (`aboutPage.values`) — toggle do bloco inteiro (nota: os 6 valores individuais mantêm `.length(6)` — o toggle é da secção completa, não de cada valor, para não contradizer a restrição estrutural já fechada no `handoff-19`).
  - Os novos slides do slider da homepage (FR-1) — toggle por slide individual, para o editor poder "pausar" um slide sem o remover do CMS.
  - Os novos banners de imagem das páginas campanha/contactos/servicos-lista/quem-somos (FR-2) — toggle do banner (se a página ficar sem banner, usa o layout de topo já existente sem imagem, como está hoje).
- FR-6.3: Não se aplica a blocos estruturalmente obrigatórios do site (hero da homepage em si, a lista de 8 serviços, o footer, a navegação) — desativar estes deixaria a página num estado não especificado pelo design existente; se necessário no futuro, é pedido novo.
- FR-6.4: O comportamento visual de "desativado" (DOM ausente vs. placeholder discreto) depende da ambiguidade 3 em aberto (ver BLOCKERS) — este FR não assume nenhuma das duas opções.
- FR-6.5: Desativar um bloco não pode nunca resultar em erro de build nem em página quebrada — o campo de visibilidade é lido antes da renderização, nunca depois; nenhuma dependência de dados do bloco desativado deve ser avaliada quando `enabled=false` (ex.: se `gallery` estiver desativada, o componente não deve tentar mapear um array vazio/inexistente).

AC-6.1: Cada um dos blocos listados em FR-6.2 tem um campo booleano de visibilidade no schema, com valor default explícito (a confirmar pelo `software-architect` — recomendação: default `true`, para não esconder conteúdo já publicado ao introduzir o campo).
AC-6.2: Marcar um bloco como desativado faz esse bloco não aparecer no conteúdo visível ao público (comportamento exato depende da resolução da ambiguidade 3), sem quebrar o build nem a página.
AC-6.3: Reativar o bloco (voltar `enabled` a `true`) faz o conteúdo reaparecer exatamente como estava, sem perda de dados — confirma que "desativar" nunca apaga conteúdo.
AC-6.4: Os 8 `content/services/*.json`, `aboutPage.json` e os restantes ficheiros de conteúdo já existentes continuam válidos depois da introdução do campo (default aplicado automaticamente, sem exigir edição manual de todos os ficheiros existentes) — mesmo princípio de não-regressão já usado em `sections`/`gallery` opcionais no `handoff-19`.
AC-6.5: O `software-architect` confirma explicitamente, ao desenhar o Decap CMS da Fase 5, que este é o padrão a replicar em qualquer secção opcional futura (convenção documentada, não solução ad-hoc por bloco).

## FR-7 — Tarefas técnicas sem requisitos de negócio novos
- FR-7.1: Favicon — ligar `public/favicon.ico`/PNGs já gerados ao `<head>` via metadata `icons` do Next.js (`app/layout.tsx` ou equivalente por locale). Sem critérios de aceitação de negócio: só verificação técnica de que o favicon aparece no browser.
- FR-7.2: Logótipo transparente — trocar as referências a `images/logo.jpeg`/`public/images/logo.jpeg` no Header/Footer para `public/images/logo.png` (já gerado, com fundo removido). Sem critérios de aceitação de negócio: só verificação visual de que o logótipo aparece sem fundo branco/opaco no header e footer.

## Confirmação de classificação de risco
Nenhum destes 6 pedidos introduz autenticação, dados pessoais de clientes, integração bancária ou alteração a schema de produção fora de `content/`. As imagens/vídeos são conteúdo institucional público (banners de página, capas de serviço), tal como já aprovado em rondas anteriores. Classificação mantém-se **MEDIUM**. Único ponto que tocaria uma restrição de arquitetura já fechada é a resposta "YouTube" na ambiguidade 2 (adicionaria um domínio externo à CSP `img-src`/`frame-src` da Fase 4) — motivo pelo qual está sinalizada como bloqueante e não decidida por este agente, seguindo o mesmo precedente do `handoff-17` para a questão de imagens externas.

HIGH_RISK_AREA: false — não há autenticação, tokens/sessões, integração bancária/pagamentos, schema de produção fora de `content/` nem dados pessoais de clientes. Classificação MEDIUM confirmada.
