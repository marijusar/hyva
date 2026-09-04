import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globalSetup: ["./test/global-setup.ts"],
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 15000,
    env: {
      // Each env module (db/env.ts, auth/env.ts, ...) validates its own
      // schema eagerly on import — this is the superset every test file in
      // the run might import transitively, even though tests build their db
      // via TestDatabase (testcontainers), not DATABASE_URL.
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/unused",
      PORT: "8080",
      JWT_SECRET: "test-only-secret-not-for-real-use-32-plus-chars",
      ACCESS_TOKEN_TTL_MS: "900000",
      REFRESH_TOKEN_TTL_MS: "2592000000",
      RABBITMQ_URL: "amqp://guest:guest@localhost:5672",
      HOMEPAGE_WORKER_CONCURRENCY: "5",
      TECHNOLOGY_EVENT_WORKER_CONCURRENCY: "5",
      CRAWL_BATCH_SIZE: "100",
      CRAWL_STALE_AFTER_MS: "604800000",
      STRIPE_SECRET_KEY: "sk_test_placeholder",
      STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
      FRONTEND_URL: "http://localhost:3000",
      LOG_LEVEL: "silent",
      LOG_FORMAT: "json",
    },
  },
});
