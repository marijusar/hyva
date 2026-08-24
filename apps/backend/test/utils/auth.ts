import type { AppFactory } from "#src/app";

export function extractCookie(res: Response, name: string): string | undefined {
  const cookies = res.headers.getSetCookie();
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match?.split(";")[0];
}

export async function registerAndLogin(app: ReturnType<typeof AppFactory.create>, email: string): Promise<string> {
  await app.request("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "correct-horse-battery" }),
  });
  const loginRes = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "correct-horse-battery" }),
  });
  const accessCookie = extractCookie(loginRes, "access_token");
  const refreshCookie = extractCookie(loginRes, "refresh_token");
  return `${accessCookie}; ${refreshCookie}`;
}
