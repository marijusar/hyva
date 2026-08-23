import { z } from "zod";

const loggingEnvSchema = z.object({
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"]),
  LOG_FORMAT: z.enum(["pretty", "json"]),
});

export const loggingEnv = loggingEnvSchema.parse(process.env);
