import { z } from "zod";

const homepageWorkerEnvSchema = z.object({
  HOMEPAGE_WORKER_CONCURRENCY: z.coerce.number().int().positive(),
});

export const homepageWorkerEnv = homepageWorkerEnvSchema.parse(process.env);
