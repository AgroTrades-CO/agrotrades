#!/usr/bin/env node
/**
 * task-007 — caracterização HTTP de /api/auth e /api/auth/callback (handoff-01, secção 4, parte A).
 *
 * Node >= 18, sem dependências. Não altera código de produção. Não faz login real no GitHub.
 *
 * Modos:
 *   node characterize-auth.mjs run --out <ficheiro.json> [--port 3000]
 *       Para cada configuração de ambiente (ver CONFIGS), arranca `next dev` com variáveis
 *       FICTÍCIAS (que se sobrepõem às do .env.local — o @next/env não substitui variáveis já
 *       definidas no processo), espera que o servidor responda, executa os casos, pára o
 *       servidor e grava o JSON normalizado.
 *
 *   node characterize-auth.mjs run --base-url http://localhost:3000 --config full --out <f.json>
 *       Corre só os casos de UMA configuração contra um servidor já arrancado por outra via
 *       (ex.: `next start`). O utilizador é responsável por arrancá-lo com o ambiente certo.
 *
 *   node characterize-auth.mjs compare <antes.json> <depois.json>
 *       Compara dois resultados (ignora "meta") e lista as diferenças, caso a caso.
 *       Código de saída 0 = idênticos, 1 = há diferenças.
 *
 * Normalização (para que dois runs sejam comparáveis por diff e nada sensível fique gravado):
 *   - Location: `state` substituído por "<STATE:hex64>" (ou "<STATE:INVALIDO:...>");
 *     `client_id` só é gravado em claro se começar por "fake_"; caso contrário "<redacted>".
 *   - Set-Cookie: nome + atributos; o valor NUNCA é gravado — só se está vazio, o seu
 *     comprimento/formato, e (para o cookie de state) se coincide com o `state` do Location.
 *     Expires é normalizado para "<date>".
 *   - Corpo: qualquer sequência hex de 64 chars -> "<HEX64>"; qualquer "token":"..." -> "<TOKEN>".
 */

import { spawn, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..", "..");

const FAKE_SESSION_SECRET = "characterization-fake-session-secret-0123456789ab"; // 48 chars, fictício
const FAKE_STATE = "a".repeat(64);

/**
 * Configurações de ambiente. Valor "" = variável tratada como em falta (string vazia é falsy
 * em readOAuthConfig() e impede o @next/env de a preencher a partir do .env.local).
 */
function buildConfigs(port) {
  const origin = `http://localhost:${port}`;
  const base = {
    GITHUB_OAUTH_CLIENT_ID: "fake_id",
    GITHUB_OAUTH_CLIENT_SECRET: "fake_secret",
    SESSION_SECRET: FAKE_SESSION_SECRET,
    OAUTH_ALLOWED_ORIGIN: origin,
  };
  return {
    full: { env: { ...base }, description: "Todas as variáveis presentes (fictícias)." },
    "missing-client-secret": {
      env: { ...base, GITHUB_OAUTH_CLIENT_SECRET: "" },
      description: "GITHUB_OAUTH_CLIENT_SECRET em falta (A3).",
    },
    "missing-session-secret": {
      env: { ...base, SESSION_SECRET: "" },
      description: "SESSION_SECRET em falta (A3b — diferença intencional: antes 500, depois 302).",
    },
  };
}

/** Casos por configuração. */
const CASES = {
  full: [
    { id: "A1", desc: "GET /api/auth?provider=github", path: "/api/auth?provider=github" },
    { id: "A2", desc: "GET /api/auth?provider=gitlab", path: "/api/auth?provider=gitlab" },
    { id: "A2b", desc: "GET /api/auth sem provider", path: "/api/auth" },
    { id: "A4", desc: "Callback sem cookie de state", path: "/api/auth/callback?code=x&state=y" },
    {
      id: "A5",
      desc: "Callback com cookie state=abc e query state=abd",
      path: "/api/auth/callback?code=x&state=abd",
      cookie: "agrotrades_oauth_state=abc",
    },
    {
      id: "A6",
      desc: "Callback com cookie e state iguais, sem code",
      path: `/api/auth/callback?state=${FAKE_STATE}`,
      cookie: `agrotrades_oauth_state=${FAKE_STATE}`,
    },
    {
      id: "A7",
      desc: "Callback com cookie/state iguais e code fictício (GitHub recusa; depende de rede)",
      path: `/api/auth/callback?code=fake_code&state=${FAKE_STATE}`,
      cookie: `agrotrades_oauth_state=${FAKE_STATE}`,
    },
  ],
  "missing-client-secret": [
    { id: "A3", desc: "GET /api/auth?provider=github sem CLIENT_SECRET", path: "/api/auth?provider=github" },
    {
      id: "A3-callback",
      desc: "Callback (cookie/state iguais + code) sem CLIENT_SECRET",
      path: `/api/auth/callback?code=fake_code&state=${FAKE_STATE}`,
      cookie: `agrotrades_oauth_state=${FAKE_STATE}`,
    },
  ],
  "missing-session-secret": [
    { id: "A3b", desc: "GET /api/auth?provider=github sem SESSION_SECRET", path: "/api/auth?provider=github" },
    {
      id: "A3b-callback",
      desc: "Callback (cookie/state iguais + code) sem SESSION_SECRET",
      path: `/api/auth/callback?code=fake_code&state=${FAKE_STATE}`,
      cookie: `agrotrades_oauth_state=${FAKE_STATE}`,
    },
  ],
};

// ---------------------------------------------------------------- normalização

function describeValue(v) {
  if (v === "") return "<empty>";
  if (/^[0-9a-f]{64}$/.test(v)) return "<hex64>";
  return `<value:len=${v.length}>`;
}

function normalizeLocation(raw) {
  if (!raw) return { raw: null, state: null };
  let url;
  try {
    url = new URL(raw);
  } catch {
    return { raw: raw.replace(/[0-9a-f]{64}/g, "<HEX64>"), state: null };
  }
  let state = null;
  const params = [];
  for (const [k, v] of url.searchParams) {
    if (k === "state") {
      state = v;
      params.push([k, /^[0-9a-f]{64}$/.test(v) ? "<STATE:hex64>" : `<STATE:INVALIDO:len=${v.length}>`]);
    } else if (k === "client_id") {
      params.push([k, v.startsWith("fake_") ? v : "<redacted>"]);
    } else {
      params.push([k, v]);
    }
  }
  return {
    normalized: { origin: url.origin, pathname: url.pathname, params, hash: url.hash || "" },
    state,
  };
}

function parseSetCookie(line, locationState) {
  const parts = line.split(";").map((s) => s.trim()).filter(Boolean);
  const [nameValue, ...attrs] = parts;
  const eq = nameValue.indexOf("=");
  const name = eq === -1 ? nameValue : nameValue.slice(0, eq);
  const value = eq === -1 ? "" : nameValue.slice(eq + 1);
  const attributes = {};
  for (const a of attrs) {
    const i = a.indexOf("=");
    const key = (i === -1 ? a : a.slice(0, i)).toLowerCase();
    let val = i === -1 ? true : a.slice(i + 1);
    if (key === "expires") val = "<date>";
    if (typeof val === "string" && (key === "samesite")) val = val.toLowerCase();
    attributes[key] = val;
  }
  const sorted = Object.fromEntries(Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b)));
  const cookie = { name, value: describeValue(value), attributes: sorted };
  if (locationState !== null && value !== "") cookie.valueMatchesLocationState = value === locationState;
  return cookie;
}

function normalizeBody(text) {
  return text
    .replace(/"token"\s*:\s*"[^"]*"/g, '"token":"<TOKEN>"')
    .replace(/[0-9a-f]{64}/g, "<HEX64>");
}

async function runCase(baseUrl, c) {
  const headers = {};
  if (c.cookie) headers.cookie = c.cookie;
  const res = await fetch(baseUrl + c.path, { redirect: "manual", headers });
  const bodyText = await res.text();
  const loc = normalizeLocation(res.headers.get("location"));
  const setCookies = (res.headers.getSetCookie?.() ?? [])
    .map((l) => parseSetCookie(l, loc.state))
    .sort((a, b) => a.name.localeCompare(b.name));
  const body = normalizeBody(bodyText);
  return {
    id: c.id,
    request: { method: "GET", path: c.path.replace(/[0-9a-f]{64}/g, "<HEX64>"), cookie: c.cookie ? c.cookie.replace(/[0-9a-f]{64}/g, "<HEX64>") : null },
    description: c.desc,
    status: res.status,
    headers: {
      location: loc.normalized ?? loc.raw ?? null,
      "cache-control": res.headers.get("cache-control"),
      "content-type": res.headers.get("content-type"),
    },
    setCookie: setCookies,
    setCookieNames: setCookies.map((x) => x.name),
    body: { sha256: createHash("sha256").update(body).digest("hex"), length: body.length, text: body },
  };
}

// ---------------------------------------------------------------- servidor

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(baseUrl, timeoutMs = 240_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${baseUrl}/api/auth?provider=__ping__`, { redirect: "manual" });
      await r.text();
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error(`Servidor não respondeu em ${timeoutMs} ms`);
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-child.pid, "SIGTERM");
  } catch {
    /* já terminou */
  }
}

async function startDevServer(port, envOverrides) {
  const nextBin = resolve(REPO_ROOT, "node_modules", "next", "dist", "bin", "next");
  const env = { ...process.env, ...envOverrides, PORT: String(port), NEXT_TELEMETRY_DISABLED: "1" };
  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: REPO_ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  // Os logs do servidor não são gravados (podem mencionar configuração); só contamos linhas.
  const logStats = { lines: 0, configIncompleteMsgs: 0 };
  const onData = (d) => {
    const s = d.toString();
    logStats.lines += s.split("\n").length - 1;
    logStats.configIncompleteMsgs += (s.match(/Configuração do proxy OAuth incompleta/g) || []).length;
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  return { child, logStats };
}

// ---------------------------------------------------------------- comandos

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i + 1];
}

function gitInfo() {
  try {
    const head = execSync("git rev-parse --short HEAD", { cwd: REPO_ROOT }).toString().trim();
    const dirtyAuth = execSync("git status --porcelain -- app/api/auth lib/auth .env.example", { cwd: REPO_ROOT })
      .toString()
      .trim();
    return { head, authFilesDirty: dirtyAuth.length > 0, authFilesStatus: dirtyAuth || null };
  } catch {
    return null;
  }
}

async function cmdRun() {
  const out = arg("out");
  if (!out) throw new Error("--out é obrigatório");
  const port = Number(arg("port", "3000"));
  const externalBase = arg("base-url");
  const onlyConfig = arg("config");
  const configs = buildConfigs(port);

  const results = {};
  const serverStats = {};
  const names = onlyConfig ? [onlyConfig] : Object.keys(configs);

  for (const name of names) {
    if (!CASES[name]) throw new Error(`Configuração desconhecida: ${name}`);
    let server = null;
    const baseUrl = externalBase ?? `http://localhost:${port}`;
    try {
      if (!externalBase) {
        console.log(`[${name}] a arrancar next dev na porta ${port}...`);
        server = await startDevServer(port, configs[name].env);
      }
      await waitForServer(baseUrl);
      // Aquece as duas rotas (compilação on-demand do next dev) antes de medir.
      for (const p of ["/api/auth?provider=__warm__", "/api/auth/callback"]) {
        const r = await fetch(baseUrl + p, { redirect: "manual" });
        await r.text();
      }
      results[name] = [];
      for (const c of CASES[name]) {
        const r = await runCase(baseUrl, c);
        console.log(`[${name}] ${c.id}: ${r.status} cookies=${r.setCookieNames.join(",") || "-"}`);
        results[name].push(r);
      }
    } finally {
      if (server) {
        serverStats[name] = server.logStats;
        killTree(server.child);
        await sleep(2000);
      }
    }
  }

  const report = {
    meta: {
      task: "task-007-remove-unused-session",
      part: "A (scriptada)",
      generatedAt: new Date().toISOString(),
      node: process.version,
      git: gitInfo(),
      mode: externalBase ? `servidor externo ${externalBase}` : "next dev (arrancado pelo script)",
      serverLogStats: serverStats,
      note: "Variáveis de ambiente fictícias; valores de .env.local não são usados nem gravados.",
    },
    configs: Object.fromEntries(
      names.map((n) => [
        n,
        {
          description: configs[n].description,
          env: Object.fromEntries(
            Object.entries(configs[n].env).map(([k, v]) => [
              k,
              v === "" ? "<em falta>" : k === "OAUTH_ALLOWED_ORIGIN" || k === "GITHUB_OAUTH_CLIENT_ID" ? v : `<fictício len=${v.length}>`,
            ])
          ),
        },
      ])
    ),
    results,
  };
  writeFileSync(resolve(out), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`Gravado: ${resolve(out)}`);
}

function cmdCompare() {
  const [, , , a, b] = process.argv;
  const A = JSON.parse(readFileSync(a, "utf8")).results;
  const B = JSON.parse(readFileSync(b, "utf8")).results;
  const flat = (R) => Object.fromEntries(Object.entries(R).flatMap(([cfg, list]) => list.map((r) => [`${cfg}/${r.id}`, r])));
  const fa = flat(A);
  const fb = flat(B);
  let diffs = 0;
  for (const key of [...new Set([...Object.keys(fa), ...Object.keys(fb)])].sort()) {
    const x = JSON.stringify(fa[key] ?? null, null, 2);
    const y = JSON.stringify(fb[key] ?? null, null, 2);
    if (x === y) {
      console.log(`IGUAL      ${key}`);
    } else {
      diffs++;
      console.log(`DIFERENTE  ${key}`);
      for (const f of ["status", "headers", "setCookie", "body"]) {
        const p = JSON.stringify(fa[key]?.[f]);
        const q = JSON.stringify(fb[key]?.[f]);
        if (p !== q) console.log(`   ${f}:\n     antes:  ${p}\n     depois: ${q}`);
      }
    }
  }
  console.log(diffs ? `\n${diffs} caso(s) com diferenças.` : "\nSem diferenças.");
  process.exit(diffs ? 1 : 0);
}

const cmd = process.argv[2];
if (cmd === "run") {
  cmdRun().catch((e) => {
    console.error(e);
    process.exit(2);
  });
} else if (cmd === "compare") {
  cmdCompare();
} else {
  console.log("Uso: node characterize-auth.mjs run --out <f.json> [--port 3000] | compare <antes.json> <depois.json>");
  process.exit(2);
}
