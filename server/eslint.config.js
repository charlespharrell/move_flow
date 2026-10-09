import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'

// Scoped to server/ so the root config's browser globals and React rules do not
// apply to Node/Express code.
export default defineConfig([
  globalIgnores(['node_modules', 'prisma/migrations']),
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
])