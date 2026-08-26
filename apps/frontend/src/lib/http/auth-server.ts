import { z } from "zod";
import { ServerHttp } from "./server-http";
import type { HttpResult } from "./types";

const meSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.string(),
});

const loginResponseSchema = z.object({ message: z.string() });
const registerResponseSchema = z.object({ id: z.string(), email: z.string(), name: z.string().nullable() });

export type Me = z.infer<typeof meSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// Server-side auth calls (server components + server actions). Each
// method encapsulates one backend endpoint, its body shape, and its
// response schema, so callers never build a path/body/cast by hand.
export class AuthServer {
  static async login(email: string, password: string): Promise<HttpResult<LoginResponse>> {
    return ServerHttp.post("/auth/login", { email, password }, loginResponseSchema);
  }

  static async register(email: string, password: string): Promise<HttpResult<RegisterResponse>> {
    return ServerHttp.post("/auth/register", { email, password }, registerResponseSchema);
  }

  static async me(): Promise<HttpResult<Me>> {
    return ServerHttp.get("/auth/me", meSchema);
  }
}
