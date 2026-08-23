import { z } from "zod";

const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MS: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL_MS: z.coerce.number().int().positive(),
});

export const authEnv = authEnvSchema.parse(process.env);
