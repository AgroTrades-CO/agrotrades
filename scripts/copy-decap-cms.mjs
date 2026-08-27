// Copia o bundle pré-compilado do Decap CMS (dependência npm `decap-cms`,
// versão EXATA fixada em package.json/package-lock.json — restrição 36 da
// arquitetura, SEC-05 do security-engineer) de `node_modules/decap-cms/dist`
// para `public/admin/vendor/decap-cms/`, para ser servido pelo Next.js a
// partir do PRÓPRIO domínio — nunca de um CDN de terceiros (unpkg, jsdelivr,
// etc.).
//
// Corre em `postinstall`, `predev` e `prebuild` (ver package.json). Os
// ficheiros copiados NÃO são commitados (public/admin/vendor/ está no
// .gitignore): são sempre regenerados, de forma determinística, a partir da
// versão exata fixada no lockfile — o que É a garantia de integridade aqui,
// e evita commitar ~30 MB de bundle de terceiros no repositório público.
//
// Só copia `decap-cms.js` e os seus chunks numerados (`<n>.decap-cms.js`),
// nunca os ficheiros `.map` (não necessários em produção, reduzem o
// tamanho do deploy) nem os chunks duplicados `*.cms.js` (alias legado do
// pacote que `decap-cms.js` nunca referencia — confirmado por inspeção do
// bundle).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const SRC_DIR = join(projectRoot, "node_modules", "decap-cms", "dist");
const DEST_DIR = join(projectRoot, "public", "admin", "vendor", "decap-cms");
const VENDOR_DIR = join(projectRoot, "public", "admin", "vendor");

// Traduções pt do próprio interface do Decap (botões "Guardar"/"Publicar",
// mensagens de erro, etc. — os RÓTULOS dos campos já vinham de config.yml,
// isto traduz o resto da UI). `decap-cms-locales` é dependência transitiva
// de `decap-cms` (fixada no lockfile, não precisa de entrada própria em
// package.json). Gerado, tal como o bundle principal — nunca commitado.
const LOCALE_SRC = join(projectRoot, "node_modules", "decap-cms-locales", "dist", "esm", "pt", "index.js");
const LOCALE_DEST = join(VENDOR_DIR, "locale-pt.js");

if (!existsSync(SRC_DIR)) {
  console.error(
    `[copy-decap-cms] Não encontrei ${SRC_DIR}. A dependência "decap-cms" (versão exata) tem de estar instalada (npm install) antes de "next dev"/"next build".`
  );
  process.exit(1);
}

// Ficheiro de entrada principal e o seu ficheiro de licença (obrigatório
// preservar, é software de terceiros).
const REQUIRED_FILES = ["decap-cms.js", "decap-cms.js.LICENSE.txt"];

// Chunks numerados que decap-cms.js carrega em runtime (code splitting do
// webpack), nunca os `.map` nem os `*.cms.js` duplicados.
const CHUNK_PATTERN = /^\d+\.decap-cms\.js$/;

rmSync(DEST_DIR, { recursive: true, force: true });
mkdirSync(DEST_DIR, { recursive: true });

let copied = 0;
for (const file of REQUIRED_FILES) {
  const src = join(SRC_DIR, file);
  if (!existsSync(src)) {
    console.error(`[copy-decap-cms] Ficheiro obrigatório em falta no pacote decap-cms: ${file}`);
    process.exit(1);
  }
  copyFileSync(src, join(DEST_DIR, file));
  copied += 1;
}

for (const file of readdirSync(SRC_DIR)) {
  if (CHUNK_PATTERN.test(file)) {
    copyFileSync(join(SRC_DIR, file), join(DEST_DIR, file));
    copied += 1;
  }
}

if (existsSync(LOCALE_SRC)) {
  const esm = readFileSync(LOCALE_SRC, "utf8");
  // O ficheiro fonte é `const pt = {...}; export default pt;` — troca-se o
  // `export default` (só válido em módulos ES) por um registo direto no
  // objeto `CMS` global que o bundle principal expõe ao carregar.
  const script = `${esm.replace(/export default pt;\s*$/, "")}\nif (typeof CMS !== "undefined") { CMS.registerLocale("pt", pt); }\n`;
  writeFileSync(LOCALE_DEST, script);
  copied += 1;
} else {
  console.warn(`[copy-decap-cms] Não encontrei ${LOCALE_SRC} — a interface do admin fica em inglês.`);
}

console.log(`[copy-decap-cms] ${copied} ficheiros copiados para public/admin/vendor/ (self-hosted, versão exata do package.json).`);
