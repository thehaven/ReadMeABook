/**
 * Component: Test Runner Configuration
 * Documentation: documentation/README.md
 */

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-dom/test-utils': path.resolve(__dirname, 'tests/mocks/react-dom-test-utils.ts'),
    },
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/components/**', 'jsdom'],
      ['tests/app/**', 'jsdom'],
    ],
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/generated/**',
        'src/**/*.d.ts',
        'src/**/types/**',
        'src/**/types.ts',
        'src/**/index.ts',
      ],
    },
  },
});
