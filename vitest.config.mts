import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Domain logic (money/stock math) is pure and IO-free, so it runs in a plain
// node environment. See CLAUDE.md §9 (testing) and §4 (business logic).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
