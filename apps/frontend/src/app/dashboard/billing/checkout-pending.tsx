"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 10;

// Rendered only while checkout=success and no active subscription is in our
// DB yet — the webhook that actually creates the row hasn't landed. Polls
// via router.refresh() (re-runs the page's server-side fetch) until the
// server sees an active plan, at which point this branch stops being
// rendered at all and the effect's cleanup clears the interval.
export function CheckoutPending() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > MAX_ATTEMPTS) {
        clearInterval(interval);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router]);

  if (timedOut) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          Still confirming your subscription — this can take a moment.
        </p>
        <Button variant="outline" onClick={() => router.refresh()}>
          Check again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-sm text-muted-foreground">Confirming your subscription…</p>
    </div>
  );
}
