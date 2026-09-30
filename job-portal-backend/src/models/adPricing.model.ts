import mongoose, { Document, Schema } from "mongoose";

export interface IPriceTier {
  days: number;
  price: number; // minor units (cents)
}

export interface IAdPricing extends Document {
  key: string;
  currency: string;
  tiers: IPriceTier[];
}

const adPricingSchema = new Schema<IAdPricing>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    currency: { type: String, required: true, lowercase: true, default: "usd" },
    tiers: [
      {
        _id: false,
        days: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IAdPricing>("AdPricing", adPricingSchema);
