import { z } from "zod";

export class UserSchemas {
  static readonly register = z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
  });

  static readonly login = z.object({
    email: z.email(),
    password: z.string().min(1),
  });
}
