import { cookies } from "next/headers";

export interface ServerApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

// Server-component-only fetch helper. Forwards the incoming request's
// cookies to the backend by hand (a server-side `fetch` has no browser
// cookie jar) — client components use `Api` in api.ts instead, which relies
// on the browser sending `credentials: "include"`.
//
// Uses INTERNAL_API_URL, not NEXT_PUBLIC_API_URL: this fetch runs on the
// server (inside the frontend's own container in dev), where the
// browser-facing `localhost:8090` doesn't reach the backend container —
// only the Docker-network hostname (`http://backend:8080`) does.
export class ServerApi {
  static async get<T>(path: string): Promise<ServerApiResult<T>> {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.INTERNAL_API_URL}${path}`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  }
}
