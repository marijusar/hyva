import { EventBadge } from "@/components/marketing/event-badge";
import { MaskedStore, UnlockPill } from "@/components/marketing/store-cell";

const COLUMNS = "sm:grid sm:grid-cols-[92px_124px_1fr_96px_84px] sm:items-center sm:gap-4 sm:px-5";

type FeedEvent = {
  kind: "added" | "removed";
  name: string;
  when: string;
};

export function FeedHeader() {
  return (
    <div
      className={`hidden border-t border-border bg-muted/50 py-2.5 text-xs font-medium tracking-wider text-muted-foreground uppercase ${COLUMNS}`}
    >
      <span>Change</span>
      <span>Technology</span>
      <span>Store</span>
      <span className="text-right">Detected</span>
      <span />
    </div>
  );
}

export function FeedRow({ kind, name, when, storeWidth }: FeedEvent & { storeWidth: string }) {
  return (
    <div className={`flex flex-col gap-2.5 border-t border-border p-4 text-sm sm:py-3.25 ${COLUMNS}`}>
      <div className="flex items-center gap-2 sm:contents">
        <span className="sm:order-1">
          <EventBadge kind={kind} />
        </span>
        <span className="font-medium sm:order-2">{name}</span>
        <span className="ml-auto text-[13px] text-muted-foreground sm:order-4 sm:ml-0 sm:text-right">{when}</span>
      </div>
      <div className="flex items-center gap-2.5 sm:contents">
        <span className="sm:order-3">
          <MaskedStore className={storeWidth} />
        </span>
        <span className="ml-auto sm:order-5 sm:ml-0 sm:text-right">
          <UnlockPill />
        </span>
      </div>
    </div>
  );
}

export function FeedEventRow({ kind, name, when }: FeedEvent) {
  return (
    <div className="flex items-center gap-2.5 border-t border-border p-4 text-sm first:border-t-0 sm:px-5">
      <EventBadge kind={kind} />
      <span className="font-medium">{name}</span>
      <span className="ml-auto text-[13px] text-muted-foreground">{when}</span>
    </div>
  );
}
