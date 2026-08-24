import { z } from "zod";

export class StoreSchemas {
  static readonly subscribe = z.object({
    domain: z.string().min(1),
  });
}
