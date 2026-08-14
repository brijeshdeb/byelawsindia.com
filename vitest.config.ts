import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vitest does not auto-load .env.local (that's a Next.js convention).
// loadEnv reads: .env, .env.local, .env.test, .env.test.local
// Passing '' as the prefix loads ALL variables, not just VITE_-prefixed ones.
const env = loadEnv("test", process.cwd(), "");

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom for React component tests; node for integration/isolation tests
    environment: "jsdom",
    environmentMatchGlobs: [
      // Isolation tests hit real Supabase — they don't need DOM APIs
      ["tests/isolation/**", "node"],
    ],
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    // Inject .env.local vars into the test process.env
    env,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "tests/**",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
    // Integration tests that hit real Supabase need extra time
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
