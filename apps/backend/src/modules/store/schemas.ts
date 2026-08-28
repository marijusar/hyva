import { z } from "zod";

export class StoreSchemas {
  static readonly subscribe = z.object({
    domain: z.string().min(1),
  });

  static readonly search = z.object({
    q: z.string().trim().min(1),
  });
}
