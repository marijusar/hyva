import type { Channel } from "amqp-connection-manager";
import { z } from "zod";
import { DLX, EXCHANGE, QueueConnection } from "./queue-connection.ts";
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

export class QueueTechnologyEventPublisher implements TechnologyEventPublisher {
  private readonly logger: Logger;

  constructor(
    private readonly connection: QueueConnection,
    logger: Logger,
  ) {
    this.logger = logger.child({ module: "[TECHNOLOGY_EVENT_PUBLISHER]" });
    this.connection.getChannel().addSetup((channel: Channel) => QueueTechnologyEventPublisher.assertTopology(channel));
  }

  async publish(job: TechnologyEventJob): Promise<void> {
    await this.connection.getChannel().publish(EXCHANGE, ROUTING_KEY, job, {
      persistent: true,
    });
    this.logger.info({ job }, "published");
  }

  private static async assertTopology(channel: Channel): Promise<void> {
    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: { "x-dead-letter-exchange": DLX },
    });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    await channel.assertQueue(DLQ, { durable: true });
    await channel.bindQueue(DLQ, DLX, ROUTING_KEY);
  }
}
