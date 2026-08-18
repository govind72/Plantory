import { defineConfig } from "vitest/config";
import path from "node:path";

// Integration tests hit the LOCAL Supabase stack (needs `npm run db:start`).
// Kept separate from the fast, DB-free unit tests in `vitest.config.mts`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 90000,
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
});
