import type { Hono } from "hono";
import type { AppEnv } from "../../app.ts";
import { AuthMiddleware } from "../../auth/middleware.ts";
import { AuthHandlers } from "./handlers.ts";

export class UserRoutes {
  static mount(app: Hono<AppEnv>): void {
    app.post("/auth/register", AuthHandlers.register);
    app.post("/auth/login", AuthHandlers.login);
    app.post("/auth/logout", AuthHandlers.logout);
    app.get("/auth/me", AuthMiddleware.requireAuth(), AuthHandlers.me);
  }
}
