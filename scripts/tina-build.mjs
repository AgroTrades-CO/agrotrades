// Passo TinaCMS do `npm run build` (task-017-tina-cms-adoption, architecture.md 4.1).
//
// Fase 3: a Tina NÃO é construída em nenhum ambiente — nem Production. O
// admin só existe em modo local (`npm run tina:dev`). Este passo garante que
// public/admin/ não existe antes do `next build`, para nunca servir um admin
// antigo gerado localmente (o build do site segue normalmente).
//
// Fase 4 (depois da confirmação humana): em Production com
// TINA_PUBLIC_CLIENT_ID corre `tinacms build --skip-cloud-checks --noTelemetry`;
// em Production sem ele o build falha; nos restantes casos fica como hoje.
//
// Só regista no log se a Tina foi ou não construída (nunca valores de variáveis).
import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const adminDir = join(process.cwd(), "public", "admin");
if (existsSync(adminDir)) {
  rmSync(adminDir, { recursive: true, force: true });
  console.log("[tina-build] public/admin/ removido (admin local não vai para o build).");
}
console.log("[tina-build] TinaCMS não construída neste build (fase 3: só modo local).");
