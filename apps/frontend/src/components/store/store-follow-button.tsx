"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { followStore, unfollowStore } from "@/lib/actions/store-subscription";

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const result = isSubscribed ? await unfollowStore(storeId) : await followStore(domain);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong");
      setPending(false);
      return;
    }
    setIsSubscribed((prev) => !prev);
    setPending(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant={isSubscribed ? "outline" : "default"} disabled={pending} onClick={handleClick}>
        {pending ? "…" : isSubscribed ? "Unsubscribe" : "Subscribe"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
