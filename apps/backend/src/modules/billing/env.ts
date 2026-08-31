import { z } from "zod";

const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  FRONTEND_URL: z.url(),
});

export const billingEnv = billingEnvSchema.parse(process.env);
