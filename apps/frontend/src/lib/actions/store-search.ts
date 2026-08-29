"use server";

import { StoreServer, type StoreSearchResult } from "@/lib/http/store-server";
import { ServerActionResponse, ServerActionResponsePayload, ServerActionStatuses } from "@/lib/responses/server-action-response";

export async function searchStores(query: string): Promise<ServerActionResponsePayload<StoreSearchResult[]>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return ServerActionResponse.create({ data: [], error: null, status: ServerActionStatuses.success });
  }

  const res = await StoreServer.search(trimmed);
  if (!res.ok || !res.data) {
    return ServerActionResponse.create({ data: [], error: res.error ?? "Search failed", status: ServerActionStatuses.error });
  }

  return ServerActionResponse.create({ data: res.data, error: null, status: ServerActionStatuses.success });
}
