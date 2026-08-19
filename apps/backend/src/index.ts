import { serve } from "@hono/node-server";
import { AppFactory } from "./app.ts";
import { DbClient } from "./db/client.ts";
import { env } from "./env.ts";

export class Server {
  static start(): void {
    const db = DbClient.create(env.DATABASE_URL);
    const app = AppFactory.create(db);

    serve({ fetch: app.fetch, port: env.PORT }, (info) => {
      console.log(`backend listening on http://localhost:${info.port}`);
    });
  }
}

Server.start();
