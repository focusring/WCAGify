import { defineConfig } from 'oxlint'

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    style: 'warn'
  },
  plugins: ['typescript', 'import', 'unicorn', 'vue'],
  rules: {
    'sort-keys': 'off',
    'sort-imports': 'off',
    'id-length': 'off',
    'no-magic-numbers': 'off',
    'no-continue': 'off',
    'no-ternary': 'off',
    'no-undefined': 'off',
    'func-style': 'off',
    curly: 'off',
    'max-statements': 'off',
    'max-lines-per-function': 'off',
    'unicorn/filename-case': 'off',
    'no-duplicate-imports': 'off',
    'import/no-anonymous-default-export': 'off',
    'import/no-named-export': 'off',
    'import/no-nodejs-modules': 'off',
    'import/prefer-default-export': 'off',
    'vue/define-props-destructuring': 'off'
  },
  ignorePatterns: ['.nuxt/', 'node_modules/', '.output/', 'dist/', 'shims/', '**/test/']
})
