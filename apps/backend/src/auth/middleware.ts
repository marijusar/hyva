import type { Context, Next } from "hono";
import type { AppEnv } from "@/app";
import { AuthCookies } from "./cookies.ts";
import { Tokens } from "./tokens.ts";
import { UserRepository } from "@/modules/user/repository";

interface RefreshResult {
  userId: string;
  role: string;
}

export class AuthMiddleware {
  static requireAuth() {
    return async (c: Context<AppEnv>, next: Next) => {
      const accessToken = AuthCookies.getAccessToken(c);
      const payload = accessToken ? await Tokens.verifyToken(accessToken) : null;

      if (payload) {
        c.set("userId", payload.userId);
        if (payload.role) c.set("userRole", payload.role);
        await next();
        return;
      }

      const refreshed = await AuthMiddleware.refreshAccessToken(c);
      if (!refreshed) {
        return c.json({ error: "Authentication required" }, 401);
      }

      c.set("userId", refreshed.userId);
      c.set("userRole", refreshed.role);
      await next();
    };
  }

  static requireRole(role: string) {
    return async (c: Context<AppEnv>, next: Next) => {
      if (c.get("userRole") !== role) {
        return c.json({ error: "Forbidden" }, 403);
      }
      await next();
    };
  }

  private static async refreshAccessToken(
    c: Context<AppEnv>,
  ): Promise<RefreshResult | null> {
    const refreshToken = AuthCookies.getRefreshToken(c);
    if (!refreshToken) return null;

    const db = c.get("db");
    const session = await UserRepository.getSessionByRefreshToken(
      db,
      refreshToken,
    );
    if (
      !session ||
      session.revoked_at ||
      new Date(session.expires_at) < new Date()
    )
      return null;

    const payload = await Tokens.verifyToken(refreshToken);
    if (!payload) return null;

    const user = await UserRepository.getById(db, payload.userId);
    if (!user) return null;

    const newAccessToken = await Tokens.createAccessToken(user.id, user.role);
    AuthCookies.setAccessToken(c, newAccessToken);
    await UserRepository.updateSessionLastUsed(db, session.id, new Date());

    return { userId: user.id, role: user.role };
  }
}
