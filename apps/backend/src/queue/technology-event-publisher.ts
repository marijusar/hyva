import { z } from "zod";
import { QueuePublisher } from "./queue-publisher.ts";
import type { QueueConnection } from "./queue-connection.ts";
import type { Logger } from "@/logging/logger";

export const QUEUE = "technology.events.q";
export const DLQ = "technology.events.dlq";
export const ROUTING_KEY = "technology.events";

export const technologyEventJobSchema = z.object({
  storeId: z.uuid(),
  name: z.string(),
  category: z.string().nullable(),
  eventType: z.enum(["added", "removed"]),
});

export type TechnologyEventJob = z.infer<typeof technologyEventJobSchema>;

export interface TechnologyEventPublisher {
  publish(job: TechnologyEventJob): Promise<void>;
}

export class QueueTechnologyEventPublisher extends QueuePublisher<TechnologyEventJob> implements TechnologyEventPublisher {
  constructor(connection: QueueConnection, logger: Logger) {
    super(connection, { queue: QUEUE, dlq: DLQ, routingKey: ROUTING_KEY }, logger.child({ module: "[TECHNOLOGY_EVENT_PUBLISHER]" }));
  }
}
