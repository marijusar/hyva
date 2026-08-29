import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIERS = [
  { name: "Starter", price: 49, stores: 100, extra: null },
  { name: "Growth", price: 149, stores: 500, extra: null },
  { name: "Scale", price: 399, stores: 2000, extra: "CSV export and webhooks" },
];

const SIGNALS = [
  {
    title: "Competitor dropped",
    body: "Removed a competing app, replaced it with nothing. Live problem, no incumbent.",
  },
  {
    title: "Competitor installed",
    body: "Already paying for your category. Budget proven, incumbent known, switching cost near zero.",
  },
  {
    title: "Adjacent launch",
    body: "Just launched subscriptions or loyalty. New stack, new gaps.",
  },
];

const STEPS = [
  {
    title: "Follow your competitors",
    body: "Search 7,500+ technologies. Follow every app yours replaces, no limit.",
  },
  {
    title: "See the stores",
    body: "Every store re-crawled weekly. Adds and removes land in your feed, dated.",
  },
  {
    title: "Unlock and reach out",
    body: "Open the stores worth working. Your plan sets how many each month.",
  },
];

const FEED = [
  { kind: "removed", name: "Judge.me", when: "2 minutes ago" },
  { kind: "removed", name: "Loox", when: "4 hours ago" },
  { kind: "added", name: "Okendo", when: "1 day ago" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 p-6 pt-20 pb-16 text-center">
        <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Your next 100 installs are stores that just dropped a competitor.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Hyva watches 500,000 Shopify storefronts and tells you which ones just dropped an app like yours. Email the
          merchant while the problem is still open.
        </p>
        <Link href="/register">
          <Button size="lg">Start watching — $49/mo</Button>
        </Link>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid w-full max-w-4xl items-center gap-10 p-6 py-16 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">The signal</span>
            <h2 className="font-heading text-2xl font-medium">A store just removed Judge.me. Nothing replaced it.</h2>
            <p className="text-muted-foreground">
              Shopify apps uninstall in one click, so merchants rip something out first and shop after. That leaves a
              store with a live problem in your category and no incumbent in the way.
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col gap-3 py-2">
              {FEED.map((event) => (
                <div key={event.name} className="flex items-center gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={
                      event.kind === "added"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {event.kind}
                  </Badge>
                  <span className="font-medium">{event.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{event.when}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl p-6 py-16">
        <h2 className="text-center font-heading text-2xl font-medium">Three reasons to email a merchant today</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {SIGNALS.map((signal) => (
            <div key={signal.title} className="flex flex-col gap-2">
              <h3 className="font-medium">{signal.title}</h3>
              <p className="text-sm text-muted-foreground">{signal.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto w-full max-w-4xl p-6 py-16">
          <h2 className="text-center font-heading text-2xl font-medium">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">0{index + 1}</span>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl p-6 py-16">
        <div>
          <h2 className="text-center font-heading text-2xl font-medium">
            Follow every competitor. Pay for the stores you work.
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Unlimited technologies on every plan. Save 15% billed annually.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <Card key={tier.name}>
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <p className="text-3xl font-medium">
                    ${tier.price}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <li>{tier.stores.toLocaleString()} stores/mo</li>
                    <li>Unlimited technologies</li>
                    {tier.extra ? <li>{tier.extra}</li> : null}
                  </ul>
                  <Link href="/register">
                    <Button variant="outline" className="w-full">
                      Get started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need more mid-month? Top-up packs, no upgrade required.
          </p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 p-6 py-20 text-center">
        <h2 className="font-heading text-2xl font-medium">
          Somewhere in 500,000 stores, someone just uninstalled your competitor.
        </h2>
        <p className="text-muted-foreground">You can be the first email they get.</p>
        <Link href="/register">
          <Button size="lg">Start watching — $49/mo</Button>
        </Link>
      </section>
    </div>
  );
}
