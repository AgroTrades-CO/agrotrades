/**
 * Coleções TinaCMS sobre o conteúdo ATUAL (content/services/*.json e
 * content/site/*.json, formato {pt, en} inalterado).
 *
 * Regras:
 *   - Regra de ouro: TODAS as chaves existentes nos ficheiros estão aqui — a
 *     Tina só grava os campos declarados; um campo em falta seria apagado do
 *     ficheiro ao gravar.
 *   - ORDEM DOS CAMPOS = ORDEM DAS CHAVES NOS FICHEIROS. A Tina grava as chaves
 *     pela ordem dos campos do schema; declarar pela ordem atual evita que o
 *     primeiro commit da Tina reordene o ficheiro.
 *     Onde os ficheiros não têm uma ordem única (serviços: arroz.json difere
 *     dos outros 7) ou a Tina impõe a sua (a chave `type` dos slides vai
 *     sempre para o fim), vale a ordem da maioria e os ficheiros foram
 *     normalizados uma vez.
 *   - Sem criar nem apagar documentos: o site exige exatamente 8
 *     serviços importados à mão em content/index.ts.
 *   - Imagens (`image`) só da pasta protegida images/uploads/ (config.tsx);
 *     os SVG provisórios fora dela mantêm o caminho.
 *     `meta.ogImage` é `string` oculto, nunca `image`.
 *
 * O Zod em content/schemas/index.ts continua a ser a fonte de validação; este
 * schema espelha-o.
 */
import type { Collection, TinaField } from "tinacms";
import {
  bil,
  bilList,
  bilText,
  icone,
  imagem,
  imagemComDescricao,
  oculto,
  rotulo,
  texto,
  visivel,
} from "./fields";

/**
 * Pré-visualização editável. Em modo local o admin
 * abre as páginas através de /api/editor-preview/<caminho>, que só responde em
 * `next dev`: liga o Draft Mode e redireciona para a rota de pré-visualização
 * (sem Draft Mode as rotas /editor-preview dão 404). O caminho vai no URL e
 * não em query string porque o admin descarta a query string do `router`.
 *
 * No admin de produção não há pré-visualização — a rota de entrada só
 * existe em `next dev` e a entrada autenticada pela Tina Cloud precisa de
 * revisão de segurança própria. scripts/tina-build.mjs define
 * TINA_PUBLIC_NO_PREVIEW=1 (a CLI da Tina só passa ao admin variáveis
 * TINA_PUBLIC_*); sem `router` a Tina mostra só o formulário de edição.
 */
const previewEnabled = process.env.TINA_PUBLIC_NO_PREVIEW !== "1";
const previewUrl = (path: string) => (previewEnabled ? `/api/editor-preview${path}` : undefined);

const semCriarNemApagar = { create: false, delete: false } as const;

/** Entrada única (um ficheiro de content/site). */
function paginaUnica(
  name: string,
  label: string,
  ficheiro: string,
  fields: Collection["fields"],
  router?: string | undefined
): Collection {
  return {
    name,
    label,
    path: "content/site",
    format: "json",
    match: { include: ficheiro },
    ui: {
      allowedActions: semCriarNemApagar,
      ...(router ? { router: () => router } : {}),
    },
    fields,
  } as Collection;
}

const itemOculto = (item: Record<string, unknown>) => (item?.visible === false ? "[Oculto] " : "");

// ── 1. Serviços ─────────────────────────────────────────────────────────────

const servicos: Collection = {
  name: "servico",
  label: "Serviços",
  path: "content/services",
  format: "json",
  ui: {
    allowedActions: semCriarNemApagar,
    router: ({ document }) => previewUrl(`/editor-preview/servicos/${document._sys.filename}`),
  },
  fields: [
    {
      type: "string",
      // "id" colide com o campo `id` que a Tina dá a cada documento no
      // GraphQL; `nameOverride` mantém a chave "id" no ficheiro.
      name: "serviceId",
      nameOverride: "id",
      label: "Identificador interno",
      description: "Não alterar: liga o serviço ao endereço /servicos/<identificador>.",
      required: true,
      ui: { component: "hidden" },
    },
    icone("icon", "Ícone", { description: "Aparece no topo da página e nos cartões." }),
    bil("title", "Nome do serviço", {
      description: "Aparece no topo da página do serviço, no menu e nos cartões.",
    }),
    bilText("summary", "Resumo", {
      description: "Aparece por baixo do nome, no topo da página, e nos cartões.",
    }),
    bilText("description", "Texto de apresentação", {
      description: "Primeiro parágrafo do corpo da página.",
    }),
    bilList("highlights", "Pontos-chave", {
      description:
        "Caixa 'Pontos-chave' ao lado do texto. Mesma ordem e número em Português e Inglês.",
    }),
    bil("homeTitle", "Nome no cartão da página inicial", {
      required: false,
      description: "Vazio = usa o nome do serviço.",
    }),
    bilText("homeBlurb", "Resumo no cartão da página inicial", {
      required: false,
      description: "Vazio = usa o resumo.",
    }),
    imagem("bannerImage", "Imagem de topo", "Fundo do topo da página e capa do cartão."),
    bil("bannerImageAlt", "Descrição da imagem de topo", {
      description: "Para quem não vê a imagem (leitores de ecrã e Google).",
    }),
    {
      type: "object",
      name: "sections",
      label: "Secções",
      description: "Blocos por baixo do texto de apresentação (1 a 6).",
      list: true,
      ui: {
        itemProps: (item: Record<string, unknown>) => ({
          label: itemOculto(item) + rotulo(item?.title, "Secção"),
        }),
        max: 6,
      },
      fields: [
        icone("icon", "Ícone", {
          required: false,
          description: "Vazio = usa o ícone do serviço. Ignorado no aspeto 'Destaque'.",
        }),
        bil("title", "Título"),
        bilText("text", "Texto"),
        imagemComDescricao(
          "image",
          "Imagem da secção",
          "Opcional. Com imagem, a secção passa de cartão de texto a imagem + texto."
        ),
        {
          type: "string",
          name: "layout",
          label: "Aspeto (só com imagem)",
          description: "Vazio = imagem ao lado do texto, alternando o lado.",
          options: [
            { value: "split", label: "Imagem ao lado do texto" },
            { value: "feature", label: "Destaque (imagem grande)" },
          ],
        },
        bilList("bullets", "Pontos da secção (só com imagem)"),
        visivel(),
      ],
    },
    visivel("galleryVisible", "Mostrar galeria no site"),
    {
      type: "object",
      name: "gallery",
      label: "Galeria",
      description: "Imagens no fim da página (1 a 6).",
      list: true,
      ui: {
        itemProps: (item: Record<string, unknown>) => ({
          label: itemOculto(item) + rotulo(item?.alt, "Imagem"),
        }),
        max: 6,
      },
      fields: [imagem("image", "Imagem"), bil("alt", "Descrição da imagem"), visivel()],
    },
  ],
} as Collection;

// ── 1b. Produtos ────────────────────────────────────────────────────────────

// Mesma estrutura dos serviços (content/schemas: productsSchema = serviços).
// Sem pré-visualização: ainda não há rota /editor-preview para produtos.
const produtos: Collection = {
  ...servicos,
  name: "produto",
  label: "Produtos",
  path: "content/products",
  ui: { allowedActions: semCriarNemApagar },
  fields: (servicos.fields ?? []).map((field) =>
    field.name === "serviceId"
      ? {
          ...field,
          name: "productId",
          description: "Não alterar: liga o produto ao endereço /produtos/<identificador>.",
        }
      : field
  ),
} as Collection;

// ── 2. Serviços: lista e textos comuns ──────────────────────────────────────

const servicosLista = paginaUnica("servicosLista", "Serviços: página da lista", "servicesPage", [
  imagem("bannerImage", "Imagem de topo", "Topo da página /servicos."),
  bil("bannerImageAlt", "Descrição da imagem de topo"),
  {
    type: "object",
    name: "sectionHeading",
    label: "Cabeçalho da grelha de serviços",
    description: "Também aparece na página inicial.",
    fields: [
      bil("tag", "Etiqueta"),
      bil("title", "Título"),
      bil("learnMore", "Texto do link 'Saiba mais'", { description: "Em cada cartão de serviço." }),
    ],
  },
  bilText("intro", "Introdução", { description: "Texto no topo da página /servicos." }),
  bil("ctaTitle", "Chamada final: título"),
  bilText("ctaText", "Chamada final: texto"),
]);

const servicosTextos = paginaUnica("servicosTextos", "Serviços: textos comuns", "servicePage", [
  bil("highlightsHeading", "Título 'Pontos-chave'"),
  bil("backToServices", "Texto 'Voltar a Serviços'"),
  bil("galleryHeading", "Título 'Galeria'"),
  bil("relatedHeading", "Título 'Outros serviços'"),
  visivel("relatedVisible", "Mostrar 'Outros serviços' nas páginas de serviço"),
]);

const produtosLista = paginaUnica("produtosLista", "Produtos: página da lista", "productsPage", [
  imagem("bannerImage", "Imagem de topo", "Topo da página /produtos."),
  bil("bannerImageAlt", "Descrição da imagem de topo"),
  {
    type: "object",
    name: "sectionHeading",
    label: "Cabeçalho da grelha de produtos",
    fields: [
      bil("tag", "Etiqueta"),
      bil("title", "Título"),
      bil("learnMore", "Texto do link 'Saiba mais'", { description: "Em cada cartão de produto." }),
    ],
  },
  bilText("intro", "Introdução", { description: "Texto no topo da página /produtos." }),
  bil("ctaTitle", "Chamada final: título"),
  bilText("ctaText", "Chamada final: texto"),
  bil("backToProducts", "Texto 'Voltar a Produtos'"),
]);

// ── 3. Página inicial ───────────────────────────────────────────────────────

const paginaInicial = paginaUnica(
  "paginaInicial",
  "Página inicial",
  "home",
  [
    {
      type: "object",
      name: "hero",
      label: "Topo",
      fields: [
        bil("tag", "Etiqueta", { description: "Texto pequeno por cima do título." }),
        bil("titleLine1", "Título — 1.ª linha"),
        bil("titleLine2", "Título — 2.ª linha (a laranja)"),
        bilText("motto", "Lema", { description: "Também aparece no cartão 'Sobre a empresa'." }),
        bilText("text", "Texto"),
        {
          type: "object",
          name: "buttons",
          label: "Botões",
          fields: [
            bil("whatsapp", "Texto do botão WhatsApp"),
            bil("services", "Texto do botão Serviços"),
          ],
        },
        {
          type: "object",
          name: "slider",
          label: "Imagens e vídeos de fundo",
          fields: [
            bil("label", "Nome do carrossel (leitores de ecrã)"),
            bil("previousLabel", "Texto 'Slide anterior' (leitores de ecrã)"),
            bil("nextLabel", "Texto 'Próximo slide' (leitores de ecrã)"),
            bil("goToSlideLabel", "Texto 'Ir para o slide {n}' (leitores de ecrã)", {
              description: "Tem de conter {n}, que é trocado pelo número.",
            }),
            {
              type: "object",
              name: "slides",
              label: "Imagens e vídeos",
              description: "Pelo menos um visível. Máximo 6.",
              list: true,
              // O ficheiro distingue imagem/vídeo pela chave "type";
              // `templateKey` evita a chave "_template" da Tina. A Tina escreve
              // sempre esta chave no fim de cada slide.
              templateKey: "type",
              ui: { max: 6 },
              templates: [
                {
                  name: "image",
                  label: "Imagem",
                  ui: {
                    itemProps: (item: Record<string, unknown>) => ({
                      label: itemOculto(item) + "Imagem: " + rotulo(item?.alt, ""),
                    }),
                  },
                  fields: [visivel(), imagem("image", "Imagem"), bil("alt", "Descrição da imagem")],
                },
                {
                  name: "video",
                  label: "Vídeo do YouTube",
                  ui: {
                    itemProps: (item: Record<string, unknown>) => ({
                      label: itemOculto(item) + "Vídeo: " + rotulo(item?.caption, ""),
                    }),
                  },
                  fields: [
                    visivel(),
                    texto("youtubeId", "Código do vídeo", {
                      description: "Os 11 caracteres depois de 'v=' no endereço do YouTube.",
                    }),
                    bilText("caption", "Legenda", {
                      description: "Descreve o vídeo para quem não o vê.",
                    }),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "object",
      name: "stats",
      label: "Números em destaque",
      fields: [
        {
          type: "object",
          name: "items",
          label: "Números",
          description: "Exatamente 4.",
          list: true,
          ui: {
            itemProps: (item: Record<string, unknown>) => ({
              label: itemOculto(item) + `${(item?.value as string) ?? ""} ${rotulo(item?.label, "")}`.trim(),
            }),
          },
          fields: [visivel(), texto("value", "Valor", { description: "Ex.: 2+, 100, MZ." }), bil("label", "Legenda")],
        },
      ],
    },
    {
      type: "object",
      name: "locationsHeading",
      label: "Localizações",
      description: "As moradas editam-se em Contactos.",
      fields: [bil("tag", "Etiqueta"), bil("title", "Título")],
    },
    {
      type: "object",
      name: "about",
      label: "Sobre a empresa",
      description: "O título, o 1.º parágrafo e as etiquetas editam-se em Quem Somos.",
      fields: [
        {
          type: "object",
          name: "extended",
          label: "2.º parágrafo",
          fields: [
            visivel(),
            { type: "string", name: "pt", label: "Português", required: true, ui: { component: "textarea" } },
            { type: "string", name: "en", label: "Inglês", required: true, ui: { component: "textarea" } },
          ],
        },
        {
          type: "object",
          name: "ceo",
          label: "Cartão do responsável",
          fields: [visivel(), texto("name", "Nome"), texto("initials", "Iniciais"), bil("role", "Cargo")],
        },
        bil("learnMoreLabel", "Texto do link 'Saber mais'"),
      ],
    },
  ],
  previewUrl("/editor-preview")
);

// ── 4. Quem Somos ───────────────────────────────────────────────────────────

const quemSomos = paginaUnica("quemSomos", "Quem Somos", "quemSomos", [
  bil("tag", "Etiqueta", { description: "Também aparece na página inicial (Sobre a empresa)." }),
  bil("title", "Título", { description: "Também aparece na página inicial (Sobre a empresa)." }),
  bilText("summary", "Resumo — 1.º parágrafo", {
    description: "Também aparece na página inicial (Sobre a empresa).",
  }),
  {
    type: "object",
    name: "fullText",
    label: "Parágrafos",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + rotulo(item?.pt, "Parágrafo").slice(0, 60),
      }),
    },
    fields: [
      visivel(),
      { type: "string", name: "pt", label: "Português", required: true, ui: { component: "textarea" } },
      { type: "string", name: "en", label: "Inglês", required: true, ui: { component: "textarea" } },
    ],
  },
  {
    type: "object",
    name: "tags",
    label: "Etiquetas",
    description: "Também aparecem na página inicial.",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + rotulo(item?.label, "Etiqueta"),
      }),
    },
    fields: [visivel(), icone(), bil("label", "Texto")],
  },
  imagem("bannerImage", "Imagem de topo"),
  bil("bannerImageAlt", "Descrição da imagem de topo"),
  bil("teamTag", "Equipa: etiqueta"),
  bil("teamHeading", "Equipa: título"),
  bil("valuesTag", "Valores: etiqueta"),
  bil("valuesHeading", "Valores: título"),
  visivel("valuesVisible", "Mostrar valores no site"),
  {
    type: "object",
    // "values" colide com o objeto de valores do formulário no admin da Tina
    // ("Expected Iterable ... QuemSomos.values" e a pré-visualização deixa
    // de atualizar); `nameOverride` mantém a chave "values" no ficheiro.
    name: "valores",
    nameOverride: "values",
    label: "Valores",
    description: "Exatamente 6.",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + rotulo(item?.title, "Valor"),
      }),
    },
    fields: [icone(), bil("title", "Título"), bilText("text", "Texto"), visivel()],
  },
  {
    type: "object",
    name: "team",
    label: "Equipa",
    fields: [
      {
        type: "object",
        name: "items",
        label: "Membros",
        description: "O primeiro é o cartão grande.",
        list: true,
        ui: {
          itemProps: (item: Record<string, unknown>) => ({
            label: itemOculto(item) + rotulo(item?.nome, "Membro"),
          }),
        },
        fields: [
          visivel(),
          texto("nome", "Nome"),
          bil("cargo", "Cargo"),
          imagem("foto", "Foto"),
          bilText("frase", "Frase curta", { required: false }),
          bilText("bio", "Biografia (cartão grande)", { required: false }),
          {
            type: "object",
            name: "badges",
            label: "Especialidades",
            list: true,
            ui: {
              itemProps: (item: Record<string, unknown>) => ({ label: rotulo(item, "Especialidade") }),
            },
            fields: [
              { type: "string", name: "pt", label: "Português", required: true },
              { type: "string", name: "en", label: "Inglês", required: true },
            ],
          },
          texto("phone", "Telefone", { required: false }),
          texto("whatsapp", "WhatsApp", { required: false }),
          texto("email", "Email", { required: false }),
        ],
      },
    ],
  },
]);

// ── 5. Campanha ─────────────────────────────────────────────────────────────

const campanha = paginaUnica("campanha", "Campanha", "campanha", [
  {
    type: "object",
    name: "banner",
    label: "Faixa na página inicial",
    description: "O título também é o título da página Campanha.",
    fields: [bil("tag", "Etiqueta"), bil("title", "Título"), bilText("text", "Texto"), bil("button", "Texto do botão")],
  },
  {
    type: "object",
    name: "hero",
    label: "Topo da página",
    fields: [
      texto("tag", "Período", { description: "Ex.: 2025 / 2026." }),
      bilText("intro", "Introdução"),
      imagem("bannerImage", "Imagem de topo"),
      bil("bannerImageAlt", "Descrição da imagem de topo"),
    ],
  },
  {
    type: "object",
    name: "quote",
    label: "Citação",
    fields: [texto("author", "Autor"), bil("citeSuffix", "Texto a seguir ao autor")],
  },
  {
    type: "object",
    name: "vision",
    label: "A nossa visão",
    fields: [visivel(), bil("tag", "Etiqueta"), bil("title", "Título"), bilText("text", "Texto")],
  },
  {
    type: "object",
    name: "timelineHeading",
    label: "Fases: cabeçalho",
    fields: [bil("tag", "Etiqueta"), bil("title", "Título")],
  },
  {
    type: "object",
    name: "pillars",
    label: "Pilares",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + rotulo(item?.title, "Pilar"),
      }),
    },
    fields: [visivel(), icone(), bil("title", "Título"), bilText("text", "Texto")],
  },
  visivel("timelineVisible", "Mostrar fases no site"),
  {
    type: "object",
    name: "timeline",
    label: "Fases",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + rotulo(item?.title, "Fase"),
      }),
    },
    fields: [visivel(), bil("title", "Título"), bilText("text", "Texto")],
  },
  {
    type: "object",
    name: "cta",
    label: "Chamada final",
    fields: [visivel(), bil("title", "Título"), bilText("text", "Texto"), bil("button", "Texto do botão")],
  },
]);

// ── 6. Contactos ────────────────────────────────────────────────────────────

const contactos = paginaUnica("contactos", "Contactos", "contacts", [
  {
    type: "object",
    name: "phones",
    label: "Telefones",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + ((item?.number as string) || "Telefone"),
      }),
    },
    fields: [visivel(), texto("number", "Número")],
  },
  bil("phoneLabel", "Título do bloco de telefones"),
  bilText("intro", "Introdução"),
  {
    type: "object",
    name: "ceo",
    label: "Cartão do responsável",
    fields: [
      visivel(),
      texto("name", "Nome"),
      texto("initials", "Iniciais"),
      bil("role", "Cargo"),
      texto("company", "Empresa"),
    ],
  },
  texto("nuit", "NUIT", {
    description: "Aparece no rodapé e é enviado aos motores de busca nos dados da empresa.",
  }),
  imagem("bannerImage", "Imagem de topo"),
  texto("mapsLink", "Mapa: link 'Abrir no Google Maps'"),
  texto("mapEmbedUrl", "Mapa: endereço do mapa embutido"),
  {
    type: "object",
    name: "whatsapp",
    label: "WhatsApp",
    fields: [
      texto("number", "Número"),
      texto("url", "Endereço do link", { description: "Começa por https://wa.me/" }),
      bil("label", "Texto do botão"),
    ],
  },
  {
    type: "object",
    name: "social",
    label: "Redes sociais",
    description: "Botões no rodapé e no canto do ecrã, em todas as páginas.",
    fields: [
      {
        type: "object",
        name: "facebook",
        label: "Facebook",
        fields: [
          visivel(),
          texto("url", "Endereço da página", { description: "Começa por https://www.facebook.com/" }),
        ],
      },
      {
        type: "object",
        name: "instagram",
        label: "Instagram",
        fields: [
          visivel(),
          texto("url", "Endereço da página", { description: "Começa por https://www.instagram.com/" }),
        ],
      },
    ],
  },
  {
    type: "object",
    name: "emails",
    label: "Emails",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + ((item?.address as string) || "Email"),
      }),
    },
    fields: [visivel(), texto("address", "Email")],
  },
  bil("emailLabel", "Título do bloco de emails"),
  bil("title", "Título"),
  bil("bannerImageAlt", "Descrição da imagem de topo"),
  bil("tag", "Etiqueta"),
  {
    type: "object",
    name: "locations",
    label: "Localizações",
    description: "Também aparecem na página inicial.",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + ((item?.name as string) || "Localização"),
      }),
    },
    fields: [
      visivel(),
      oculto("id", "Identificador interno"),
      icone(),
      bil("type", "Tipo", { description: "Ex.: Sede, Escritório." }),
      texto("name", "Nome do local"),
      { type: "string", name: "address", label: "Morada (uma linha por item)", list: true, required: true },
    ],
  },
  {
    type: "object",
    name: "contactForm",
    label: "Formulário de contacto",
    // Sem `recipientEmail`: o destino é a variável de ambiente
    // CONTACT_RECIPIENT_EMAIL.
    description:
      "Envia email através do Resend (app/api/contact). A aplicação não guarda as mensagens; ficam na caixa de destino e no registo do Resend. O email de destino é configurado pelo administrador no alojamento, não aqui.",
    fields: [
      visivel(),
      bil("heading", "Título"),
      bil("nameLabel", "Rótulo 'Nome'"),
      bil("emailLabel", "Rótulo 'Email'"),
      bil("phoneLabel", "Rótulo 'Telefone'"),
      bil("subjectLabel", "Rótulo 'Assunto'"),
      bil("messageLabel", "Rótulo 'Mensagem'"),
      bil("submitLabel", "Texto do botão"),
      bilText("successMessage", "Mensagem de sucesso"),
      bilText("errorMessage", "Mensagem de erro"),
      bil("verificationErrorMessage", "Mensagem de falha da verificação anti-spam", {
        description: "Mostrada quando a verificação da Cloudflare falha e o botão fica desativado. Curta.",
      }),
      bilText("privacyNotice", "Aviso de privacidade", {
        maxLength: 1500,
        description:
          "Aviso mostrado junto ao botão de envio. Texto PROVISÓRIO: falta o prazo de conservação e o enquadramento legal, a definir pelo responsável da empresa.",
      }),
    ],
  },
]);

// ── 7-10. Menu, Rodapé, 404, Definições ─────────────────────────────────────

function itemMenu(name: string, label: string): TinaField {
  return {
    type: "object",
    name,
    label,
    fields: [
      visivel("visible", "Mostrar no site", "No menu e no rodapé. Pelo menos um tem de ficar ligado."),
      { type: "string", name: "pt", label: "Português", required: true },
      { type: "string", name: "en", label: "Inglês", required: true },
    ],
  } as TinaField;
}

const menu = paginaUnica("menu", "Menu", "nav", [
  itemMenu("home", "Início"),
  itemMenu("services", "Serviços"),
  itemMenu("products", "Produtos"),
  itemMenu("campaign", "Campanha"),
  itemMenu("contact", "Contactos"),
  itemMenu("about", "Quem Somos"),
  bil("servicesViewAll", "Texto do link 'Ver todos os serviços'"),
]);

const rodape = paginaUnica("rodape", "Rodapé", "footer", [
  bil("servicesHeading", "Título da coluna 'Serviços'"),
  bil("linksHeading", "Título da coluna 'Links'"),
  bilText("description", "Texto por baixo do logótipo"),
  {
    type: "object",
    name: "serviceLinks",
    label: "Serviços no rodapé",
    list: true,
    ui: {
      itemProps: (item: Record<string, unknown>) => ({
        label: itemOculto(item) + ((item?.serviceId as string) || "Serviço"),
      }),
    },
    fields: [
      visivel(),
      {
        type: "string",
        name: "serviceId",
        label: "Serviço",
        required: true,
        options: [
          { value: "arroz", label: "Produção de arroz" },
          { value: "cereais", label: "Produção de cereais e legumes" },
          { value: "moageira", label: "Moageira e processamento industrial" },
          { value: "terras", label: "Preparação de terras" },
          { value: "campanha", label: "Campanha agrícola 2025/2026" },
          { value: "mecanizacao", label: "Mecanização agrícola" },
          { value: "apoio-tecnico", label: "Apoio técnico no campo" },
          { value: "comercializacao", label: "Comercialização agrícola" },
        ],
      },
    ],
  },
  bil("legalCopy", "Texto legal", {
    description: "Sem o ano nem o NUIT — ambos são acrescentados automaticamente.",
  }),
  bil("madeIn", "'Feito em'"),
  {
    type: "object",
    name: "signature",
    label: "Assinatura",
    fields: [visivel(), texto("name", "Nome"), texto("whatsappNumber", "Número de WhatsApp")],
  },
]);

const paginaNaoEncontrada = paginaUnica("paginaNaoEncontrada", "Página não encontrada", "notFound", [
  bil("tag", "Etiqueta"),
  bil("title", "Título"),
  bilText("text", "Texto"),
  bil("backHome", "Texto do botão"),
]);

const definicoes = paginaUnica("definicoes", "Definições avançadas", "meta", [
  texto("titleSuffix", "Sufixo do título", { description: "Ex.: AGRO TRADES." }),
  oculto("siteUrl", "Endereço do site", "Só o responsável técnico altera."),
  // `string` oculto e não `image`: é o logótipo (fora de images/uploads/) e
  // um campo `image` passaria pelo resolvedor de media da Tina Cloud, que
  // reescreve caminhos fora de mediaRoot ao gravar.
  oculto("ogImage", "Imagem de partilha", "Logótipo usado nas partilhas; só o responsável técnico altera."),
  bil("defaultTitle", "Título por defeito", { description: "Título para o Google e partilhas." }),
  bilText("defaultDescription", "Descrição por defeito", {
    description: "Descrição para o Google e partilhas.",
  }),
]);

/** Ordem do menu do admin. */
export const collections: Collection[] = [
  servicos,
  servicosLista,
  servicosTextos,
  produtos,
  produtosLista,
  paginaInicial,
  quemSomos,
  campanha,
  contactos,
  menu,
  rodape,
  paginaNaoEncontrada,
  definicoes,
];
