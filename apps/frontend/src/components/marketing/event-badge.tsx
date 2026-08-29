import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Fixed 72px so "added" and "removed" share a column and what follows them lines up.
// "removed" measures ~67px at this size, and Badge clips overflow, so don't shrink this.
export function EventBadge({ kind }: { kind: "added" | "removed" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-18",
        kind === "added"
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {kind}
    </Badge>
  );
}
