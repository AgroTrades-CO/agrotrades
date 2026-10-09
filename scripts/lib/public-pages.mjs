// Leitura do resultado de `next build` (.next/) para as verificações do bundle
// público: lista das páginas públicas, chunks JS de cada página,
// manifestos de referências cliente e ids de módulos registados em cada chunk.
//
// Segurança: chunks e manifestos são código do próprio build, mas só são avaliados
// num `vm` com contexto novo (sem require, process nem o globalThis do Node), com timeout, e as
// fábricas dos módulos nunca são invocadas — só se recolhem os ids. Nada daqui imprime conteúdo
// de chunks ou de HTML.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const VM_TIMEOUT_MS = 2000;

/** Rotas que não são páginas públicas. */
export function isPublicRoute(route) {
  if (route === "/_global-error" || route === "/robots.txt" || route === "/sitemap.xml") return false;
  return !/editor-preview|\/api\/|\/admin/.test(route);
}

/** Base do ficheiro pré-renderizado de uma rota (`/` = `index`). */
export function routeFileBase(nextDir, route) {
  return join(nextDir, "server", "app", route === "/" ? "index" : route.slice(1));
}

/** Páginas públicas a partir de prerender-manifest.json (inclui /_not-found). */
export function listPublicPages(nextDir) {
  const manifest = JSON.parse(readFileSync(join(nextDir, "prerender-manifest.json"), "utf8"));
  return Object.keys(manifest.routes).filter(isPublicRoute).sort();
}

/** URLs (caminhos) do sitemap gerado. */
export function listSitemapPaths(nextDir) {
  const body = readFileSync(join(nextDir, "server", "app", "sitemap.xml.body"), "utf8");
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

const CHUNK_IN_TEXT = /\/_next\/static\/chunks\/[^"'\s)\\]+\.js/g;
const CHUNK_IN_RSC = /"(static\/chunks\/[^"\\]+\.js)"/g;

/** Nomes dos chunks JS de uma página: <script src> e listas do payload RSC (HTML e .rsc). */
export function pageChunks(nextDir, route) {
  const base = routeFileBase(nextDir, route);
  const names = new Set();
  for (const file of [`${base}.html`, `${base}.rsc`]) {
    if (!existsSync(file)) throw new Error(`falta ${file}`);
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(CHUNK_IN_TEXT)) names.add(m[0].split("/").pop());
    for (const m of text.matchAll(CHUNK_IN_RSC)) names.add(m[1].split("/").pop());
  }
  return [...names].sort();
}

/** Todos os ficheiros de texto pré-renderizados de uma página (HTML, .rsc, .segments/**). */
export function pageTextFiles(nextDir, route) {
  const base = routeFileBase(nextDir, route);
  const files = [`${base}.html`, `${base}.rsc`];
  const segDir = `${base}.segments`;
  const walk = (dir) =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  if (existsSync(segDir)) files.push(...walk(segDir));
  return files;
}

/** Todos os manifestos de referências cliente de páginas: { rota da app -> clientModules }. */
export function loadClientManifests(nextDir) {
  const out = {};
  const walk = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n === "page_client-reference-manifest.js") {
        const context = vm.createContext({});
        vm.runInContext(readFileSync(p, "utf8"), context, { timeout: VM_TIMEOUT_MS });
        const manifests = context.__RSC_MANIFEST ?? {};
        for (const [page, m] of Object.entries(manifests)) out[page] = m.clientModules ?? {};
      }
    }
  };
  walk(join(nextDir, "server", "app"));
  return out;
}

/**
 * Ids de módulos registados num chunk do Turbopack. `null` se o chunk não tiver o formato
 * reconhecido (o chamador decide: a verificação C-A trata isso como falha).
 */
export function chunkModuleIds(code) {
  // Script simples sem registo de módulos (ex.: polyfills do Next): não tem ids.
  if (!code.includes("TURBOPACK")) return [];
  const context = vm.createContext({ TURBOPACK: [], document: undefined });
  // Os chunks escrevem em `globalThis.TURBOPACK` e o runtime sonda
  // `self.TURBOPACK_ASSET_SUFFIX` logo na primeira instrução; sem `self` o chunk abortava antes
  // de registar o que quer que fosse. Ambos apontam para o próprio contexto do vm, que não expõe
  // nada do Node. As fábricas continuam a NÃO ser executadas: só se lê o que foi registado.
  context.globalThis = context;
  context.self = context;
  try {
    vm.runInContext(code, context, { timeout: VM_TIMEOUT_MS });
  } catch {
    // O chunk de runtime regista-se e depois tenta usar outras APIs do browser (ex.: `URL`), que
    // o contexto não expõe; o que interessa é o que ficou registado antes disso.
  }
  const entries = context.TURBOPACK;
  if (!Array.isArray(entries) || entries.length === 0) {
    // O chunk de runtime do Turbopack não regista módulos nenhuns: consome a fila e substitui
    // `globalThis.TURBOPACK` pelo seu próprio `{ push }`. Zero ids é o resultado correto para
    // ele — e SÓ para ele. Qualquer outro chunk que não registe nada continua a ser "formato
    // não reconhecido" (null), para a verificação falhar fechada em vez de ficar cega.
    return /globalThis\.TURBOPACK\s*=\s*\{\s*push\s*:/.test(code) ? [] : null;
  }
  const ids = [];
  // Formato (Next 16.4): [script atual, [(id... fábrica)*], {parâmetros do runtime}?]. Até ao
  // 16.3 os pares id/fábrica vinham no mesmo nível do script, sem o array intermédio; aceitam-se
  // os dois, daí a recursão. Vários ids seguidos partilham a fábrica seguinte.
  let pending = 0;
  const visit = (items, from) => {
    for (let i = from; i < items.length; i++) {
      const item = items[i];
      if (typeof item === "number") {
        ids.push(item);
        pending++;
      } else if (typeof item === "function") {
        if (pending === 0) return false;
        pending = 0;
      } else if (Array.isArray(item)) {
        if (!visit(item, 0)) return false;
      } else if (item && typeof item === "object") {
        continue;
      } else {
        return false;
      }
    }
    return true;
  };
  for (const entry of entries) {
    if (!Array.isArray(entry)) return null;
    pending = 0;
    if (!visit(entry, 1)) return null;
    if (pending !== 0) return null;
  }
  return ids;
}
