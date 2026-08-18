/**
 * ROOT MIDDLEWARE — DELETED IN FAVOR OF src/middleware.ts
 *
 * This file should not exist. Next.js picks up the root middleware.ts
 * over src/middleware.ts. The canonical middleware lives at src/middleware.ts.
 *
 * This stub passes all requests through so it does not interfere.
 * Run: git rm middleware.ts && git commit -m "fix: remove duplicate root middleware"
 */
export { middleware, config } from "./src/middleware";
