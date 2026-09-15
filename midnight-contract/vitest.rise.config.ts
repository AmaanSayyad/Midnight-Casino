import { defineConfig } from 'vitest/config';

/** Rise In privacy-gate suite — run from midnight-contract: `npx vitest run --config vitest.rise.config.ts` */
export default defineConfig({
  test: {
    include: ['../tests/**/*.test.ts'],
    environment: 'node',
  },
});
