import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppFactory } from "#src/app";
import { LoggerFactory } from "#src/logging/logger";
import { TestDatabase } from "./utils/database.ts";

function extractCookie(res: Response, name: string): string | undefined {
  const cookies = res.headers.getSetCookie();
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match?.split(";")[0];
}

describe("auth flow", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("registers, rejects duplicate email, logs in, reads /auth/me, and logs out", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));

    const registerRes = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "founder@hyva.dev", password: "correct-horse-battery", name: "Founder" }),
    });
    expect(registerRes.status).toBe(201);
    const registered = await registerRes.json();
    expect(registered.email).toBe("founder@hyva.dev");

    const duplicateRes = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "founder@hyva.dev", password: "another-password" }),
    });
    expect(duplicateRes.status).toBe(409);

    const wrongPasswordRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "founder@hyva.dev", password: "wrong-password" }),
    });
    expect(wrongPasswordRes.status).toBe(401);

    const loginRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "founder@hyva.dev", password: "correct-horse-battery" }),
    });
    expect(loginRes.status).toBe(200);

    const accessCookie = extractCookie(loginRes, "access_token");
    const refreshCookie = extractCookie(loginRes, "refresh_token");
    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    const unauthenticatedRes = await app.request("/auth/me");
    expect(unauthenticatedRes.status).toBe(401);

    const meRes = await app.request("/auth/me", {
      headers: { cookie: `${accessCookie}; ${refreshCookie}` },
    });
    expect(meRes.status).toBe(200);
    const me = await meRes.json();
    expect(me.email).toBe("founder@hyva.dev");
    expect(me.role).toBe("user");

    const logoutRes = await app.request("/auth/logout", {
      method: "POST",
      headers: { cookie: `${accessCookie}; ${refreshCookie}` },
    });
    expect(logoutRes.status).toBe(200);
  });

  it("issues a fresh access token from a valid refresh token when the access token is missing", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));

    const loginRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "refresh@hyva.dev", password: "irrelevant" }),
    });
    // No user registered yet — expect invalid credentials, not a crash.
    expect(loginRes.status).toBe(401);

    await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "refresh@hyva.dev", password: "correct-horse-battery" }),
    });
    const realLoginRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "refresh@hyva.dev", password: "correct-horse-battery" }),
    });
    const refreshCookie = extractCookie(realLoginRes, "refresh_token");
    expect(refreshCookie).toBeDefined();

    const meRes = await app.request("/auth/me", {
      headers: { cookie: `${refreshCookie}` },
    });
    expect(meRes.status).toBe(200);
    expect(meRes.headers.getSetCookie().some((c) => c.startsWith("access_token="))).toBe(true);
  });
});
