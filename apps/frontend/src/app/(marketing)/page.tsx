import Link from "next/link";
import { Chip } from "@/components/marketing/chip";
import { EventBadge } from "@/components/marketing/event-badge";
import { FeedEventRow, FeedHeader, FeedRow } from "@/components/marketing/feed";
import { Panel } from "@/components/marketing/panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { StepCard, StepPreview, StepPreviewRow } from "@/components/marketing/step-card";
import { MaskedStore, UnlockPill } from "@/components/marketing/store-cell";
import { TierCard } from "@/components/marketing/tier-card";
import { Button } from "@/components/ui/button";

const FEED = [
  { kind: "removed", name: "Judge.me", when: "2 minutes ago", storeWidth: "w-42" },
  { kind: "removed", name: "Loox", when: "4 hours ago", storeWidth: "w-33" },
  { kind: "added", name: "Okendo", when: "1 day ago", storeWidth: "w-49" },
  { kind: "removed", name: "Stamped", when: "1 day ago", storeWidth: "w-37.5" },
] as const;

const TIERS = [
  {
    name: "Starter",
    price: 49,
    tagline: "One app, one category.",
    features: [
      "100 stores unlocked per month",
      "Unlimited technologies followed",
      "Weekly change detection",
      "Email alert on every match",
    ],
  },
  {
    name: "Growth",
    price: 149,
    tagline: "Outbound every week.",
    features: [
      "500 stores unlocked per month",
      "Unlimited technologies followed",
      "Weekly change detection",
      "Email alert on every match",
    ],
    featured: true,
  },
  {
    name: "Scale",
    price: 399,
    tagline: "Agencies and app portfolios.",
    features: [
      "2,000 stores unlocked per month",
      "Unlimited technologies followed",
      "Weekly change detection",
      "Email alert on every match",
      "CSV export and webhooks",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_0%,transparent_75%)]"
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 pt-13 text-center sm:gap-6.5 sm:pt-22">
          <Chip>
            <span className="size-1.5 rounded-full bg-green-600" />
            Last change detected 2 minutes ago
          </Chip>
          <h1 className="max-w-[900px] font-heading text-[38px] leading-[1.08] font-medium tracking-tight text-balance sm:text-6xl sm:leading-[1.04]">
            Your next 100 installs are stores that just dropped a competitor.
          </h1>
          <p className="max-w-[620px] text-[17px] leading-7 text-muted-foreground text-pretty sm:text-[19px] sm:leading-[30px]">
            Hyva watches 500,000 Shopify storefronts and tells you which ones just dropped an app like yours. Email the
            merchant while the problem is still open.
          </p>
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-11 w-full px-5.5 text-[15px]">
                Start watching — $49/mo
              </Button>
            </Link>
            <span className="text-[13px] text-muted-foreground">Unlimited technologies on every plan.</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[1000px] px-6 pt-10 pb-16 sm:pt-14 sm:pb-24">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <Chip className="border-foreground/15 font-medium">Judge.me</Chip>
                <Chip>Loox</Chip>
                <Chip>Stamped</Chip>
                <Chip className="hidden sm:inline-flex">Okendo</Chip>
                <span className="text-[13px] text-muted-foreground">+2</span>
              </div>
              <span className="text-[13px] text-muted-foreground">84 of 100 stores left this month</span>
            </div>

            <FeedHeader />

            {FEED.map((event) => (
              <FeedRow key={event.name} {...event} />
            ))}
          </Panel>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid w-full max-w-[1000px] items-center gap-8 px-6 py-14 sm:grid-cols-2 sm:gap-14 sm:py-22">
          <div className="flex flex-col gap-4">
            <SectionHeading>A store just removed Judge.me. Nothing replaced it.</SectionHeading>
            <p className="text-base leading-6.5 text-muted-foreground text-pretty sm:text-[17px] sm:leading-7">
              Shopify apps uninstall in one click, so merchants rip something out first and shop after. That leaves a
              store with a live problem in your category and no incumbent in the way.
            </p>
          </div>
          <Panel>
            {FEED.slice(0, 3).map((event) => (
              <FeedEventRow key={event.name} kind={event.kind} name={event.name} when={event.when} />
            ))}
          </Panel>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-6 py-14 sm:py-22">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <SectionHeading>From competitor to conversation in three steps</SectionHeading>
          <p className="max-w-[600px] text-base leading-6.5 text-muted-foreground sm:text-[17px] sm:leading-7">
            Set it up once. The feed fills itself from then on.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
          <StepCard
            step={1}
            title="Follow your competitors"
            description="Search 7,586 technologies and follow every app yours replaces. No cap on how many, on any plan."
          >
            <StepPreview>
              <div className="flex h-8 items-center gap-2 rounded-md bg-background px-3 inset-ring-1 inset-ring-foreground/10">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="size-3.5 text-muted-foreground"
                >
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13 13 4 4" />
                </svg>
                <span className="text-[13px] text-muted-foreground">review app</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip className="h-6 text-xs">Judge.me</Chip>
                <Chip className="h-6 text-xs">Loox</Chip>
                <Chip className="h-6 text-xs">Okendo</Chip>
              </div>
            </StepPreview>
          </StepCard>

          <StepCard
            step={2}
            title="We re-crawl every week"
            description="All 500,000 storefronts, every week. Adds and removes land in your feed with the date we saw them."
          >
            <StepPreview className="gap-1.5">
              <StepPreviewRow>
                <EventBadge kind="removed" />
                <span className="font-medium">Judge.me</span>
                <span className="ml-auto text-muted-foreground">2 min</span>
              </StepPreviewRow>
              <StepPreviewRow>
                <EventBadge kind="added" />
                <span className="font-medium">Okendo</span>
                <span className="ml-auto text-muted-foreground">1 day</span>
              </StepPreviewRow>
            </StepPreview>
          </StepCard>

          <StepCard
            step={3}
            title="Unlock and reach out"
            description="Open the stores worth working and get the storefront. Your plan sets how many a month; top-ups cover a busy week."
          >
            <StepPreview className="gap-2.5">
              <StepPreviewRow className="gap-2.5 p-2.5">
                <MaskedStore className="w-24" />
                <UnlockPill className="ml-auto h-5.5 text-[11px]" />
              </StepPreviewRow>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>84 of 100 left</span>
                <span>Resets in 12 days</span>
              </div>
            </StepPreview>
          </StepCard>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-16 border-t border-border bg-muted/40">
        <div className="mx-auto w-full max-w-[1080px] px-6 py-14 sm:py-22">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <SectionHeading>Follow every competitor. Pay for the stores you work.</SectionHeading>
            <p className="text-[15px] text-muted-foreground sm:text-base">
              Unlimited technologies on every plan. Save 15% billed annually.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
            {TIERS.map((tier) => (
              <TierCard key={tier.name} {...tier} />
            ))}
          </div>

          <p className="mt-7 text-center text-[15px] text-muted-foreground">
            Need more mid-month? Top-up packs, no upgrade required.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1000px] px-6 py-14 sm:py-22">
        <div className="flex flex-col items-center gap-5 rounded-[18px] bg-primary px-6 py-12 text-center sm:gap-6 sm:px-10 sm:py-18">
          <h2 className="max-w-[720px] font-heading text-[28px] leading-[1.15] font-medium tracking-tight text-primary-foreground text-pretty sm:text-[38px]">
            Somewhere in 500,000 stores, someone just uninstalled your competitor.
          </h2>
          <p className="text-base text-primary-foreground/70 sm:text-[17px]">You can be the first email they get.</p>
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="h-11 w-full bg-background px-5.5 text-[15px] text-foreground hover:bg-background/90"
            >
              Start watching — $49/mo
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
