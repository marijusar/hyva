import { ServerHttp } from "./server-http";
import type { HttpResult } from "./types";

export interface Me {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// Server-side auth calls (server components + server actions). Each
// method encapsulates one backend endpoint, so callers never build a
// path/body by hand.
export class AuthServer {
  static async login(email: string, password: string): Promise<HttpResult<{ error?: string }>> {
    return ServerHttp.post("/auth/login", { email, password });
  }

  static async register(email: string, password: string): Promise<HttpResult<{ error?: string }>> {
    return ServerHttp.post("/auth/register", { email, password });
  }

  static async me(): Promise<HttpResult<Me>> {
    return ServerHttp.get("/auth/me");
  }
}
