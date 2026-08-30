import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectToCheckout } from "@/lib/actions/billing";
import type { Plan } from "@/lib/http/billing-server";
import { cn } from "@/lib/utils";

function formatLimit(resourceKey: string, maxCount: number | null): string {
  const label = resourceKey.replace(/_/g, " ");
  return maxCount === null ? `Unlimited ${label}` : `Up to ${maxCount} ${label}`;
}

export function PlanCard({ plan, featured = false }: { plan: Plan; featured?: boolean }) {
  return (
    <Card
      className={cn(
        "h-full [--card-spacing:--spacing(6)] gap-5",
        featured && "ring-[1.5px] ring-primary shadow-[0_16px_40px_-12px_rgb(0_0_0/0.16)]"
      )}
    >
      <CardHeader className="gap-1.5">
        <CardTitle>{plan.name}</CardTitle>
        <p className="text-[34px] leading-10 font-medium tracking-tight">
          ${plan.monthly_price_cents / 100}
          <span className="text-base font-normal text-muted-foreground">/mo</span>
        </p>
        {featured ? (
          <CardAction>
            <Badge>Most picked</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <ul className="flex flex-col gap-2.5 text-sm text-foreground/75">
          {plan.limits.map((limit) => (
            <li key={limit.resource_key}>{formatLimit(limit.resource_key, limit.max_count)}</li>
          ))}
        </ul>
        <form action={redirectToCheckout.bind(null, plan.slug)} className="mt-auto">
          <Button type="submit" variant={featured ? "default" : "outline"} className="h-10 w-full px-3.5">
            Subscribe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
