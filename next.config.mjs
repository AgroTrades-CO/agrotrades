import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Avoids Next.js picking up the unrelated package-lock.json in the
    // user's home directory when resolving the workspace root.
    root: path.resolve(import.meta.dirname),
  },
  // Redirects 301 do site estático antigo para as novas rotas (Fase 3,
  // architecture-proposal.md secção D-5). "/home" já existia no
  // netlify.toml e é preservado aqui.
  async redirects() {
    return [
      { source: "/servicos.html", destination: "/servicos", permanent: true },
      { source: "/campanha.html", destination: "/campanha", permanent: true },
      { source: "/contactos.html", destination: "/contactos", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      {
        source: "/servico.html",
        has: [{ type: "query", key: "id", value: "(?<id>.*)" }],
        destination: "/servicos/:id",
        permanent: true,
      },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
  // /admin (sem barra final) e /admin/ não resolvem sozinhos ao ficheiro
  // estático public/admin/index.html — o Next.js só serve ficheiros de
  // public/ por caminho EXATO, sem resolução de "index" de diretório.
  // Reescrita interna (não é redirect visível ao browser, não muda o URL)
  // — Fase 5, Decap CMS.
  async rewrites() {
    return [{ source: "/admin", destination: "/admin/index.html" }];
  },
  // Cabeçalhos de segurança (Fase 4) — migra a intenção do netlify.toml
  // antigo (X-Frame-Options/X-Content-Type-Options/Referrer-Policy) para
  // o Next.js/Vercel, e acrescenta CSP + HSTS.
  //
  // RESTRIÇÃO VINCULATIVA DA ARQUITETURA (v5, secção 9.9/12.36): esta CSP
  // é estrita por defeito e serve TODO o site, incluindo `/admin` (Decap
  // CMS, Fase 5). A Fase 5 acrescenta uma entrada de `headers()` própria
  // com `source: "/admin/:path*"`, com a sua própria CSP mais permissiva
  // (o Decap auto-hospedado exige `unsafe-eval`, e o backend `github`
  // precisa de falar com api.github.com).
  //
  // CORREÇÃO a este comentário (verificado contra a documentação do
  // Next.js — "Header Overriding Behavior" em headers.md): entradas de
  // `headers()` que fazem match no mesmo caminho e definem a MESMA chave
  // de header NÃO se combinam/mesclam por diretiva — a última entrada do
  // array que fizer match SUBSTITUI inteiramente o valor da anterior para
  // essa chave. Por isso a entrada `/admin/:path*` abaixo é uma CSP
  // COMPLETA e autossuficiente (repete `default-src`, `object-src`, etc.),
  // não apenas as diretivas adicionais — e tem de vir DEPOIS da entrada
  // global no array devolvido, para ser a que prevalece em `/admin`.
  //
  // Nota sobre `script-src 'self' 'unsafe-inline'`: o Next.js App Router
  // injeta, no próprio HTML, um `<script>` inline sem `src` com o payload
  // de hidratação RSC (`self.__next_f.push(...)`) — confirmado por
  // inspeção do HTML gerado nesta fase. Não há nonce por pedido possível
  // sem middleware, que está fora do âmbito desta fase (ver
  // architecture-proposal.md D-1). `'unsafe-inline'` aqui é esse mínimo
  // necessário do próprio framework, não um script de terceiros nem algo
  // introduzido por nós — não regride a exigência "sem scripts de
  // terceiros" do pedido. O mesmo raciocínio aplica-se a
  // `style-src 'unsafe-inline'`, necessário para os atributos `style`
  // inline usados pelos componentes de página (ex.: NotFoundContent).
  async headers() {
    // Em desenvolvimento (`npm run dev`), o Next.js/Turbopack usa eval()
    // para Fast Refresh e outras funcionalidades de debugging (nunca em
    // produção — ver aviso do próprio React). Sem 'unsafe-eval' em
    // script-src, o browser bloqueia esse eval() e o dev server fica com
    // um erro no console. Esta exceção aplica-se apenas quando
    // NODE_ENV !== 'production'; a CSP de produção mantém-se inalterada.
    const isDev = process.env.NODE_ENV !== "production";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // `preload` fica fora de propósito: é um compromisso
          // praticamente irreversível (submissão à lista de preload dos
          // browsers) que deve ser uma decisão explícita do
          // devops-engineer antes do cutover de produção (Fase 7), não
          // uma consequência silenciosa deste ficheiro.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data:",
              "connect-src 'self'",
              // Fase 3 (handoff-34, secção F): abre `frame-src`, ausente até
              // aqui (herdava `default-src 'self'`, bloqueando qualquer
              // iframe de terceiros). Dois hosts nomeados, nada mais:
              //   - youtube-nocookie.com: embed do slider do hero (FR-1),
              //     domínio sem cookies de tracking; nunca youtube.com.
              //   - www.google.com: corrige um bug pré-existente (RISCO-3 do
              //     handoff-34) — o iframe do Google Maps em
              //     ContactContent.tsx já existia e já estava bloqueado por
              //     esta CSP não declarar `frame-src`.
              // Qualquer alargamento a outros hosts exige nova revisão de
              // arquitetura/segurança — não acrescentar hosts aqui de ânimo leve.
              "frame-src 'self' https://www.youtube-nocookie.com https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
      {
        // SEC-P5-03: media da media library do Decap (public/images/uploads/,
        // ver public/admin/config.yml) é servida pela mesma origem que
        // `/admin` mas NÃO deve herdar `script-src 'self' 'unsafe-inline'`
        // da CSP global — um ficheiro carregado por um editor não é
        // confiável como o resto do site. Entrada própria, autossuficiente
        // (mesma regra de "a última entrada vence" do comentário acima):
        // `sandbox` sem `allow-scripts` neutraliza execução de script mesmo
        // que um SVG malicioso seja aberto como documento de topo, mantendo
        // a imagem utilizável dentro de um `<img>`. `X-Content-Type-Options:
        // nosniff` complementa isto — não vem de graça de `/:path*` porque
        // esta entrada substitui integralmente os headers dessa rota.
        // Defesa em profundidade, não a única nem a completa camada: esta
        // CSP cobre o caminho canónico mas é contornável via %2F codificado
        // no URL (ex. /images/uploads%2Fficheiro.svg), que escapa a esta
        // entrada e cai na CSP global — a qual permite scripts (achado
        // SEC-P5-09, handoff-41-security-engineer-fase5-revalidacao.md). A
        // mitigação real é um GitHub Action (required check) que recusa
        // ficheiros não-raster nesta pasta, ainda por desenhar/adicionar —
        // ver esse workflow quando existir (achado SEC-P5-10).
        source: "/images/uploads/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "sandbox; default-src 'none'" },
        ],
      },
      {
        // CSP PRÓPRIA de /admin (Fase 5, restrição vinculativa 36 / SEC-05
        // do security-engineer). Autossuficiente — ver comentário acima
        // sobre "Header Overriding Behavior": esta entrada SUBSTITUI a CSP
        // global inteira para `/admin/:path*`, não a combina com ela.
        //
        // Diferenças face à CSP global, e a razão de cada uma:
        //   - script-src 'unsafe-eval': o bundle auto-hospedado do Decap
        //     CMS (webpack, restrição 36) usa-o internamente. Nunca
        //     acrescentado à CSP global do resto do site.
        //   - connect-src api.github.com / github.com / objects.githubusercontent.com:
        //     o backend `github` do Decap fala DIRETAMENTE com a API do
        //     GitHub a partir do browser (listar/gravar ficheiros, media);
        //     `github.com` cobre a troca de código do próprio popup OAuth;
        //     `objects.githubusercontent.com` é onde o GitHub redireciona
        //     downloads de ficheiros grandes do repositório.
        //   - connect-src blob:: o Decap faz `fetch()` de URLs blob: para
        //     o backup local de rascunhos (`persistLocalDraftBackup`,
        //     IndexedDB) — sem isto, guardar uma entrada com ficheiro
        //     anexado falha em silêncio com "TypeError: Failed to fetch"
        //     (só visível na consola, não no separador Network, porque a
        //     CSP bloqueia antes do pedido sair). img-src já tinha blob:
        //     para pré-visualização; connect-src faltava.
        //   - img-src avatars.githubusercontent.com: avatar do utilizador
        //     autenticado, mostrado pela UI do Decap.
        //   - Continua SEM nenhum CDN de terceiros em script-src (nunca
        //     unpkg/jsdelivr) — o bundle é servido de 'self'
        //     (public/admin/vendor/, ver scripts/copy-decap-cms.mjs).
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://avatars.githubusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' blob: https://api.github.com https://github.com https://objects.githubusercontent.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
