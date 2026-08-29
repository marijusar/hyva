import { cn } from "@/lib/utils";

export function MaskedStore({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("inline-block h-2.5 rounded-full bg-border", className)} {...props} />;
}

export function UnlockPill({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-6.5 items-center rounded-full border border-border bg-background px-2.5 text-xs font-medium",
        className
      )}
      {...props}
    >
      Unlock
    </span>
  );
}
