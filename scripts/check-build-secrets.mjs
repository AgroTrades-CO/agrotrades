// Varrimento de segredos no resultado do build.
// Corre depois do `next build`: falha o build se o valor literal de alguma
// variável de Production não pública aparecer em JavaScript/HTML servido ao
// browser — public/admin/** (admin da TinaCMS) ou .next/static/** (bundles do
// site). Nunca imprime o valor, só o nome da variável e o ficheiro.
//
// Variáveis sem valor (Preview, CI, local) não são verificadas.
// CONTACT_RECIPIENT_EMAIL não é segredo: se o mesmo endereço já
// estiver publicado em content/ (ex.: lista de emails de contacto), a sua
// presença no bundle não é uma fuga e não é verificado.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const NAMES = ["TINA_TOKEN", "RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "CONTACT_RECIPIENT_EMAIL"];
const DIRS = [join(root, "public", "admin"), join(root, ".next", "static")];
const MIN_LENGTH = 8; // valores curtos dariam falsos positivos

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
      )
    : [];

const contentText = walk(join(root, "content"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

const secrets = [];
for (const name of NAMES) {
  const value = process.env[name]?.trim();
  if (!value || value.length < MIN_LENGTH) continue;
  if (name === "CONTACT_RECIPIENT_EMAIL" && contentText.includes(value)) continue;
  secrets.push({ name, value });
}

if (secrets.length === 0) {
  console.log("[check-build-secrets] nenhuma variável de Production não pública definida; nada a verificar.");
  process.exit(0);
}

const files = DIRS.flatMap(walk).filter((f) => /\.(js|mjs|cjs|html|json|css|map|txt)$/i.test(f));
const leaks = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const { name, value } of secrets) {
    if (text.includes(value)) leaks.push(`${name} em ${relative(root, file)}`);
  }
}

if (leaks.length) {
  console.error("[check-build-secrets] valor de variável de Production encontrado em ficheiros servidos ao browser:");
  for (const l of leaks) console.error(`  - ${l}`);
  process.exit(1);
}
console.log(
  `[check-build-secrets] ${secrets.map((s) => s.name).join(", ")}: nenhum valor encontrado em ${files.length} ficheiros.`
);
