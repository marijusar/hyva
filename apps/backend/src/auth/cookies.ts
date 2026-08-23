import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { authEnv } from "./env.ts";

export class AuthCookies {
  private static readonly ACCESS_COOKIE = "access_token";
  private static readonly REFRESH_COOKIE = "refresh_token";

  static setAccessToken(c: Context, token: string): void {
    setCookie(c, AuthCookies.ACCESS_COOKIE, token, AuthCookies.options(authEnv.ACCESS_TOKEN_TTL_MS));
  }

  static setRefreshToken(c: Context, token: string): void {
    setCookie(c, AuthCookies.REFRESH_COOKIE, token, AuthCookies.options(authEnv.REFRESH_TOKEN_TTL_MS));
  }

  static getAccessToken(c: Context): string | undefined {
    return getCookie(c, AuthCookies.ACCESS_COOKIE);
  }

  static getRefreshToken(c: Context): string | undefined {
    return getCookie(c, AuthCookies.REFRESH_COOKIE);
  }

  static clear(c: Context): void {
    deleteCookie(c, AuthCookies.ACCESS_COOKIE, { path: "/" });
    deleteCookie(c, AuthCookies.REFRESH_COOKIE, { path: "/" });
  }

  private static options(ttlMs: number) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "Lax" as const,
      path: "/",
      maxAge: Math.floor(ttlMs / 1000),
    };
  }
}
