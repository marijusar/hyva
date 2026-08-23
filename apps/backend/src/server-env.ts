import { z } from "zod";

const serverEnvSchema = z.object({
  PORT: z.coerce.number().int().positive(),
});

export const serverEnv = serverEnvSchema.parse(process.env);
