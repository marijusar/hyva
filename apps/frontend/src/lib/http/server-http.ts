import { cookies } from "next/headers";
import { parse as parseSetCookies } from "set-cookie-parser";
import type { HttpResult } from "./types";

// Fetch mechanics shared by every server-side HTTP call class in this
// directory (e.g. AuthServer). Not meant to be called directly from
// pages/actions — each domain class (AuthServer.login(), .me(), ...)
// encapsulates its own endpoint, method, and body shape; this only
// carries the plumbing they all need: forwarding the incoming request's
// cookies to the backend, and forwarding the backend's Set-Cookie
// response headers onto Next's outgoing cookie store (a server-side
// fetch has no browser cookie jar to do either automatically).
//
// Uses INTERNAL_API_URL, not NEXT_PUBLIC_API_URL: this fetch runs on the
// server (inside the frontend's own container in dev), where the
// browser-facing `localhost:8090` doesn't reach the backend container —
// only the Docker-network hostname (`http://backend:8080`) does.
export class ServerHttp {
  static async get<T>(path: string): Promise<HttpResult<T>> {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.INTERNAL_API_URL}${path}`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  }

  static async post<T>(path: string, body: unknown): Promise<HttpResult<T>> {
    const res = await fetch(`${process.env.INTERNAL_API_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    await ServerHttp.forwardSetCookies(res);
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  }

  private static async forwardSetCookies(res: Response): Promise<void> {
    const rawSetCookies = res.headers.getSetCookie();
    if (rawSetCookies.length === 0) return;

    const cookieStore = await cookies();
    for (const cookie of parseSetCookies(rawSetCookies)) {
      cookieStore.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        path: cookie.path ?? "/",
        maxAge: cookie.maxAge,
        sameSite: ServerHttp.parseSameSite(cookie.sameSite),
      });
    }
  }

  private static parseSameSite(raw: string | undefined): "lax" | "strict" | "none" | undefined {
    const value = raw?.toLowerCase();
    if (value === "lax" || value === "strict" || value === "none") return value;
    return undefined;
  }
}
