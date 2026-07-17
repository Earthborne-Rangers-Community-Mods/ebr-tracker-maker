import { defineConfig } from "vitest/config";

// Unit tests cover pure logic (packages under src/lib). They do not need the
// SvelteKit plugin - loading it here fails under Vitest - so this config runs
// the tests standalone. Vitest prefers this file over vite.config.js.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
