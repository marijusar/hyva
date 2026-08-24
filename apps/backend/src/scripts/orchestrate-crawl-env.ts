import { z } from "zod";

const orchestrateCrawlEnvSchema = z.object({
  CRAWL_BATCH_SIZE: z.coerce.number().int().positive(),
  CRAWL_STALE_AFTER_MS: z.coerce.number().int().positive(),
});

export const orchestrateCrawlEnv = orchestrateCrawlEnvSchema.parse(process.env);
