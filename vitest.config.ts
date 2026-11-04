import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    server: {
      deps: {
        external: ['postgres']
      }
    },
    environmentMatchGlobs: [
      ['apps/web/**', 'jsdom'],
      ['**', 'node']
    ]
  }
});
