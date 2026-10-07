// Passo TinaCMS do `npm run build`.
//
// O admin da Tina Cloud (/admin) só é construído em Production
// (VERCEL_ENV=production). Aí o TINA_PUBLIC_CLIENT_ID é obrigatório: sem ele o
// build falha, para nunca publicar um site sem admin por engano. Nos restantes
// ambientes (Preview, CI, build local) a Tina não é construída e public/admin/
// é removido antes do `next build`, para nunca servir um admin antigo gerado
// localmente pelo `npm run tina:dev`.
//
// O TINA_TOKEN nunca é passado à CLI da Tina: a CLI escreve-o literalmente no
// cliente gerado e no JS do admin. A `--skip-cloud-checks` evita que
// o build dependa da disponibilidade da Tina Cloud.
//
// Só regista no log se a Tina foi ou não construída (nunca valores de variáveis).
import { spawnSync } from "node:child_process";
import { rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const adminDir = join(process.cwd(), "public", "admin");
if (existsSync(adminDir)) {
  rmSync(adminDir, { recursive: true, force: true });
  console.log("[tina-build] public/admin/ removido antes do build.");
}

if (process.env.VERCEL_ENV !== "production") {
  console.log("[tina-build] TinaCMS não construída neste build (só em Production).");
  process.exit(0);
}

if (!process.env.TINA_PUBLIC_CLIENT_ID?.trim()) {
  console.error("[tina-build] TINA_PUBLIC_CLIENT_ID em falta em Production: o admin não pode ser construído.");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const cliBin = join(dirname(require.resolve("@tinacms/cli/package.json")), "bin", "tinacms");

// Sem shell e sem o token: a CLI corre com o ambiente do build menos TINA_TOKEN.
// TINA_PUBLIC_NO_PREVIEW desliga a pré-visualização no admin (tina/collections.ts).
const env = { ...process.env, NODE_ENV: "production", TINA_PUBLIC_NO_PREVIEW: "1" };
delete env.TINA_TOKEN;
const result = spawnSync(process.execPath, [cliBin, "build", "--skip-cloud-checks", "--noTelemetry"], {
  stdio: "inherit",
  env,
});
if (result.status !== 0) {
  console.error("[tina-build] `tinacms build` falhou.");
  process.exit(result.status ?? 1);
}
console.log("[tina-build] admin da TinaCMS construído em public/admin/ (Production).");
