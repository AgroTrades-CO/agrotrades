// Verificação "zero Tina" nas páginas públicas.
//
// Corre no fim de CADA `npm run build` (local, CI, Vercel), depois de `next build`, sobre .next/.
// Falha fechada e sem interruptor: nenhuma variável nem argumento a desliga.
// Alterar MARKS ou TINA_MODULE ou a lista de exclusões exige revisão de segurança.
//
// 1. Páginas públicas = prerender-manifest.json (sem /_global-error, /robots.txt, /sitemap.xml,
//    editor-preview, /api/, /admin); todas as URLs do sitemap têm de estar nessa lista.
// 2. JS de cada página = chunks do HTML (<script src>) e das listas do payload RSC (HTML e .rsc).
// 3. Marcas de texto (MARKS) no HTML, .rsc e .segments/** de cada página e em cada chunk dela.
// 4. Módulos: nenhum módulo Tina nos manifestos de referências cliente das rotas públicas, e
//    nenhum chunk público regista um id de módulo Tina (ids recolhidos dos manifestos das rotas
//    editor-preview; chunks lidos num vm restrito, fábricas nunca executadas).
// 5. Controlo positivo: havendo rotas editor-preview, pelo menos um dos seus chunks contém uma
//    marca literal da Tina (senão as marcas estão desatualizadas e a verificação ficou cega).
// 6. Saída: uma linha por página (chunks, bytes brutos, gzip) e OK/FALHA; nunca imprime conteúdo.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import {
  chunkModuleIds,
  isPublicRoute,
  listPublicPages,
  listSitemapPaths,
  loadClientManifests,
  pageChunks,
  pageTextFiles,
} from "./lib/public-pages.mjs";

const MARKS =
  /tinacms|useTina|useEditState|tinaField|data-tina-field|_content_source|\btinajs\.io\b|\btina\.io\b|editor-preview|components\/tina\//;
const TINA_MODULE = /\[project\]\/(components\/tina\/|tina\/|node_modules\/(tinacms|@tinacms)\/)|editor-preview/;

const root = process.cwd();
const nextDir = join(root, ".next");
const chunkDir = join(nextDir, "static", "chunks");
const failures = [];
const fail = (msg) => failures.push(msg);

if (!existsSync(join(nextDir, "BUILD_ID"))) {
  console.error("[check-public-bundle] falta .next/BUILD_ID: correr depois de `next build`, na raiz.");
  process.exit(1);
}

// 1. Páginas públicas e cobertura do sitemap.
const pages = listPublicPages(nextDir);
for (const p of listSitemapPaths(nextDir)) {
  if (!pages.includes(p)) fail(`sitemap: ${p} não é uma página pré-renderizada pública`);
}

// 4 (a). Manifestos: módulos Tina nas rotas públicas; ids proibidos a partir das rotas editor-preview.
const manifests = loadClientManifests(nextDir);
const forbiddenIds = new Set();
const previewChunks = new Set();
for (const [appPage, modules] of Object.entries(manifests)) {
  const isPreview = /editor-preview/.test(appPage);
  for (const [key, mod] of Object.entries(modules)) {
    if (!TINA_MODULE.test(key)) continue;
    if (isPreview) {
      forbiddenIds.add(mod.id);
      for (const c of mod.chunks ?? []) previewChunks.add(c.split("/").pop());
    } else if (isPublicRoute(appPage.replace(/\/page$/, "") || "/")) {
      fail(`manifesto ${appPage}: módulo Tina ${key}`);
    }
  }
}

// Leitura de chunks com cache (texto, ids).
const chunkCache = new Map();
const readChunk = (name) => {
  if (!chunkCache.has(name)) {
    const file = join(chunkDir, name);
    if (!existsSync(file)) {
      chunkCache.set(name, null);
    } else {
      const buf = readFileSync(file);
      const text = buf.toString("utf8");
      chunkCache.set(name, { raw: buf.length, gzip: gzipSync(buf, { level: 6 }).length, text, ids: chunkModuleIds(text) });
    }
  }
  return chunkCache.get(name);
};

// 2, 3, 4 (b). Por página.
for (const route of pages) {
  const problems = [];
  let chunks = [];
  try {
    for (const file of pageTextFiles(nextDir, route)) {
      const m = readFileSync(file, "utf8").match(MARKS);
      if (m) problems.push(`marca "${m[0]}" em ${file.slice(root.length + 1)}`);
    }
    chunks = pageChunks(nextDir, route);
  } catch (err) {
    problems.push(err.message);
  }
  let raw = 0, gzip = 0;
  for (const name of chunks) {
    const c = readChunk(name);
    if (!c) {
      problems.push(`chunk inexistente ${name}`);
      continue;
    }
    raw += c.raw;
    gzip += c.gzip;
    const m = c.text.match(MARKS);
    if (m) problems.push(`marca "${m[0]}" no chunk ${name}`);
    if (c.ids === null) problems.push(`formato de chunk não reconhecido: ${name}`);
    else if (c.ids.some((id) => forbiddenIds.has(id))) problems.push(`chunk ${name} regista um módulo Tina`);
  }
  console.log(`[check-public-bundle] ${route}: ${chunks.length} chunks, ${raw} bytes, ${gzip} gzip — ${problems.length ? "FALHA" : "OK"}`);
  for (const p of problems) fail(`${route}: ${p}`);
}

// 5. Controlo positivo.
const hasPreviewRoutes = Object.keys(manifests).some((p) => /editor-preview/.test(p));
if (hasPreviewRoutes) {
  // `useTina` era a marca deste controlo até ao Next 16.3; no 16.4 o minificador renomeia o
  // identificador e a marca deixou de aparecer nos chunks — o controlo passava a estar cego em
  // vez de a falhar. Usam-se agora literais de texto, que a minificação não pode renomear:
  // `data-tina-field` (atributo e seletores de CSS da pré-visualização) e `_content_source`.
  // Ambos constam de MARKS, por isso a sua presença num chunk público continua a ser falha.
  const POSITIVE_CONTROL = /data-tina-field|_content_source/;
  const found = [...previewChunks].some((name) => POSITIVE_CONTROL.test(readChunk(name)?.text ?? ""));
  if (!found) fail("controlo positivo: nenhum chunk da pré-visualização contém marcas da Tina (marcas desatualizadas?)");
  if (forbiddenIds.size === 0) fail("controlo positivo: nenhum módulo Tina encontrado nos manifestos da pré-visualização");
}

if (failures.length) {
  console.error(`[check-public-bundle] FALHA (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`[check-public-bundle] OK: ${pages.length} páginas públicas sem código, markup nem hosts da Tina.`);
