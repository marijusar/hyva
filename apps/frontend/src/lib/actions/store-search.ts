"use server";

import { StoreServer, type StoreSearchResult } from "@/lib/http/store-server";

export async function searchStores(query: string): Promise<StoreSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const res = await StoreServer.search(trimmed);
  return res.ok && res.data ? res.data : [];
}
