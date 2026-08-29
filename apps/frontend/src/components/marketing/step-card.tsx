import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StepPreview({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 overflow-hidden rounded-[12px] bg-muted/60 p-4 inset-ring-1 inset-ring-foreground/[0.07] sm:h-27 sm:justify-center",
        className
      )}
      {...props}
    />
  );
}

export function StepPreviewRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-background p-2 text-xs inset-ring-1 inset-ring-foreground/10",
        className
      )}
      {...props}
    />
  );
}

export function StepCard({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardContent>{children}</CardContent>
      <CardContent className="flex flex-col gap-2.5 px-6 pb-1.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-6.5 items-center justify-center rounded-full bg-primary font-heading text-[13px] font-semibold text-primary-foreground">
            {step}
          </span>
          <h3 className="text-[17px] leading-6 font-medium">{title}</h3>
        </div>
        <p className="text-[15px] leading-5.5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
