import { z } from "zod";

const technologyEventWorkerEnvSchema = z.object({
  TECHNOLOGY_EVENT_WORKER_CONCURRENCY: z.coerce.number().int().positive(),
});

export const technologyEventWorkerEnv = technologyEventWorkerEnvSchema.parse(process.env);
