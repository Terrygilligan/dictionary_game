import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for pure unit tests of Decider/Evolver functions.
 * 
 * This configuration ensures:
 * - No Firebase initialization or network calls
 * - Node environment (no jsdom overhead)
 * - Excludes server-side infrastructure (admin/, functions/)
 * - Fast execution (< 1 second target)
 * - Pure, synchronous tests only
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.unit.spec.ts', '**/*.unit.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.svn',
      '.archive',
      'admin',
      'functions',
      '**/show-integration-logs.spec.ts',
    ],
    // No setupFiles - keep tests pure and self-contained
    css: false,
    // Fast test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Ensure no accidental imports of Firebase
    coverage: {
      exclude: [
        'admin/**',
        'functions/**',
        'node_modules/**',
        'dist/**',
        '**/*.unit.spec.ts',
      ],
    },
  },
})
