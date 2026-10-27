import { defineProject } from 'vitest/config';

export default defineProject({
  root: import.meta.dirname,
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
  },
  test: {
    name: 'web',
    include: ['src/**/*.test.ts'],
  },
});
