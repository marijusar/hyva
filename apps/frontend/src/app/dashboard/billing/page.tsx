import { redirect } from "next/navigation";
import { PlanCard } from "@/components/billing/plan-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectToBillingPortal } from "@/lib/actions/billing";
import { BillingServer } from "@/lib/http/billing-server";
import { CheckoutPending } from "./checkout-pending";

export default async function BillingPage({ searchParams }: PageProps<"/dashboard/billing">) {
  const subscriptionRes = await BillingServer.getCurrentSubscription();
  if (subscriptionRes.status === 401) redirect("/login");

  const subscription = subscriptionRes.data;
  const params = await searchParams;

  if (subscription) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <Card>
          <CardHeader>
            <CardTitle>{subscription.plan.name}</CardTitle>
            <CardDescription>
              ${subscription.plan.monthly_price_cents / 100}/mo · renews{" "}
              {new Date(subscription.next_payment_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={redirectToBillingPortal}>
              <Button type="submit" variant="outline">
                Manage billing
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (params.checkout === "success") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 p-6">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <CheckoutPending />
      </div>
    );
  }

  const plansRes = await BillingServer.getPlans();
  const plans = plansRes.ok && plansRes.data ? plansRes.data : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Choose a plan</h1>
        <p className="text-sm text-muted-foreground">Pick a plan to unlock the dashboard.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} featured={plan.slug === "growth"} />
        ))}
      </div>
    </div>
  );
}
