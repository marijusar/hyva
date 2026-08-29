import { cn } from "@/lib/utils";

export function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[13px] text-foreground",
        className
      )}
      {...props}
    />
  );
}
