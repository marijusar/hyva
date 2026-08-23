import { serve } from "@hono/node-server";
import { AppFactory } from "./app.ts";
import { DbClient } from "./db/client.ts";
import { dbEnv } from "./db/env.ts";
import { serverEnv } from "./server-env.ts";
import { LoggerFactory } from "./logging/logger.ts";

export class Server {
  static start(): void {
    const logger = LoggerFactory.create("backend");
    const db = DbClient.create(dbEnv.DATABASE_URL);
    const app = AppFactory.create(db, logger);

    serve({ fetch: app.fetch, port: serverEnv.PORT }, (info) => {
      logger.info({ port: info.port }, "backend listening");
    });
  }
}

Server.start();
