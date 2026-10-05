// Guarda de build das imagens: falha o build se
// algum caminho de imagem em content/**/*.json não corresponder a um ficheiro
// existente em public/.
//
// Porquê: em modo cloud a TinaCMS reescreve, ao gravar, valores de campos
// `image` fora de mediaRoot para /images/uploads/<caminho original> (caminho
// inexistente) e o Zod (`localImagePath`) aceita-o. Sem esta guarda, uma
// gravação publicaria imagens partidas; com ela, o build falha e o deploy
// anterior fica no ar. Fica fora de content/schemas (esse módulo vai para o
// bundle do cliente).
//
// Caminho de imagem = qualquer string que comece por "/images/" (é o único
// formato que o Zod aceita para imagens de conteúdo e para meta.ogImage).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const root = process.cwd();
const contentDir = join(root, "content");
const publicDir = resolve(root, "public");

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".json") ? [join(dir, e.name)] : []
  );

const problems = [];
let checked = 0;

const visit = (value, file, pointer) => {
  if (typeof value === "string") {
    if (!value.startsWith("/images/")) return;
    checked++;
    const target = resolve(publicDir, "." + decodeURIComponent(value));
    let ok = target.startsWith(publicDir + sep);
    if (ok) {
      try {
        ok = statSync(target).isFile();
      } catch {
        ok = false;
      }
    }
    if (!ok) problems.push(`${relative(root, file)} ${pointer}: "${value}" não existe em public/`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => visit(v, file, `${pointer}/${i}`));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) visit(v, file, `${pointer}/${k}`);
  }
};

for (const file of walk(contentDir)) {
  visit(JSON.parse(readFileSync(file, "utf8")), file, "");
}

if (problems.length) {
  console.error(`[check-content-images] ${problems.length} caminho(s) de imagem inexistente(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`[check-content-images] ${checked} caminhos de imagem verificados, todos existem em public/.`);
