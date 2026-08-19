import { jwtVerify, SignJWT } from "jose";
import { env } from "../env.ts";

export interface TokenPayload {
  userId: string;
  role: string | null;
  issuedAt: Date;
  expiresAt: Date;
}

export class Tokens {
  private static readonly secret = new TextEncoder().encode(env.JWT_SECRET);

  static createAccessToken(userId: string, role: string): Promise<string> {
    return Tokens.createToken(userId, env.ACCESS_TOKEN_TTL_MS, role);
  }

  static createRefreshToken(userId: string): Promise<string> {
    return Tokens.createToken(userId, env.REFRESH_TOKEN_TTL_MS);
  }

  static refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + env.REFRESH_TOKEN_TTL_MS);
  }

  static async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, Tokens.secret);
      if (typeof payload.sub !== "string" || !payload.iat || !payload.exp) return null;
      return {
        userId: payload.sub,
        role: typeof payload.role === "string" ? payload.role : null,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
      };
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
