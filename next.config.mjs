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
  // Cabeçalhos de segurança (Fase 4) — migra a intenção do netlify.toml
  // antigo (X-Frame-Options/X-Content-Type-Options/Referrer-Policy) para
  // o Next.js/Vercel, e acrescenta CSP + HSTS.
  //
  // RESTRIÇÃO VINCULATIVA DA ARQUITETURA (v5, secção 9.9/12.36): esta CSP
  // é estrita por defeito e serve TODO o site. A entrada própria de
  // `/admin/:path*` do Decap CMS (e o rewrite `/admin`) foi removida com o
  // Decap (task-017-tina-cms-adoption, fase 1, SEC-T-09); `/admin` dá 404
  // até o admin da TinaCMS ter a sua própria entrada (fase 4).
  //
  // Entradas de `headers()` que fazem match no mesmo caminho e definem a
  // MESMA chave de header NÃO se combinam/mesclam por diretiva (verificado
  // contra a documentação do Next.js — "Header Overriding Behavior" em
  // headers.md) — a última entrada do array que fizer match SUBSTITUI
  // inteiramente o valor da anterior para essa chave. Por isso qualquer
  // entrada específica abaixo (ex.: `/images/uploads/:path*`) é uma CSP
  // COMPLETA e autossuficiente, não apenas as diretivas adicionais — e tem
  // de vir DEPOIS da entrada global no array devolvido, para prevalecer.
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
  //
  // EXCEÇÃO APROVADA (task-006-contact-form-security, gates.md, "Confirmação
  // humana do desenho", ponto 2, 2026-09-26): `https://challenges.cloudflare.com`
  // entra em `script-src` e `frame-src` da CSP GLOBAL, para o Cloudflare
  // Turnstile do formulário de contacto. Foi escolhida a CSP global (e não
  // uma CSP só para /contactos e /en/contact) porque a CSP é do documento:
  // numa navegação client-side (`next/link`) para as páginas de contacto o
  // documento mantém a CSP da página de origem e o widget seria bloqueado.
  // A CSP só AUTORIZA o host; o script só é efetivamente carregado em
  // components/ContactForm.tsx (páginas de contacto, com site key). Não
  // acrescentar outros hosts nem carregar este script noutras páginas sem
  // nova revisão de arquitetura/segurança.
  async headers() {
    const turnstileOrigin = "https://challenges.cloudflare.com";
    // Em desenvolvimento (`npm run dev`), o Next.js/Turbopack usa eval()
    // para Fast Refresh e outras funcionalidades de debugging (nunca em
    // produção — ver aviso do próprio React). Sem 'unsafe-eval' em
    // script-src, o browser bloqueia esse eval() e o dev server fica com
    // um erro no console. Esta exceção aplica-se apenas quando
    // NODE_ENV !== 'production'; a CSP de produção mantém-se inalterada.
    const isDev = process.env.NODE_ENV !== "production";
    // Diretivas da CSP GLOBAL. A CSP da pré-visualização da TinaCMS (abaixo)
    // é derivada desta mesma lista, para herdar qualquer correção futura sem
    // cópia manual (task-017, architecture.md 16.5).
    const globalCsp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${turnstileOrigin}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
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
      //   - challenges.cloudflare.com: iframe do Turnstile (task-006,
      //     exceção aprovada, ver comentário antes de `headers()`).
      `frame-src 'self' https://www.youtube-nocookie.com https://www.google.com ${turnstileOrigin}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ];
    const entries = [
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
          { key: "Content-Security-Policy", value: globalCsp.join("; ") },
        ],
      },
      {
        // SEC-P5-03: media carregada pelos editores do CMS
        // (public/images/uploads/) é servida pela mesma origem que o
        // resto do site mas NÃO deve herdar `script-src 'self' 'unsafe-inline'`
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
    ];

    // Pré-visualização editável da TinaCMS (task-017, architecture 5.2/6,
    // SEC-T-08/SEC-T-09): a CSP GLOBAL com uma única diferença,
    // `frame-ancestors 'self'` (o admin mostra estas páginas num iframe da
    // MESMA origem). `X-Frame-Options: SAMEORIGIN` já vem da entrada global
    // (só a mesma chave é substituída, headers.md "Header Overriding
    // Behavior"). `X-Robots-Tag` além do `robots` da página. Sem Draft Mode
    // estas rotas dão 404; nenhuma página pública passa por aqui.
    const previewCsp = globalCsp
      .map((d) => (d === "frame-ancestors 'none'" ? "frame-ancestors 'self'" : d))
      .join("; ");
    for (const source of ["/editor-preview/:path*", "/en/editor-preview/:path*"]) {
      entries.push({
        source,
        headers: [
          { key: "Content-Security-Policy", value: previewCsp },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      });
    }

    // Admin da TinaCMS em MODO LOCAL (fase 3, só `next dev` via
    // `npm run tina:dev`): o index.html gerado em public/admin/ carrega o
    // admin do servidor Vite do `tinacms dev` e fala com a API GraphQL local,
    // ambos em localhost:<TINA_LOCAL_PORT>. Nunca em produção: o build não
    // gera o admin (scripts/tina-build.mjs) e esta entrada não existe.
    //
    // Fase 4: admin da Tina Cloud em produção (gerado só em Production por
    // scripts/tina-build.mjs). CSP própria, com os hosts da Tina Cloud
    // enumerados (API de conteúdo, identidade/login e media) e nada mais. O
    // login abre uma janela em identity.tinajs.io (navegação, fora da CSP).
    // Sem pré-visualização em produção: `frame-src 'self'` basta.
    if (!isDev) {
      const tinaCloud = [
        "https://content.tinajs.io",
        "https://identity.tinajs.io",
        "https://assets.tinajs.io",
      ].join(" ");
      entries.push({
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              `img-src 'self' data: blob: ${tinaCloud}`,
              `connect-src 'self' ${tinaCloud}`,
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      });
    }
    if (isDev) {
      const tinaOrigin = `http://localhost:${tinaLocalPort()}`;
      entries.push({
        source: "/admin/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${tinaOrigin}`,
              `style-src 'self' 'unsafe-inline' ${tinaOrigin} https://fonts.googleapis.com`,
              `font-src 'self' data: ${tinaOrigin} https://fonts.gstatic.com`,
              `img-src 'self' data: blob: ${tinaOrigin}`,
              `connect-src 'self' ${tinaOrigin} ws://localhost:${tinaLocalPort()}`,
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      });
    }
    return entries;
  },
  // Admin da TinaCMS: `/admin` -> `/admin/index.html`. Em modo local vem do
  // `tinacms dev`; em produção só existe no build de Production (fase 4) —
  // nos outros builds public/admin/ não existe e `/admin` dá 404.
  async rewrites() {
    return [{ source: "/admin", destination: "/admin/index.html" }];
  },
};

/** Porta da API local do `tinacms dev` (definida por scripts/tina-dev.mjs). */
function tinaLocalPort() {
  const port = process.env.TINA_LOCAL_PORT ?? "4001";
  if (!/^[0-9]{2,5}$/.test(port)) throw new Error("TINA_LOCAL_PORT inválida");
  return port;
}

export default nextConfig;
