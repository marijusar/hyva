import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4.5">
          <Link href="/" aria-label="Sorrel" className="flex items-center">
            <Logo className="h-8 w-auto text-foreground" />
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 font-medium text-primary-foreground hover:bg-primary/80"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" aria-label="Sorrel" className="flex items-center">
            <Logo className="h-6 w-auto text-foreground" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/#pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Sign up
            </Link>
          </nav>
          <span>© {new Date().getFullYear()} Sorrel</span>
        </div>
      </footer>
    </div>
  );
}
