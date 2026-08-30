import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import { UserRepository } from "@/modules/user/repository";
import { BillingCustomerRepository } from "./billing-customer-repository.ts";
import { stripeClient } from "./stripe-client.ts";

export class BillingCustomers {
  // Lazy — a Stripe customer is only created the first time a user actually checks out.
  static async getOrCreateStripeCustomerId(db: Kysely<Database>, userId: string): Promise<string> {
    const existing = await BillingCustomerRepository.getByUserId(db, userId);
    if (existing) return existing.stripeCustomerId;

    const user = await UserRepository.getById(db, userId);
    if (!user) throw new Error(`User ${userId} not found while resolving Stripe customer`);

    const customer = await stripeClient.customers.create({ email: user.email, metadata: { userId } });
    await BillingCustomerRepository.create(db, userId, customer.id);

    return customer.id;
  }
}
