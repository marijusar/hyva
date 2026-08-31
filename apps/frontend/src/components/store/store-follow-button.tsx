"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { followStore, unfollowStore } from "@/lib/actions/store-subscription";
import { createDefaultServerActionResponse, ServerActionStatuses } from "@/lib/responses/server-action-response";

const initialState = createDefaultServerActionResponse(null);

export function StoreFollowButton({
  storeId,
  domain,
  initialIsSubscribed,
}: {
  storeId: string;
  domain: string;
  initialIsSubscribed: boolean;
}) {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [prevState, setPrevState] = useState(initialState);

  const [state, formAction, isPending] = useActionState(async () => {
    return isSubscribed ? await unfollowStore(storeId) : await followStore(domain);
  }, initialState);

  if (state !== prevState) {
    setPrevState(state);
    if (state.status === ServerActionStatuses.success) {
      setIsSubscribed((prev) => !prev);
    }
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <Button type="submit" variant={isSubscribed ? "outline" : "default"} disabled={isPending}>
        {isPending ? "…" : isSubscribed ? "Unsubscribe" : "Subscribe"}
      </Button>
      {state.status === ServerActionStatuses.error && state.error ? (
        <p className="text-sm text-destructive">
          {state.error}
          {state.code === "LIMIT_EXCEEDED" ? (
            <Link href="/dashboard/billing" className="ml-1 underline underline-offset-4">
              Upgrade
            </Link>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
