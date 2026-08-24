import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Kysely } from "kysely";
import type { Database } from "./db/types.ts";
import type { Logger } from "./logging/logger.ts";
import { UserRoutes } from "./modules/user/routes.ts";
import { StoreRoutes } from "./modules/store/routes.ts";

export type AppEnv = {
  Variables: {
    db: Kysely<Database>;
    logger: Logger;
    userId?: string;
    userRole?: string;
  };
};

export class AppFactory {
  static create(db: Kysely<Database>, logger: Logger) {
    const app = new Hono<AppEnv>();
    const httpLogger = logger.child({ module: "[HTTP]" });

    app.use(
      "*",
      cors({
        origin: (origin) => origin,
        credentials: true,
      }),
    );

    app.use("*", async (c, next) => {
      c.set("db", db);
      c.set("logger", httpLogger);
      await next();
    });

    app.use("*", async (c, next) => {
      const startedAt = Date.now();
      await next();
      httpLogger.info(
        { method: c.req.method, path: c.req.path, status: c.res.status, durationMs: Date.now() - startedAt },
        "request handled",
      );
    });

    app.get("/health", (c) => c.json({ status: "ok" }));

    UserRoutes.mount(app);
    StoreRoutes.mount(app);

    return app;
  }
}

export type App = ReturnType<typeof AppFactory.create>;
