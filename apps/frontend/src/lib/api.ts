const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

export class Api {
  static async post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return Api.request<T>(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  static async get<T>(path: string): Promise<ApiResult<T>> {
    return Api.request<T>(path, { method: "GET" });
  }

  private static async request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
    const res = await fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
    const data = (await res.json().catch(() => null)) as T;
    return { ok: res.ok, status: res.status, data };
  }
}
