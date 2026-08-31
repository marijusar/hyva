// Reasons a webhook event's DB sync was skipped. Every value is logged by
// the caller — none of these should be silent.
export enum BillingWebhookError {
  MissingStripeCustomerId = "MISSING_STRIPE_CUSTOMER_ID",
  UnknownBillingCustomer = "UNKNOWN_BILLING_CUSTOMER",
  MissingSubscriptionItem = "MISSING_SUBSCRIPTION_ITEM",
  UnknownPlanPrice = "UNKNOWN_PLAN_PRICE",
}
