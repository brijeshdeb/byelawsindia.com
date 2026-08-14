// tests/setup.ts
//
// Global Vitest setup — referenced in vitest.config.ts setupFiles.
// Runs before every test file in every environment (jsdom and node).
//
// jsdom tests (React components): jest-dom matchers are registered below.
// node tests (isolation/integration): nothing needed here — env vars are
//   loaded from .env.local automatically by Vitest.

// @testing-library/jest-dom adds custom matchers like toBeInTheDocument(),
// toBeVisible(), etc. These matchers extend expect() from vitest.
// The import is safe in node environments — it checks for DOM availability
// internally before registering matchers that require a DOM.
import "@testing-library/jest-dom/vitest";
