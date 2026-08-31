import type { Generated } from "kysely";

export interface StoresTable {
  id: Generated<string>;
  domain: string;
  name: string | null;
  created_at: Generated<string>;
}

export interface StoreCrawlsTable {
  id: Generated<string>;
  store_id: string;
  status: string;
  created_at: Generated<string>;
}

export interface StoreMetadataTable {
  id: Generated<string>;
  store_id: string;
  platform: string | null;
  homepage_text: string | null;
  created_at: Generated<string>;
}

export interface StoreTechnologiesTable {
  id: Generated<string>;
  store_id: string;
  name: string;
  category: string | null;
  event_type: string;
  created_at: Generated<string>;
}

export interface StoreSubscriptionsTable {
  id: Generated<string>;
  user_id: string;
  store_id: string;
  created_at: Generated<string>;
}

export interface TechnologiesTable {
  id: Generated<string>;
  name: string;
  category: string | null;
  created_at: Generated<string>;
}

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  name: string | null;
  role: Generated<string>;
  last_login_at: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface UserSessionsTable {
  id: Generated<string>;
  user_id: string;
  refresh_token: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: Generated<string>;
  last_used_at: string | null;
}

export interface PlansTable {
  id: Generated<string>;
  slug: string;
  name: string;
  stripe_price_id: string | null;
  monthly_price_cents: number;
  is_active: Generated<boolean>;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface PlanLimitsTable {
  id: Generated<string>;
  plan_id: string;
  resource_key: string;
  max_count: number | null;
}

export interface BillingCustomersTable {
  id: Generated<string>;
  user_id: string;
  stripe_customer_id: string;
  created_at: Generated<string>;
}

export interface BillingSubscriptionsTable {
  id: Generated<string>;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status: string;
  next_payment_at: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface BillingWebhookEventsTable {
  id: string;
  type: string;
  created_at: Generated<string>;
}

export interface Database {
  stores: StoresTable;
  store_crawls: StoreCrawlsTable;
  store_metadata: StoreMetadataTable;
  store_technologies: StoreTechnologiesTable;
  store_subscriptions: StoreSubscriptionsTable;
  technologies: TechnologiesTable;
  users: UsersTable;
  user_sessions: UserSessionsTable;
  plans: PlansTable;
  plan_limits: PlanLimitsTable;
  billing_customers: BillingCustomersTable;
  billing_subscriptions: BillingSubscriptionsTable;
  billing_webhook_events: BillingWebhookEventsTable;
}
