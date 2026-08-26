import type { Context } from "hono";
import type { AppEnv } from "@/app";
import { AuthCookies } from "@/auth/cookies";
import { Password } from "@/auth/password";
import { Tokens } from "@/auth/tokens";
import { UserRepository } from "./repository.ts";
import { UserSchemas } from "./schemas.ts";

export class AuthHandlers {
  static async register(c: Context<AppEnv>) {
    const parsed = UserSchemas.register.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400);
    }

    const db = c.get("db");
    const existing = await UserRepository.getByEmail(db, parsed.data.email);
    if (existing) {
      return c.json({ error: "User with this email already exists" }, 409);
    }

    const passwordHash = await Password.hash(parsed.data.password);
    const user = await UserRepository.create(db, {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name ?? null,
    });

    return c.json({ id: user.id, email: user.email, name: user.name }, 201);
  }

  static async login(c: Context<AppEnv>) {
    const parsed = UserSchemas.login.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400);
    }

    const db = c.get("db");
    const user = await UserRepository.getByEmail(db, parsed.data.email);
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const validPassword = await Password.verify(parsed.data.password, user.password_hash);
    if (!validPassword) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const accessToken = await Tokens.createAccessToken(user.id, user.role);
    const refreshToken = await Tokens.createRefreshToken(user.id);

    await UserRepository.createSession(db, {
      userId: user.id,
      refreshToken,
      expiresAt: Tokens.refreshTokenExpiresAt(),
    });

    AuthCookies.setAccessToken(c, accessToken);
    AuthCookies.setRefreshToken(c, refreshToken);

    await UserRepository.updateLastLogin(db, user.id, new Date());

    return c.json({ message: "Login successful" });
  }

  static async logout(c: Context<AppEnv>) {
    const db = c.get("db");
    const refreshToken = AuthCookies.getRefreshToken(c);
    if (refreshToken) {
      await UserRepository.revokeSession(db, refreshToken);
    }
    AuthCookies.clear(c);
    return c.json({ message: "Logged out" });
  }

  static async me(c: Context<AppEnv>) {
    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const db = c.get("db");
    const user = await UserRepository.getById(db, userId);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  }
}
