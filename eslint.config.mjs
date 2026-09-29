import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Flat config (ESLint 9) equivalente ao antigo `.eslintrc.json` com
// `next/core-web-vitals`, mais as regras TypeScript de `eslint-config-next`.
// Segue o formato documentado em node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Ignores por omissão de eslint-config-next (repostos porque globalIgnores os substitui).
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    // Versão alternativa do site estático usada apenas como referência.
    'AvaliacaoAgroTrades/**',
    // Site estático antigo na raiz (legado, a remover noutra tarefa).
    'js/**',
    'css/**',
    '*.html',
    // Worktrees de agentes Claude (incluem .next/ e node_modules/ próprios).
    '.claude/**',
    // TinaCMS (task-017): tipos/queries gerados e admin gerado em public/.
    'tina/__generated__/**',
    'public/admin/**',
  ]),
])

export default eslintConfig
