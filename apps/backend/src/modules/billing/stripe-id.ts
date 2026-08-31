import { z } from "zod";

// Stripe payload fields are typed as `string | { id: string }` depending on
// whether the object was expanded — this normalizes either shape to the id.
export const stripeIdSchema = z
  .union([z.string(), z.object({ id: z.string() })])
  .transform((value) => (typeof value === "string" ? value : value.id));

export const nullableStripeIdSchema = stripeIdSchema.nullable();
