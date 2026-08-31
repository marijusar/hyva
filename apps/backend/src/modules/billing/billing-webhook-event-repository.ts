import type { Kysely } from "kysely";
import type { Database } from "@/db/types";

export class BillingWebhookEventRepository {
  // Idempotency guard — returns whether the event was actually new. Stripe
  // retries webhook delivery, so a repeat id means "already processed, skip."
  static async insertIfNew(db: Kysely<Database>, id: string, type: string): Promise<boolean> {
    const row = await db
      .insertInto("billing_webhook_events")
      .values({ id, type })
      .onConflict((oc) => oc.column("id").doNothing())
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }
}
