import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { authEnv } from "./env.ts";

export const tokenPayloadSchema = z.object({
  userId: z.string(),
  role: z.string().nullable(),
  issuedAt: z.date(),
  expiresAt: z.date(),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export class Tokens {
  private static readonly secret = new TextEncoder().encode(authEnv.JWT_SECRET);

  static createAccessToken(userId: string, role: string): Promise<string> {
    return Tokens.createToken(userId, authEnv.ACCESS_TOKEN_TTL_MS, role);
  }

  static createRefreshToken(userId: string): Promise<string> {
    return Tokens.createToken(userId, authEnv.REFRESH_TOKEN_TTL_MS);
  }

  static refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + authEnv.REFRESH_TOKEN_TTL_MS);
  }

  static async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, Tokens.secret);
      if (!payload.iat || !payload.exp) return null;

      const parsed = tokenPayloadSchema.safeParse({
        userId: payload.sub,
        role: typeof payload.role === "string" ? payload.role : null,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
      });
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private static createToken(userId: string, ttlMs: number, role?: string): Promise<string> {
    const expiresAtSeconds = Math.floor((Date.now() + ttlMs) / 1000);
    return new SignJWT({ sub: userId, ...(role ? { role } : {}) })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAtSeconds)
      .sign(Tokens.secret);
  }
}
