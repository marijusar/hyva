import { z } from "zod";

const dbEnvSchema = z.object({
  DATABASE_URL: z.url(),
});

export const dbEnv = dbEnvSchema.parse(process.env);
