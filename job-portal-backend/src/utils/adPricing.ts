import AdPricing, { IAdPricing } from "../models/adPricing.model";

// Starting prices, in cents. Admins can change these from the admin page;
// this is only used the first time pricing is requested.
const DEFAULT_TIERS = [
  { days: 7, price: 1000 },
  { days: 15, price: 1800 },
  { days: 30, price: 3000 },
  { days: 60, price: 5000 },
  { days: 90, price: 7000 },
];

export const getPricing = async (): Promise<IAdPricing> => {
  let pricing = await AdPricing.findOne({ key: "default" });
  if (!pricing) {
    pricing = await AdPricing.create({
      key: "default",
      currency: (process.env.AD_CURRENCY || "usd").toLowerCase(),
      tiers: DEFAULT_TIERS,
    });
  }
  return pricing;
};

// Server-side price lookup: the client only ever sends "days".
export const priceForDuration = async (days: number) => {
  const pricing = await getPricing();
  const tier = pricing.tiers.find((t) => t.days === days);
  if (!tier) return null;
  return { amount: tier.price, currency: pricing.currency, days: tier.days };
};
