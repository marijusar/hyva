import amqp from "amqp-connection-manager";
import type { AmqpConnectionManager, ChannelWrapper, Channel } from "amqp-connection-manager";
import type { Logger } from "@/logging/logger";

// Shared across every job type: the topic exchange jobs get published to,
// and the dead-letter exchange failed jobs get routed to. Job-specific
// queues/bindings/routing keys are asserted by each job's own
// publisher/consumer class, not here — this only owns the connection and
// the infrastructure every job type shares.
export const EXCHANGE = "crawler";
export const DLX = "crawler.dlx";

export class QueueConnection {
  private readonly connection: AmqpConnectionManager;
  private readonly channelWrapper: ChannelWrapper;
  private readonly logger: Logger;

  constructor(rabbitmqUrl: string, logger: Logger) {
    this.logger = logger.child({ module: "[QUEUE_CONNECTION]" });
    this.connection = amqp.connect([rabbitmqUrl]);
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: (channel: Channel) => QueueConnection.assertSharedTopology(channel),
    });

    this.channelWrapper.on("connect", () => this.logger.info("channel connected"));
    this.channelWrapper.on("close", () => this.logger.info("channel closed"));
    this.channelWrapper.on("error", (err: Error) => this.logger.error({ err }, "channel error"));
  }

  getChannel(): ChannelWrapper {
    return this.channelWrapper;
  }

  async close(): Promise<void> {
    await this.channelWrapper.close();
    await this.connection.close();
  }

  private static async assertSharedTopology(channel: Channel): Promise<void> {
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertExchange(DLX, "topic", { durable: true });
  }
}
