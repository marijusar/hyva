import { QueueConnection } from "@/queue/queue-connection";
import { TechnologyEventConsumer } from "@/queue/technology-event-consumer";
import { queueEnv } from "@/queue/env";
import { LoggerFactory } from "@/logging/logger";
import { technologyEventWorkerEnv } from "./technology-event-worker-env.ts";

export class TechnologyEventWorker {
  static async start(): Promise<void> {
    const logger = LoggerFactory.create("technology-event-worker");
    const connection = new QueueConnection(queueEnv.RABBITMQ_URL, logger);
    const consumer = new TechnologyEventConsumer(connection, logger);

    await consumer.consume(async (job) => {
      // Stub: real side effects (email, webhook) land here once an
      // alerting channel is chosen. For now, proves the pipeline delivers.
      logger.info({ job }, "technology event received");
    }, technologyEventWorkerEnv.TECHNOLOGY_EVENT_WORKER_CONCURRENCY);
  }
}

TechnologyEventWorker.start();
