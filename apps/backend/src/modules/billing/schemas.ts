import { z } from "zod";

export class BillingSchemas {
  static readonly checkout = z.object({
    planSlug: z.string().min(1),
  });
}
