export function gql(strings, ...args) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (args[i] || "");
  });
  return str;
}
export const ServicoPartsFragmentDoc = gql`
    fragment ServicoParts on Servico {
  __typename
  serviceId
  icon
  title {
    __typename
    pt
    en
  }
  summary {
    __typename
    pt
    en
  }
  description {
    __typename
    pt
    en
  }
  highlights {
    __typename
    pt
    en
  }
  homeTitle {
    __typename
    pt
    en
  }
  homeBlurb {
    __typename
    pt
    en
  }
  bannerImage
  bannerImageAlt {
    __typename
    pt
    en
  }
  sections {
    __typename
    icon
    title {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
    image {
      __typename
      image
      alt {
        __typename
        pt
        en
      }
    }
    layout
    bullets {
      __typename
      pt
      en
    }
    visible
  }
  galleryVisible
  gallery {
    __typename
    image
    alt {
      __typename
      pt
      en
    }
    visible
  }
}
    `;
export const ServicosListaPartsFragmentDoc = gql`
    fragment ServicosListaParts on ServicosLista {
  __typename
  bannerImage
  bannerImageAlt {
    __typename
    pt
    en
  }
  sectionHeading {
    __typename
    tag {
      __typename
      pt
      en
    }
    title {
      __typename
      pt
      en
    }
    learnMore {
      __typename
      pt
      en
    }
  }
  intro {
    __typename
    pt
    en
  }
  ctaTitle {
    __typename
    pt
    en
  }
  ctaText {
    __typename
    pt
    en
  }
}
    `;
export const ServicosTextosPartsFragmentDoc = gql`
    fragment ServicosTextosParts on ServicosTextos {
  __typename
  highlightsHeading {
    __typename
    pt
    en
  }
  backToServices {
    __typename
    pt
    en
  }
  galleryHeading {
    __typename
    pt
    en
  }
  relatedHeading {
    __typename
    pt
    en
  }
  relatedVisible
}
    `;
export const PaginaInicialPartsFragmentDoc = gql`
    fragment PaginaInicialParts on PaginaInicial {
  __typename
  hero {
    __typename
    tag {
      __typename
      pt
      en
    }
    titleLine1 {
      __typename
      pt
      en
    }
    titleLine2 {
      __typename
      pt
      en
    }
    motto {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
    buttons {
      __typename
      whatsapp {
        __typename
        pt
        en
      }
      services {
        __typename
        pt
        en
      }
    }
    slider {
      __typename
      label {
        __typename
        pt
        en
      }
      previousLabel {
        __typename
        pt
        en
      }
      nextLabel {
        __typename
        pt
        en
      }
      goToSlideLabel {
        __typename
        pt
        en
      }
      slides {
        __typename
        ... on PaginaInicialHeroSliderSlidesImage {
          visible
          image
          alt {
            __typename
            pt
            en
          }
        }
        ... on PaginaInicialHeroSliderSlidesVideo {
          visible
          youtubeId
          caption {
            __typename
            pt
            en
          }
        }
      }
    }
  }
  stats {
    __typename
    items {
      __typename
      visible
      value
      label {
        __typename
        pt
        en
      }
    }
  }
  locationsHeading {
    __typename
    tag {
      __typename
      pt
      en
    }
    title {
      __typename
      pt
      en
    }
  }
  about {
    __typename
    extended {
      __typename
      visible
      pt
      en
    }
    ceo {
      __typename
      visible
      name
      initials
      role {
        __typename
        pt
        en
      }
    }
    learnMoreLabel {
      __typename
      pt
      en
    }
  }
}
    `;
export const QuemSomosPartsFragmentDoc = gql`
    fragment QuemSomosParts on QuemSomos {
  __typename
  tag {
    __typename
    pt
    en
  }
  title {
    __typename
    pt
    en
  }
  summary {
    __typename
    pt
    en
  }
  fullText {
    __typename
    visible
    pt
    en
  }
  tags {
    __typename
    visible
    icon
    label {
      __typename
      pt
      en
    }
  }
  bannerImage
  bannerImageAlt {
    __typename
    pt
    en
  }
  teamTag {
    __typename
    pt
    en
  }
  teamHeading {
    __typename
    pt
    en
  }
  valuesTag {
    __typename
    pt
    en
  }
  valuesHeading {
    __typename
    pt
    en
  }
  valuesVisible
  valores {
    __typename
    icon
    title {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
    visible
  }
  team {
    __typename
    items {
      __typename
      visible
      nome
      cargo {
        __typename
        pt
        en
      }
      foto
      frase {
        __typename
        pt
        en
      }
      bio {
        __typename
        pt
        en
      }
      badges {
        __typename
        pt
        en
      }
      phone
      whatsapp
      email
    }
  }
}
    `;
export const CampanhaPartsFragmentDoc = gql`
    fragment CampanhaParts on Campanha {
  __typename
  banner {
    __typename
    tag {
      __typename
      pt
      en
    }
    title {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
    button {
      __typename
      pt
      en
    }
  }
  hero {
    __typename
    tag
    intro {
      __typename
      pt
      en
    }
    bannerImage
    bannerImageAlt {
      __typename
      pt
      en
    }
  }
  quote {
    __typename
    author
    citeSuffix {
      __typename
      pt
      en
    }
  }
  vision {
    __typename
    visible
    tag {
      __typename
      pt
      en
    }
    title {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
  }
  timelineHeading {
    __typename
    tag {
      __typename
      pt
      en
    }
    title {
      __typename
      pt
      en
    }
  }
  pillars {
    __typename
    visible
    icon
    title {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
  }
  timelineVisible
  timeline {
    __typename
    visible
    title {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
  }
  cta {
    __typename
    visible
    title {
      __typename
      pt
      en
    }
    text {
      __typename
      pt
      en
    }
    button {
      __typename
      pt
      en
    }
  }
}
    `;
export const ContactosPartsFragmentDoc = gql`
    fragment ContactosParts on Contactos {
  __typename
  phones {
    __typename
    visible
    number
  }
  phoneLabel {
    __typename
    pt
    en
  }
  intro {
    __typename
    pt
    en
  }
  ceo {
    __typename
    visible
    name
    initials
    role {
      __typename
      pt
      en
    }
    company
  }
  bannerImage
  mapsLink
  mapEmbedUrl
  whatsapp {
    __typename
    number
    url
    label {
      __typename
      pt
      en
    }
  }
  emails {
    __typename
    visible
    address
  }
  emailLabel {
    __typename
    pt
    en
  }
  title {
    __typename
    pt
    en
  }
  bannerImageAlt {
    __typename
    pt
    en
  }
  tag {
    __typename
    pt
    en
  }
  locations {
    __typename
    visible
    id
    icon
    type {
      __typename
      pt
      en
    }
    name
    address
  }
  contactForm {
    __typename
    visible
    heading {
      __typename
      pt
      en
    }
    nameLabel {
      __typename
      pt
      en
    }
    emailLabel {
      __typename
      pt
      en
    }
    phoneLabel {
      __typename
      pt
      en
    }
    subjectLabel {
      __typename
      pt
      en
    }
    messageLabel {
      __typename
      pt
      en
    }
    submitLabel {
      __typename
      pt
      en
    }
    successMessage {
      __typename
      pt
      en
    }
    errorMessage {
      __typename
      pt
      en
    }
    verificationErrorMessage {
      __typename
      pt
      en
    }
    privacyNotice {
      __typename
      pt
      en
    }
  }
}
    `;
export const MenuPartsFragmentDoc = gql`
    fragment MenuParts on Menu {
  __typename
  home {
    __typename
    visible
    pt
    en
  }
  services {
    __typename
    visible
    pt
    en
  }
  campaign {
    __typename
    visible
    pt
    en
  }
  contact {
    __typename
    visible
    pt
    en
  }
  about {
    __typename
    visible
    pt
    en
  }
  servicesViewAll {
    __typename
    pt
    en
  }
}
    `;
export const RodapePartsFragmentDoc = gql`
    fragment RodapeParts on Rodape {
  __typename
  servicesHeading {
    __typename
    pt
    en
  }
  linksHeading {
    __typename
    pt
    en
  }
  description {
    __typename
    pt
    en
  }
  serviceLinks {
    __typename
    visible
    serviceId
  }
  legalCopy {
    __typename
    pt
    en
  }
  madeIn {
    __typename
    pt
    en
  }
  signature {
    __typename
    visible
    name
    whatsappNumber
  }
}
    `;
export const PaginaNaoEncontradaPartsFragmentDoc = gql`
    fragment PaginaNaoEncontradaParts on PaginaNaoEncontrada {
  __typename
  tag {
    __typename
    pt
    en
  }
  title {
    __typename
    pt
    en
  }
  text {
    __typename
    pt
    en
  }
  backHome {
    __typename
    pt
    en
  }
}
    `;
export const DefinicoesPartsFragmentDoc = gql`
    fragment DefinicoesParts on Definicoes {
  __typename
  titleSuffix
  siteUrl
  ogImage
  defaultTitle {
    __typename
    pt
    en
  }
  defaultDescription {
    __typename
    pt
    en
  }
}
    `;
export const HomePreviewDocument = gql`
    query homePreview {
  paginaInicial(relativePath: "home.json") {
    ...PaginaInicialParts
  }
  quemSomos(relativePath: "quemSomos.json") {
    ...QuemSomosParts
  }
}
    ${PaginaInicialPartsFragmentDoc}
${QuemSomosPartsFragmentDoc}`;
export const ServicoDocument = gql`
    query servico($relativePath: String!) {
  servico(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...ServicoParts
  }
}
    ${ServicoPartsFragmentDoc}`;
export const ServicoConnectionDocument = gql`
    query servicoConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: ServicoFilter) {
  servicoConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...ServicoParts
      }
    }
  }
}
    ${ServicoPartsFragmentDoc}`;
export const ServicosListaDocument = gql`
    query servicosLista($relativePath: String!) {
  servicosLista(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...ServicosListaParts
  }
}
    ${ServicosListaPartsFragmentDoc}`;
export const ServicosListaConnectionDocument = gql`
    query servicosListaConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: ServicosListaFilter) {
  servicosListaConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...ServicosListaParts
      }
    }
  }
}
    ${ServicosListaPartsFragmentDoc}`;
export const ServicosTextosDocument = gql`
    query servicosTextos($relativePath: String!) {
  servicosTextos(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...ServicosTextosParts
  }
}
    ${ServicosTextosPartsFragmentDoc}`;
export const ServicosTextosConnectionDocument = gql`
    query servicosTextosConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: ServicosTextosFilter) {
  servicosTextosConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...ServicosTextosParts
      }
    }
  }
}
    ${ServicosTextosPartsFragmentDoc}`;
export const PaginaInicialDocument = gql`
    query paginaInicial($relativePath: String!) {
  paginaInicial(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...PaginaInicialParts
  }
}
    ${PaginaInicialPartsFragmentDoc}`;
export const PaginaInicialConnectionDocument = gql`
    query paginaInicialConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: PaginaInicialFilter) {
  paginaInicialConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...PaginaInicialParts
      }
    }
  }
}
    ${PaginaInicialPartsFragmentDoc}`;
export const QuemSomosDocument = gql`
    query quemSomos($relativePath: String!) {
  quemSomos(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...QuemSomosParts
  }
}
    ${QuemSomosPartsFragmentDoc}`;
export const QuemSomosConnectionDocument = gql`
    query quemSomosConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: QuemSomosFilter) {
  quemSomosConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...QuemSomosParts
      }
    }
  }
}
    ${QuemSomosPartsFragmentDoc}`;
export const CampanhaDocument = gql`
    query campanha($relativePath: String!) {
  campanha(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...CampanhaParts
  }
}
    ${CampanhaPartsFragmentDoc}`;
export const CampanhaConnectionDocument = gql`
    query campanhaConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: CampanhaFilter) {
  campanhaConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...CampanhaParts
      }
    }
  }
}
    ${CampanhaPartsFragmentDoc}`;
export const ContactosDocument = gql`
    query contactos($relativePath: String!) {
  contactos(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...ContactosParts
  }
}
    ${ContactosPartsFragmentDoc}`;
export const ContactosConnectionDocument = gql`
    query contactosConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: ContactosFilter) {
  contactosConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...ContactosParts
      }
    }
  }
}
    ${ContactosPartsFragmentDoc}`;
export const MenuDocument = gql`
    query menu($relativePath: String!) {
  menu(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...MenuParts
  }
}
    ${MenuPartsFragmentDoc}`;
export const MenuConnectionDocument = gql`
    query menuConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: MenuFilter) {
  menuConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...MenuParts
      }
    }
  }
}
    ${MenuPartsFragmentDoc}`;
export const RodapeDocument = gql`
    query rodape($relativePath: String!) {
  rodape(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...RodapeParts
  }
}
    ${RodapePartsFragmentDoc}`;
export const RodapeConnectionDocument = gql`
    query rodapeConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: RodapeFilter) {
  rodapeConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...RodapeParts
      }
    }
  }
}
    ${RodapePartsFragmentDoc}`;
export const PaginaNaoEncontradaDocument = gql`
    query paginaNaoEncontrada($relativePath: String!) {
  paginaNaoEncontrada(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...PaginaNaoEncontradaParts
  }
}
    ${PaginaNaoEncontradaPartsFragmentDoc}`;
export const PaginaNaoEncontradaConnectionDocument = gql`
    query paginaNaoEncontradaConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: PaginaNaoEncontradaFilter) {
  paginaNaoEncontradaConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...PaginaNaoEncontradaParts
      }
    }
  }
}
    ${PaginaNaoEncontradaPartsFragmentDoc}`;
export const DefinicoesDocument = gql`
    query definicoes($relativePath: String!) {
  definicoes(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...DefinicoesParts
  }
}
    ${DefinicoesPartsFragmentDoc}`;
export const DefinicoesConnectionDocument = gql`
    query definicoesConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: DefinicoesFilter) {
  definicoesConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...DefinicoesParts
      }
    }
  }
}
    ${DefinicoesPartsFragmentDoc}`;
export function getSdk(requester) {
  return {
    homePreview(variables, options) {
      return requester(HomePreviewDocument, variables, options);
    },
    servico(variables, options) {
      return requester(ServicoDocument, variables, options);
    },
    servicoConnection(variables, options) {
      return requester(ServicoConnectionDocument, variables, options);
    },
    servicosLista(variables, options) {
      return requester(ServicosListaDocument, variables, options);
    },
    servicosListaConnection(variables, options) {
      return requester(ServicosListaConnectionDocument, variables, options);
    },
    servicosTextos(variables, options) {
      return requester(ServicosTextosDocument, variables, options);
    },
    servicosTextosConnection(variables, options) {
      return requester(ServicosTextosConnectionDocument, variables, options);
    },
    paginaInicial(variables, options) {
      return requester(PaginaInicialDocument, variables, options);
    },
    paginaInicialConnection(variables, options) {
      return requester(PaginaInicialConnectionDocument, variables, options);
    },
    quemSomos(variables, options) {
      return requester(QuemSomosDocument, variables, options);
    },
    quemSomosConnection(variables, options) {
      return requester(QuemSomosConnectionDocument, variables, options);
    },
    campanha(variables, options) {
      return requester(CampanhaDocument, variables, options);
    },
    campanhaConnection(variables, options) {
      return requester(CampanhaConnectionDocument, variables, options);
    },
    contactos(variables, options) {
      return requester(ContactosDocument, variables, options);
    },
    contactosConnection(variables, options) {
      return requester(ContactosConnectionDocument, variables, options);
    },
    menu(variables, options) {
      return requester(MenuDocument, variables, options);
    },
    menuConnection(variables, options) {
      return requester(MenuConnectionDocument, variables, options);
    },
    rodape(variables, options) {
      return requester(RodapeDocument, variables, options);
    },
    rodapeConnection(variables, options) {
      return requester(RodapeConnectionDocument, variables, options);
    },
    paginaNaoEncontrada(variables, options) {
      return requester(PaginaNaoEncontradaDocument, variables, options);
    },
    paginaNaoEncontradaConnection(variables, options) {
      return requester(PaginaNaoEncontradaConnectionDocument, variables, options);
    },
    definicoes(variables, options) {
      return requester(DefinicoesDocument, variables, options);
    },
    definicoesConnection(variables, options) {
      return requester(DefinicoesConnectionDocument, variables, options);
    }
  };
}
import { createClient } from "tinacms/dist/client";
const generateRequester = (client) => {
  const requester = async (doc, vars, options) => {
    let url = client.apiUrl;
    if (options?.branch) {
      const index = client.apiUrl.lastIndexOf("/");
      url = client.apiUrl.substring(0, index + 1) + options.branch;
    }
    const data = await client.request({
      query: doc,
      variables: vars,
      url
    }, options);
    return { data: data?.data, errors: data?.errors, query: doc, variables: vars || {} };
  };
  return requester;
};
export const ExperimentalGetTinaClient = () => getSdk(
  generateRequester(
    createClient({
      url: "http://localhost:4001/graphql",
      queries
    })
  )
);
export const queries = (client) => {
  const requester = generateRequester(client);
  return getSdk(requester);
};
