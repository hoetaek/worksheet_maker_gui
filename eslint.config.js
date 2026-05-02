import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const tsFiles = ['src/**/*.{ts,tsx}', 'vite.config.ts'];
const typeCheckedTypeScriptConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: config.files ?? tsFiles,
}));

export default tseslint.config(
  {
    files: ['eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
  },
  {
    ignores: [
      'build/',
      'dist/',
      'node_modules/',
      'coverage/',
      '*.spec',
      '*.docx',
      '*.pptx',
      '*.ico',
      'poetry.lock',
      'package-lock.json',
    ],
  },
  js.configs.recommended,
  ...typeCheckedTypeScriptConfigs,
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: tsFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
  },
);
