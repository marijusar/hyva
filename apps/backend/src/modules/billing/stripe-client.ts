import Stripe from "stripe";
import { billingEnv } from "./env.ts";

export const stripeClient = new Stripe(billingEnv.STRIPE_SECRET_KEY);
