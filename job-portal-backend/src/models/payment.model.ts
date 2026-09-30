import mongoose, { Document, Schema, Types } from "mongoose";

export type PaymentRecordStatus = "pending" | "paid" | "failed" | "expired";

export interface IPayment extends Document {
  job: Types.ObjectId;
  employer: Types.ObjectId;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  amount: number; // minor units (cents)
  currency: string;
  durationDays: number;
  status: PaymentRecordStatus;
  paidAt?: Date;
  adStartDate?: Date;
  adExpiryDate?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    employer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, lowercase: true },
    durationDays: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
    },
    paidAt: { type: Date },
    adStartDate: { type: Date },
    adExpiryDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", paymentSchema);
