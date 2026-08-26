STATUS: APPROVED
SUMMARY: Revisão de qualidade técnica da Fase 4, por leitura de código (comportamento já validado
pelo Tester, handoff-15, APPROVED). A implementação evita a duplicação que se pediu para verificar:
todas as 16 rotas com metadados (confirmado por grep) chamam exclusivamente `buildPageMetadata`
(content/seo.ts) — nenhuma reimplementa canonical/hreflang/og/twitter à mão. sitemap.ts e robots.ts
derivam de content/routes.ts (PAGE_KEYS/path/serviceDetailPath) e content/index.ts (services), sem
lista de URLs escrita à mão. A CSP em next.config.mjs está isolada como uma única entrada de
headers() com comentário extenso explicando explicitamente como a Fase 5 deve estender (nova entrada
com source "/admin/:path*", sem tocar na global) — não vai exigir refactor. generateMetadata das
rotas dinâmicas trata slug/id inexistente sem excepção (devolve {} antes do notFound() do
componente). Consistente com a boa qualidade já registada nos handoffs 08 e 13; nenhum achado novo
bloqueador.

ARTIFACTS: Nenhum ficheiro alterado — revisão de leitura apenas (o code-reviewer não tem
ferramenta de escrita; este handoff foi gravado pelo Orchestrator a partir do resultado do agente).

VALIDATIONS (leitura de código):
  - content/seo.ts: `buildPageMetadata` é o único produtor de Metadata; grep em app/ confirma 16
    ocorrências de `buildPageMetadata` (12 chamadas diretas via `export const metadata`, 2 dentro de
    `generateMetadata` das rotas dinâmicas [id]/[slug], x2 idiomas cada onde aplicável) — nenhuma
    página constrói `alternates`/`openGraph`/`twitter` manualmente. Assinatura clara (`PageSeoInput`),
    comentário explica o porquê (evitar página esquecer campo). x-default -> PT justificado por
    comentário (coerente com D-4).
  - content/organization.ts: `organizationJsonLd` construído só a partir de `contacts`/`locations`/
    `meta` de content/index.ts, com validação defensiva (throw explícito e legível se a localização
    "escritorio" não existir) — sem duplicação de dados que já existam noutro sítio. `logo` usa
    `meta.siteUrl + meta.ogImage`, coerente com o mesmo `ogImage` usado em buildPageMetadata (fonte
    única).
  - app/sitemap.ts: itera `PAGE_KEYS` (novo export de content/routes.ts, 5 páginas fixas) +
    `services` (8), gerando o par PT/EN com `alternates.languages` cruzados via a mesma função
    `addPair` — nenhuma URL escrita à mão, nenhuma lista paralela à das rotas reais. Se uma página
    fixa for adicionada a `PAGE_KEYS` no futuro, o sitemap acompanha automaticamente; mesmo raciocínio
    para serviços via `services`.
  - app/robots.ts: `Disallow: /admin` e `Sitemap` a partir de `meta.siteUrl`, sem hardcoded fora
    disso. Comentário distingue corretamente "preparação de indexação" de "controlo de acesso"
    (evita dar a entender que isto é segurança).
  - next.config.mjs `headers()`: uma única entrada `source: "/:path*"` hoje, mas o comentário acima
    da CSP é explícito e operacional para a Fase 5 — diz textualmente que o developer da Fase 5 deve
    acrescentar uma nova entrada de `headers()` com `source: "/admin/:path*"` em vez de alterar esta,
    e explica que as entradas do Next.js não se substituem (a mais específica só sobrepõe as
    diretivas que declarar). Isto é suficiente para não exigir refactor na Fase 5 — a estrutura de
    `headers()` como array já suporta múltiplas entradas por desenho do próprio Next.js, o código
    atual não precisa de ser reescrito, só estendido com uma entrada nova. Concordo com a avaliação
    do Tester de que o `unsafe-inline` documentado é um requisito do próprio Next.js App Router (não
    do Decap), e que não viola a restrição 9.9 de não relaxar a CSP global para acomodar a Fase 5.
  - app/(pt)/servicos/[id]/page.tsx e app/en/services/[slug]/page.tsx: `generateMetadata` faz
    `if (!service) return {}` antes de qualquer acesso a campos do serviço — não lança excepção não
    tratada para um id/slug inexistente. O `notFound()` só é chamado no componente de página
    (`export default async function ...`), nunca dentro de `generateMetadata`, o que é a prática
    correta. Com `dynamicParams = false`, um id/slug fora de `generateStaticParams` nem chega a
    invocar esta função em produção (o Next.js devolve 404 antes) — mas a guarda defensiva
    `if (!service) return {}` cobre também qualquer cenário em que isso mude no futuro, pelo que é
    uma prática sólida e não apenas coincidência de o bug nunca se manifestar. Edge case do Tester
    (handoff-15, ISSUES) confirmado como bem tratado.
  - content/routes.ts: `PAGE_KEYS`/`path`/`serviceDetailPath` reutilizados consistentemente por
    sitemap.ts e pelas páginas, mesma fonte usada desde a Fase 3 para navegação — sem risco de
    divergência entre o que a navegação usa e o que o sitemap/robots geram.

ISSUES:
  - [SUGESTÃO, não bloqueante] `content/organization.ts` corre a lógica de `headOffice.find(...)` e
    o `throw` ao nível do módulo (fora de qualquer função), o que significa que um erro de dados
    aqui falha o build inteiro em qualquer página que importe este ficheiro, incluindo indiretamente.
    É a prática já usada noutros loaders de content/ (falhar cedo, mensagem legível) — não é uma
    inconsistência, só registo para confirmar que é intencional (parece ser, dado o padrão do resto
    do content/).
  - [SUGESTÃO, não bloqueante] `buildPageMetadata` aceita `type` como "website" | "article" mas
    nenhuma chamada atual usa "article" — código morto potencial (opção nunca exercida). Baixo custo
    de manter, não vale remover agora se antecipa uma futura página de blog/notícias, mas sinalizo
    para não se assumir testado se algum dia for usado.
  - [SUGESTÃO, não bloqueante] Confirmo, sem objeção, os dois ISSUES "DECISÃO DOCUMENTADA" do
    developer (unsafe-inline; HSTS sem preload) e a avaliação do Tester de que são aceitáveis agora —
    ambos bem comentados no próprio next.config.mjs, não apenas nos handoffs, o que é a prática certa
    para quem herdar o código sem ler o histórico.
  - Nenhum achado novo de duplicação, inconsistência de convenção ou tratamento de erro em falta.

BLOCKERS: Nenhum.

REQUIRED_NEXT_ACTION: Fase 4 aprovada do ponto de vista de qualidade técnica — pronta para
confirmação humana do preview. A decisão pendente de `og:image` sinalizada pelo Tester (handoff-15)
já foi respondida pelo utilizador diretamente ao Orchestrator: manter o logótipo atual
(images/logo.jpeg), sem imagem dedicada por agora — decisão registada em project/context.md. Nada
mais pendente para esta fase.

CONTEXT_FOR_NEXT_AGENT: nada — este é o último passo do fast path desta fase.
