import mongoose, { Document, Schema, Types } from "mongoose";

export type JobType = "full-time" | "part-time" | "contract" | "internship" | "remote";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
export type PaymentStatus = "unpaid" | "paid" | "failed";

export interface IJob extends Document {
  title: string;
  description: string;
  requirements: string[];
  company: string;
  logoUrl?: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  type: JobType;
  employer: Types.ObjectId;

  // --- moderation ---
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;

  // --- paid advertisement ---
  paymentStatus: PaymentStatus;
  adDuration?: number; // days
  adStartDate?: Date | null;
  adExpiryDate?: Date | null;

  // true only while the advertisement is live
  isActive: boolean;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    company: { type: String, required: true },
    location: { type: String, required: true },
    logoUrl: { type: String },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
      default: "full-time",
    },
    employer: { type: Schema.Types.ObjectId, ref: "User", required: true },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },
    adDuration: { type: Number },
    adStartDate: { type: Date, default: null },
    adExpiryDate: { type: Date, default: null },

    // NOTE: default changed from true -> false. A job is only active once paid.
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", location: "text" });
// Used by the public listing and by the expiry sweeper
jobSchema.index({ approvalStatus: 1, paymentStatus: 1, isActive: 1, adExpiryDate: 1 });

export default mongoose.model<IJob>("Job", jobSchema);
