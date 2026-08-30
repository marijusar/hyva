import { z } from "zod";

const syncPlansEnvSchema = z.object({
  STRIPE_PRICE_STARTER: z.string().min(1),
  STRIPE_PRICE_GROWTH: z.string().min(1),
  STRIPE_PRICE_SCALE: z.string().min(1),
});

export const syncPlansEnv = syncPlansEnvSchema.parse(process.env);
