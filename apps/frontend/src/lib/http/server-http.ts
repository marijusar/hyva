import { cookies } from "next/headers";
import { parse as parseSetCookies } from "set-cookie-parser";
import { z } from "zod";
import type { HttpResult } from "./types";

const errorBodySchema = z.object({ error: z.string() }).partial();

// Fetch mechanics shared by every server-side HTTP call class in this
// directory (e.g. AuthServer). Not meant to be called directly from
// pages/actions — each domain class (AuthServer.login(), .me(), ...)
// encapsulates its own endpoint, method, body shape, and response schema;
// this only carries the plumbing they all need: forwarding the incoming
// request's cookies to the backend, forwarding the backend's Set-Cookie
// response headers onto Next's outgoing cookie store (a server-side
// fetch has no browser cookie jar to do either automatically), and
// parsing the JSON body against the caller's schema.
//
// Uses INTERNAL_API_URL, not NEXT_PUBLIC_API_URL: this fetch runs on the
// server (inside the frontend's own container in dev), where the
// browser-facing `localhost:8090` doesn't reach the backend container —
// only the Docker-network hostname (`http://backend:8080`) does.
export class ServerHttp {
  static async get<T>(path: string, schema: z.ZodType<T>): Promise<HttpResult<T>> {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.INTERNAL_API_URL}${path}`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    return ServerHttp.toResult(res, schema);
  }

  static async post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<HttpResult<T>> {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.INTERNAL_API_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieStore.toString() },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    await ServerHttp.forwardSetCookies(res);
    return ServerHttp.toResult(res, schema);
  }

  static async delete<T>(path: string, schema: z.ZodType<T>): Promise<HttpResult<T>> {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.INTERNAL_API_URL}${path}`, {
      method: "DELETE",
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    return ServerHttp.toResult(res, schema);
  }

  // Only parses against the caller's success schema when res.ok — error
  // bodies ({error: string}) have a different shape and would throw on
  // schema.parse, so they're parsed separately and surfaced via `error`.
  private static async toResult<T>(res: Response, schema: z.ZodType<T>): Promise<HttpResult<T>> {
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: errorBodySchema.safeParse(json).data?.error ?? null };
    }
    return { ok: true, status: res.status, data: schema.parse(json), error: null };
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
