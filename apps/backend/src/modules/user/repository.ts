import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";

export const newUserSchema = z.object({
  email: z.email(),
  passwordHash: z.string(),
  name: z.string().nullable(),
});

export type NewUser = z.infer<typeof newUserSchema>;

export const newSessionSchema = z.object({
  userId: z.uuid(),
  refreshToken: z.string(),
  expiresAt: z.date(),
});

export type NewSession = z.infer<typeof newSessionSchema>;

export class UserRepository {
  static create(db: Kysely<Database>, user: NewUser) {
    return db
      .insertInto("users")
      .values({ email: user.email, password_hash: user.passwordHash, name: user.name })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  static getByEmail(db: Kysely<Database>, email: string) {
    return db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst();
  }

  static getById(db: Kysely<Database>, id: string) {
    return db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst();
  }

  static updateLastLogin(db: Kysely<Database>, id: string, when: Date) {
    return db.updateTable("users").set({ last_login_at: when.toISOString() }).where("id", "=", id).execute();
  }

  static createSession(db: Kysely<Database>, session: NewSession) {
    return db
      .insertInto("user_sessions")
      .values({
        user_id: session.userId,
        refresh_token: session.refreshToken,
        expires_at: session.expiresAt.toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  static getSessionByRefreshToken(db: Kysely<Database>, refreshToken: string) {
    return db.selectFrom("user_sessions").selectAll().where("refresh_token", "=", refreshToken).executeTakeFirst();
  }

  static updateSessionLastUsed(db: Kysely<Database>, sessionId: string, when: Date) {
    return db
      .updateTable("user_sessions")
      .set({ last_used_at: when.toISOString() })
      .where("id", "=", sessionId)
      .execute();
  }

  static revokeSession(db: Kysely<Database>, refreshToken: string) {
    return db
      .updateTable("user_sessions")
      .set({ revoked_at: new Date().toISOString() })
      .where("refresh_token", "=", refreshToken)
      .execute();
  }
}
