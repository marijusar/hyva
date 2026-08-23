import pino, { type Logger } from "pino";
import { loggingEnv } from "./env.ts";

export type { Logger };

export class LoggerFactory {
  static create(name: string): Logger {
    return pino({
      name,
      level: loggingEnv.LOG_LEVEL,
      transport: loggingEnv.LOG_FORMAT === "pretty" ? { target: "pino-pretty" } : undefined,
    });
  }
}
