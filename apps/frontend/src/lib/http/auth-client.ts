import type { HttpResult } from "./types";

// Client-side auth calls (browser components). Relies on the browser's
// own cookie jar via `credentials: "include"` — no manual cookie
// forwarding needed here, unlike the server-side counterpart.
export class AuthClient {
  static async logout(): Promise<HttpResult<{ message?: string }>> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: res.ok, status: res.status, data };
  }
}
