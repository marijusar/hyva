import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/global-setup.ts"],
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 15000,
    env: {
      // env.ts validates the whole schema eagerly on import, even though
      // tests build their db via TestDatabase (testcontainers), not
      // DATABASE_URL — these just need to satisfy the schema.
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/unused",
      PORT: "8080",
      JWT_SECRET: "test-only-secret-not-for-real-use-32-plus-chars",
      ACCESS_TOKEN_TTL_MS: "900000",
      REFRESH_TOKEN_TTL_MS: "2592000000",
    },
  },
});
