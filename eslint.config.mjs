import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Flat config (ESLint 9) equivalente ao antigo `.eslintrc.json` com
// `next/core-web-vitals`, mais as regras TypeScript de `eslint-config-next`.
// Segue o formato documentado em node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md.
// R-VIEW (task-017, architecture.md 18.1.5): o bundle das páginas públicas só
// fica igual se nenhum módulo que também corre no browser da pré-visualização
// da TinaCMS importar VALORES de @/content (o Zod e o conteúdo validado) ou de
// lib/. Tipos só na forma `import type { … }` (a forma `import { type X }`
// pode virar um import de efeito lateral). No flat config a mesma regra em dois
// blocos não se junta — o último ganha —, por isso cada conjunto de ficheiros
// tem o seu bloco completo.
const MSG_VISTA =
  'R-VIEW (architecture.md 18.1): uma vista só recebe dados por props; valores de @/content, lib/ e da Tina ficam no invólucro de servidor ou em lib/view-data/*. Tipos: `import type`.'
const MSG_PREVIEW =
  'R-VIEW (architecture.md 18.1): a pré-visualização recebe o conteúdo publicado por props da página de servidor; não importar valores de @/content nem de lib/. Tipos: `import type`.'
const MSG_DERIVE =
  'R-VIEW (architecture.md 18.1): content/derive.ts corre no browser; só `import type` (nunca Zod, JSON, ./schemas ou ./index como valor).'

const conteudoOuLib = (message) => [
  // @/content e @/content/* exceto @/content/derive (as derivações puras).
  { regex: '^@/content(/(?!derive$).*)?$', allowTypeImports: true, message },
  { group: ['@/lib/*', '@/lib/**'], message },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['components/**/*View.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            ...conteudoOuLib(MSG_VISTA),
            { group: ['tinacms', 'tinacms/*', '@/components/tina/normalize'], message: MSG_VISTA },
          ],
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  {
    files: ['components/tina/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: conteudoOuLib(MSG_PREVIEW) }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  {
    files: ['content/derive.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: './schemas', allowTypeImports: true, message: MSG_DERIVE },
            { name: './index', allowTypeImports: true, message: MSG_DERIVE },
            { name: '.', allowTypeImports: true, message: MSG_DERIVE },
            { name: 'zod', allowTypeImports: true, message: MSG_DERIVE },
          ],
          patterns: [{ group: ['*.json'], allowTypeImports: true, message: MSG_DERIVE }],
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  globalIgnores([
    // Ignores por omissão de eslint-config-next (repostos porque globalIgnores os substitui).
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    // Worktrees de agentes Claude (incluem .next/ e node_modules/ próprios).
    '.claude/**',
    // TinaCMS (task-017): tipos/queries gerados e admin gerado em public/.
    'tina/__generated__/**',
    'public/admin/**',
  ]),
])

export default eslintConfig
