import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] bg-card ring-1 ring-foreground/[0.08] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-12px_rgb(0_0_0/0.14)]",
        className
      )}
      {...props}
    />
  );
}
