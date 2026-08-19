import type { Generated } from "kysely";

export interface StoresTable {
  id: Generated<string>;
  domain: string;
  name: string | null;
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
  users: UsersTable;
  user_sessions: UserSessionsTable;
}
