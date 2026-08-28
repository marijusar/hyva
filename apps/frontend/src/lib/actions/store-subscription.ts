"use server";

import { StoreServer } from "@/lib/http/store-server";

export async function followStore(domain: string): Promise<{ ok: boolean; error: string | null }> {
  const res = await StoreServer.subscribe(domain);
  return { ok: res.ok, error: res.error };
}

export async function unfollowStore(storeId: string): Promise<{ ok: boolean; error: string | null }> {
  const res = await StoreServer.unsubscribe(storeId);
  return { ok: res.ok, error: res.error };
}
