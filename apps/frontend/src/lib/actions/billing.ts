"use server";

import { redirect } from "next/navigation";
import { BillingServer } from "@/lib/http/billing-server";

export async function redirectToCheckout(planSlug: string): Promise<void> {
  const res = await BillingServer.createCheckoutSession(planSlug);
  if (!res.ok || !res.data) redirect("/dashboard/billing?checkout=error");
  redirect(res.data.url);
}

export async function redirectToBillingPortal(): Promise<void> {
  const res = await BillingServer.createPortalSession();
  if (!res.ok || !res.data) redirect("/dashboard/billing?portal=error");
  redirect(res.data.url);
}
