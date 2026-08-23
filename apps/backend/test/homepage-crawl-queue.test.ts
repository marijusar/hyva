import { afterEach, beforeEach, describe, expect, it, inject } from "vitest";
import { QueueConnection } from "#src/queue/queue-connection";
import { HomepageCrawlPublisher } from "#src/queue/homepage-crawl-publisher";
import { HomepageCrawlConsumer } from "#src/queue/homepage-crawl-consumer";
import type { HomepageCrawlJob } from "#src/queue/homepage-crawl-publisher";
import { LoggerFactory } from "#src/logging/logger";

const DLQ = "crawl.homepage.dlq";

describe("homepage crawl queue", () => {
  const logger = LoggerFactory.create("test");
  let publisherConnection: QueueConnection;
  let consumerConnection: QueueConnection;
  let publisher: HomepageCrawlPublisher;
  let consumer: HomepageCrawlConsumer;

  beforeEach(async () => {
    publisherConnection = new QueueConnection(inject("TEST_RABBITMQ_URI"), logger);
    consumerConnection = new QueueConnection(inject("TEST_RABBITMQ_URI"), logger);
    publisher = new HomepageCrawlPublisher(publisherConnection, logger);
    consumer = new HomepageCrawlConsumer(consumerConnection, logger);

    // Both classes assert their topology via addSetup on channel creation —
    // wait for the channels to actually connect before publishing, and drain
    // any leftovers a previous test in this file left behind.
    await publisherConnection.getChannel().waitForConnect();
    await consumerConnection.getChannel().waitForConnect();
    await consumerConnection.getChannel().purgeQueue(DLQ);
  });

  afterEach(async () => {
    await publisherConnection.close();
    await consumerConnection.close();
  });

  it("delivers a published job to the consumer's handler", async () => {
    const job: HomepageCrawlJob = { storeId: "3f3f3f3f-3f3f-4f3f-8f3f-3f3f3f3f3f3f", domain: "queue-test.myshopify.com" };

    let resolveReceived!: (job: HomepageCrawlJob) => void;
    const received = new Promise<HomepageCrawlJob>((resolve) => {
      resolveReceived = resolve;
    });

    await consumer.consume(async (job) => {
      resolveReceived(job);
    }, 10);
    await publisher.publish(job);

    await expect(received).resolves.toEqual(job);
  });

  it("routes a job to the dead-letter queue when the handler throws", async () => {
    const job: HomepageCrawlJob = { storeId: "4f4f4f4f-4f4f-4f4f-8f4f-4f4f4f4f4f4f", domain: "failing.myshopify.com" };

    await consumer.consume(async () => {
      throw new Error("handler blew up");
    }, 10);

    await publisher.publish(job);

    await expect.poll(() => consumerConnection.getChannel().checkQueue(DLQ)).toEqual(
      expect.objectContaining({ messageCount: 1 }),
    );

    const dead = await consumerConnection.getChannel().get(DLQ);
    if (dead === false) throw new Error("expected a message on the DLQ");
    expect(JSON.parse(dead.content.toString())).toEqual(job);
  });
});
