import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive(),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MS: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL_MS: z.coerce.number().int().positive(),
});

// Parsed once at import time — fails fast on missing/invalid config instead
// of silently falling back to a default. Import `env` everywhere instead of
// touching `process.env` directly.
export const env = envSchema.parse(process.env);
