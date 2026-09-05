import { z } from "zod";

export const publicEnvSchema = z.object({
  apiUrl: z.url(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
