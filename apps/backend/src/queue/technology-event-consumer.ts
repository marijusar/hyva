import { QueueConsumer } from "./queue-consumer.ts";
import { QUEUE, DLQ, ROUTING_KEY, technologyEventJobSchema, type TechnologyEventJob } from "./technology-event-publisher.ts";
import type { QueueConnection } from "./queue-connection.ts";
import type { Logger } from "@/logging/logger";

export class TechnologyEventConsumer extends QueueConsumer<TechnologyEventJob> {
  constructor(connection: QueueConnection, logger: Logger) {
    super(
      connection,
      { queue: QUEUE, dlq: DLQ, routingKey: ROUTING_KEY, schema: technologyEventJobSchema },
      logger.child({ module: "[TECHNOLOGY_EVENT_CONSUMER]" }),
    );
  }
}
