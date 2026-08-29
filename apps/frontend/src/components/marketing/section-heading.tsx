import { cn } from "@/lib/utils";

export function SectionHeading({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-heading text-2xl leading-8 font-medium tracking-tight text-pretty sm:text-[32px] sm:leading-10",
        className
      )}
      {...props}
    />
  );
}
