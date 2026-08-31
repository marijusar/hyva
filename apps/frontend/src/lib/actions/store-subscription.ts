"use server";

import { revalidatePath } from "next/cache";
import { StoreServer } from "@/lib/http/store-server";
import { ServerActionResponse, ServerActionResponsePayload, ServerActionStatuses } from "@/lib/responses/server-action-response";

export async function followStore(domain: string): Promise<ServerActionResponsePayload<null>> {
  const res = await StoreServer.subscribe(domain);
  if (!res.ok) {
    return ServerActionResponse.create({
      data: null,
      error: res.error ?? "Follow failed",
      status: ServerActionStatuses.error,
      code: res.code,
    });
  }
  revalidatePath("/dashboard");
  return ServerActionResponse.create({ data: null, error: null, status: ServerActionStatuses.success });
}

export async function unfollowStore(storeId: string): Promise<ServerActionResponsePayload<null>> {
  const res = await StoreServer.unsubscribe(storeId);
  if (!res.ok) {
    return ServerActionResponse.create({ data: null, error: res.error ?? "Unfollow failed", status: ServerActionStatuses.error });
  }
  revalidatePath("/dashboard");
  return ServerActionResponse.create({ data: null, error: null, status: ServerActionStatuses.success });
}
