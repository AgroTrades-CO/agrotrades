// Arranca a TinaCMS em MODO LOCAL (task-017-tina-cms-adoption, fase 3).
//
//   npm run tina:dev   ->  admin em http://localhost:<TINA_NEXT_PORT>/admin
//
// - `tinacms dev` serve a API GraphQL em http://localhost:<TINA_LOCAL_PORT>,
//   que lê e grava diretamente os ficheiros JSON de content/ (sem Tina Cloud,
//   sem login, sem credenciais), e gera public/admin/ (fora do Git).
// - O Next.js corre em `next dev` na porta TINA_NEXT_PORT; a pré-visualização
//   editável fica em /editor-preview (Draft Mode ligado por /api/editor-preview,
//   que só existe em `next dev`).
// - Portas por omissão: Next 3100, API 4001, datalayer 9000 (as da Tina).
//   Mudar com TINA_NEXT_PORT, TINA_LOCAL_PORT e TINA_DATALAYER_PORT quando
//   estiverem ocupadas. TINA_LOCAL_PORT também é lida por next.config.mjs
//   (CSP do admin local) e por lib/tina/client.ts.
// - Telemetria desligada (--noTelemetry).
//
// Sem shell: a CLI da Tina corre com o mesmo Node (process.execPath) e cada
// argumento vai separado; as portas são validadas como números.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const port = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (!/^[0-9]{2,5}$/.test(value)) {
    console.error(`${name} inválida: "${value}" (tem de ser um número de porta)`);
    process.exit(1);
  }
  return value;
};

const nextPort = port("TINA_NEXT_PORT", "3100");
const apiPort = port("TINA_LOCAL_PORT", "4001");
const datalayerPort = port("TINA_DATALAYER_PORT", "9000");

const require = createRequire(import.meta.url);
const cliBin = join(dirname(require.resolve("@tinacms/cli/package.json")), "bin", "tinacms");
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(
  process.execPath,
  [
    cliBin,
    "dev",
    "--noTelemetry",
    "--port",
    apiPort,
    "--datalayer-port",
    datalayerPort,
    // A CLI da Tina corre este comando depois de a API local estar pronta.
    "-c",
    `"${process.execPath}" "${nextBin}" dev --port ${nextPort}`,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, TINA_LOCAL_PORT: apiPort },
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
