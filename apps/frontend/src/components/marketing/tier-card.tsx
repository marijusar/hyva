import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TierCard({
  name,
  price,
  tagline,
  features,
  featured = false,
}: {
  name: string;
  price: number;
  tagline: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <Card
      className={cn(
        "h-full [--card-spacing:--spacing(6)] gap-5",
        featured && "ring-[1.5px] ring-primary shadow-[0_16px_40px_-12px_rgb(0_0_0/0.16)]"
      )}
    >
      <CardHeader className="gap-1.5">
        <CardTitle>{name}</CardTitle>
        <p className="text-[34px] leading-10 font-medium tracking-tight">
          ${price}
          <span className="text-base font-normal text-muted-foreground">/mo</span>
        </p>
        <CardDescription>{tagline}</CardDescription>
        {featured ? (
          <CardAction>
            <Badge>Most picked</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <ul className="flex flex-col gap-2.5 text-sm text-foreground/75">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <Link href="/register" className="mt-auto">
          <Button variant={featured ? "default" : "outline"} className="h-10 w-full px-3.5">
            Get started
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
