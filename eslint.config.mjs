import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Ignore patterns - expanded for better performance
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      // Separate git worktrees checked out by tooling - not this project's sources.
      '.claude/**',
      // Stryker copies the whole project into its sandbox while mutating.
      '.stryker-tmp/**',
      'reports/**',
      '.react-router',
      '.next',
      'out',
      'src/generated/**',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      'next-env.d.ts',
      // Additional ignores for performance
      '**/*.md',
      '**/*.json',
      'docker-compose*.yml',
      'Dockerfile',
      '.git',
      '.vscode',
      'coverage',
      '.turbo',
      '*.log',
      'public/**'
    ]
  },
  // Base JavaScript config
  js.configs.recommended,
  // TypeScript and React configuration
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        // Type-aware linting: required by rules like no-floating-promises.
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        location: 'readonly',
        history: 'readonly',
        // HTML Elements
        HTMLElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        CustomEvent: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // Web APIs
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        ReadableStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortController: 'readonly',
        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // React
        React: 'readonly',
        JSX: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettier
    },
    rules: {
      // Extend recommended configs
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,

      // Prettier integration - disabled for performance
      // Run prettier separately: npm run format
      // 'prettier/prettier': 'off',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // React Hooks rules - relaxed to allow manual dependency management
      'react-hooks/rules-of-hooks': 'error', // Still enforce hooks rules
      'react-hooks/exhaustive-deps': 'off', // Allow manual control of dependencies

      // React Compiler rules, new in eslint-plugin-react-hooks v6. They flag 56
      // pre-existing spots; kept as warnings until those are addressed separately.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/incompatible-library': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Type-aware: catches unawaited promises that silently swallow rejections.
      '@typescript-eslint/no-floating-promises': 'error',

      // Complexity budget - the quality gate proper.
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],

      // General rules
      'no-console': 'off',
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  // Node scripts: same rules, but they run in Node rather than the browser.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly'
      }
    }
  },
  // Test files keep every correctness rule. Only the function-size budget is
  // lifted: a `describe` callback is a namespace holding many small cases, not
  // a 200-line function, and counting it would punish adding test cases.
  // Complexity, depth and param limits still apply.
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines-per-function': 'off'
    }
  }
];
