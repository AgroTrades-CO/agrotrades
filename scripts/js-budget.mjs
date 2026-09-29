// AC-15b / C-B — orçamento de JS por página pública (task-017, architecture.md 19.3).
//
// JS da página = soma do gzip (nível da config) de cada chunk referido pela página (tags
// <script src> e listas do payload RSC). Delta = HEAD − linha de base; aprovado se
// delta ≤ budgetGzipBytes em todas as páginas públicas (26 do sitemap + 404).
//
// Linha de base = `baselineRef` (scripts/js-budget.config.json; só o architect a muda, 19.3.4)
// reconstruída com os content/**/*.json ATUAIS (o conteúdo está no bundle, task-016), em cache
// em .next/cache/js-budget/<ref>-<hash dos JSON>.json.
//
// Modos:
//   --enforce          reconstrói (ou reutiliza) a linha de base, compara, código 1 se exceder.
//                      Recusa se `git status --porcelain` mostrar alterações fora de content/,
//                      salvo --allow-dirty (só uso local).
//   --report           só com a linha de base já em cache; imprime a tabela; nunca falha e nunca
//                      instala nem constrói (é o modo do `npm run build`, 19.3.5).
//   --write <ficheiro> grava o manifesto por página (evidência).
//
// Segurança (SEC-AC15-1): o build da linha de base corre numa pasta temporária fora do
// repositório criada por `git archive` (sem .git nem hooks), apagada no fim mesmo em erro, com
// `npm ci --ignore-scripts` e um ambiente mínimo por lista de permissão (nenhuma variável de
// Production, Tina, Vercel ou GitHub passa). Nunca imprime conteúdo de chunks.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { gzipSync } from "node:zlib";
import { listPublicPages, pageChunks } from "./lib/public-pages.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const mode = args.includes("--enforce") ? "enforce" : args.includes("--report") ? "report" : null;
const allowDirty = args.includes("--allow-dirty");
const writeIdx = args.indexOf("--write");
const writeFile = writeIdx >= 0 ? args[writeIdx + 1] : null;
if (!mode) {
  console.error("uso: node scripts/js-budget.mjs --enforce|--report [--write <ficheiro>] [--allow-dirty]");
  process.exit(2);
}

const config = JSON.parse(readFileSync(join(root, "scripts", "js-budget.config.json"), "utf8"));
const { baselineRef, budgetGzipBytes, gzipLevel } = config;
const log = (m) => console.log(`[js-budget] ${m}`);

// ── Medida de um .next/ ──────────────────────────────────────────────────────
function measure(nextDir) {
  const cache = new Map();
  const size = (name) => {
    if (!cache.has(name)) {
      const buf = readFileSync(join(nextDir, "static", "chunks", name));
      cache.set(name, { raw: buf.length, gzip: gzipSync(buf, { level: gzipLevel }).length });
    }
    return cache.get(name);
  };
  const pages = {};
  for (const route of listPublicPages(nextDir)) {
    const chunks = pageChunks(nextDir, route);
    let raw = 0, gzip = 0;
    for (const c of chunks) {
      const s = size(c);
      raw += s.raw;
      gzip += s.gzip;
    }
    pages[route] = { chunks, raw, gzip };
  }
  return pages;
}

// ── Linha de base ────────────────────────────────────────────────────────────
const walkJson = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walkJson(p) : n.endsWith(".json") ? [p] : [];
  });
const contentJson = walkJson(join(root, "content")).map((p) => relative(root, p).split("\\").join("/")).sort();
const contentHash = createHash("sha256");
for (const f of contentJson) contentHash.update(f).update("\0").update(readFileSync(join(root, f))).update("\0");
const cacheFile = join(root, ".next", "cache", "js-budget", `${baselineRef}-${contentHash.digest("hex").slice(0, 16)}.json`);

/** Ambiente mínimo para o build da linha de base (SEC-AC15-1 b). */
function minimalEnv() {
  const allow = ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "windir", "ComSpec", "PATHEXT", "HOME", "USERPROFILE",
    "TEMP", "TMP", "TMPDIR", "APPDATA", "LOCALAPPDATA"];
  const env = {};
  for (const k of allow) if (process.env[k] !== undefined) env[k] = process.env[k];
  env.NEXT_TELEMETRY_DISABLED = "1";
  return env;
}

function buildBaseline() {
  const work = mkdtempSync(join(tmpdir(), "js-budget-"));
  try {
    log(`a construir a linha de base ${baselineRef} em pasta temporária (git archive, npm ci --ignore-scripts, next build)`);
    const tar = join(work, "baseline.tar");
    const dir = join(work, "src");
    mkdirSync(dir);
    execFileSync("git", ["archive", "--format=tar", "-o", tar, baselineRef], { cwd: root, stdio: "inherit" });
    // Caminhos relativos: o tar do Git para Windows lê "C:" como anfitrião remoto.
    execFileSync("tar", ["-xf", "baseline.tar", "-C", "src"], { cwd: work, stdio: "inherit" });
    // Dados atuais por cima (só JSON; os .ts de content/ ficam os da linha de base).
    for (const f of contentJson) {
      mkdirSync(dirname(join(dir, f)), { recursive: true });
      cpSync(join(root, f), join(dir, f));
    }
    const env = minimalEnv();
    const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
    execFileSync(process.execPath, [npmCli, "ci", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: dir, env, stdio: "inherit" });
    try {
      execFileSync(process.execPath, [join(dir, "node_modules", "next", "dist", "bin", "next"), "build"], { cwd: dir, env, stdio: "inherit" });
    } catch {
      throw new Error(`linha de base incompatível: o build de ${baselineRef} com os JSON atuais falhou (decisão do architect, 19.3.2)`);
    }
    const pages = measure(join(dir, ".next"));
    mkdirSync(dirname(cacheFile), { recursive: true });
    writeFileSync(cacheFile, JSON.stringify({ baselineRef, gzipLevel, contentJson, pages }, null, 2) + "\n");
    return pages;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

// ── Execução ─────────────────────────────────────────────────────────────────
if (!existsSync(join(root, ".next", "BUILD_ID"))) {
  console.error("[js-budget] falta .next/BUILD_ID: correr depois de `next build`, na raiz.");
  process.exit(mode === "report" ? 0 : 1);
}

let baseline;
if (existsSync(cacheFile)) {
  baseline = JSON.parse(readFileSync(cacheFile, "utf8")).pages;
} else if (mode === "report") {
  log(`sem linha de base em cache para os JSON atuais (${relative(root, cacheFile)}); relatório omitido. Correr \`npm run check:js-budget\`.`);
  process.exit(0);
} else {
  if (!allowDirty) {
    const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" })
      .split("\n").filter(Boolean).filter((l) => !/ content\//.test(l));
    if (dirty.length) {
      console.error("[js-budget] há alterações fora de content/ por commitar (usar --allow-dirty só localmente):");
      for (const l of dirty) console.error(`  ${l}`);
      process.exit(1);
    }
  }
  try {
    baseline = buildBaseline();
  } catch (err) {
    console.error(`[js-budget] ${err.message}`);
    process.exit(1);
  }
}

// Par na linha de base para uma página nova (mesmo tipo de rota, 19.3.1).
const pairFor = (route) => {
  if (baseline[route]) return route;
  if (/^\/servicos\/[^/]+$/.test(route)) return "/servicos/arroz";
  if (/^\/en\/services\/[^/]+$/.test(route)) return "/en/services/rice";
  return null;
};

const head = measure(join(root, ".next"));
const rows = {};
let over = 0, unpaired = 0;
for (const [route, h] of Object.entries(head)) {
  const pair = pairFor(route);
  if (!pair) {
    unpaired++;
    rows[route] = { ...h, baseline: null, delta: null };
    log(`${route}: sem par na linha de base — decisão do architect`);
    continue;
  }
  const b = baseline[pair];
  const delta = h.gzip - b.gzip;
  if (delta > budgetGzipBytes) over++;
  rows[route] = { chunks: h.chunks, raw: h.raw, gzip: h.gzip, baseline: { route: pair, raw: b.raw, gzip: b.gzip }, delta, deltaRaw: h.raw - b.raw };
  log(`${route}: ${h.gzip} gzip (linha de base ${b.gzip}) delta ${delta >= 0 ? "+" : ""}${delta} / ${budgetGzipBytes} ${delta > budgetGzipBytes ? "EXCEDE" : "OK"}`);
}
const maxDelta = Math.max(...Object.values(rows).map((r) => r.delta ?? -Infinity));
log(`${Object.keys(rows).length} páginas; delta máximo ${maxDelta} bytes gzip; orçamento ${budgetGzipBytes}; baselineRef ${baselineRef}`);

if (writeFile) {
  writeFileSync(writeFile, JSON.stringify({ baselineRef, budgetGzipBytes, gzipLevel, maxDelta, pages: rows }, null, 2) + "\n");
  log(`manifesto gravado em ${writeFile}`);
}

if (mode === "enforce" && (over || unpaired)) {
  console.error(`[js-budget] FALHA: ${over} página(s) acima do orçamento, ${unpaired} sem par.`);
  process.exit(1);
}
if (mode === "report" && (over || unpaired)) log(`AVISO: ${over} página(s) acima do orçamento, ${unpaired} sem par (só relatório no build).`);
