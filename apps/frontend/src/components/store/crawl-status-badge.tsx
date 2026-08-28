import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  dead: "border-red-200 bg-red-50 text-red-700",
  error: "border-amber-200 bg-amber-50 text-amber-700",
};

export function CrawlStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}
