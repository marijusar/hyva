import { z } from "zod";

const queueEnvSchema = z.object({
  RABBITMQ_URL: z.url(),
});

export const queueEnv = queueEnvSchema.parse(process.env);
