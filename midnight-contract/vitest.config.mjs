/** @type {import('vitest/config').UserConfig} */
export default {
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/managed/**', '**/dist/**'],
    environment: 'node',
  },
};
