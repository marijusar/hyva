import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Kysely } from "kysely";
import type { Database } from "./db/types.ts";
import { UserRoutes } from "./modules/user/routes.ts";

export type AppEnv = {
  Variables: {
    db: Kysely<Database>;
    userId?: string;
    userRole?: string;
  };
};

export class AppFactory {
  static create(db: Kysely<Database>) {
    const app = new Hono<AppEnv>();

    app.use(
      "*",
      cors({
        origin: (origin) => origin,
        credentials: true,
      }),
    );

    app.use("*", async (c, next) => {
      c.set("db", db);
      await next();
    });

    app.get("/health", (c) => c.json({ status: "ok" }));

    app.get("/stores", async (c) => {
      const stores = await c.get("db").selectFrom("stores").selectAll().execute();
      return c.json(stores);
    });

    UserRoutes.mount(app);

    return app;
  }
}

export type App = ReturnType<typeof AppFactory.create>;
