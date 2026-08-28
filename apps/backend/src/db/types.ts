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

export interface Database {
  stores: StoresTable;
  store_crawls: StoreCrawlsTable;
  store_metadata: StoreMetadataTable;
  store_technologies: StoreTechnologiesTable;
  store_subscriptions: StoreSubscriptionsTable;
  technologies: TechnologiesTable;
  users: UsersTable;
  user_sessions: UserSessionsTable;
}
