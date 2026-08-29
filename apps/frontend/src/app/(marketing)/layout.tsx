import Link from "next/link";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
          <Link href="/" className="font-heading text-lg font-medium">
            Hyva
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl p-4 text-sm text-muted-foreground">© {new Date().getFullYear()} Hyva</div>
      </footer>
    </div>
  );
}
