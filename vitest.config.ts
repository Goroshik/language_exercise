import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      // istanbul, not v8: the v8 provider reports arrow functions as
      // "(anonymous_N)", which crap4ts cannot match back to a function.
      provider: 'istanbul',
      // `json` is what crap4ts reads (coverage/coverage-final.json).
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/generated/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        // Next.js entry points - routing/layout shells with no logic of their own.
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx'
      ]
    }
  }
});
