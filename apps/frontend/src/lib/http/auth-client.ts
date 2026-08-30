import { z } from "zod";
import type { HttpResult } from "./types";

const errorBodySchema = z.object({ error: z.string() }).partial();
const logoutResponseSchema = z.object({ message: z.string() });

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

// Client-side auth calls (browser components). Relies on the browser's
// own cookie jar via `credentials: "include"` — no manual cookie
// forwarding needed here, unlike the server-side counterpart.
export class AuthClient {
  static async logout(): Promise<HttpResult<LogoutResponse>> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: errorBodySchema.safeParse(json).data?.error ?? null, code: null };
    }
    return { ok: true, status: res.status, data: logoutResponseSchema.parse(json), error: null, code: null };
  }
}
