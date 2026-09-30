import Stripe from "stripe";

let client: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  }
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
};
