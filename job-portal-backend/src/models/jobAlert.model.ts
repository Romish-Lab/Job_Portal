import mongoose, { Document, Schema, Types } from "mongoose";

export interface IJobAlert extends Document {
  user: Types.ObjectId;
  keywords: string[];
  location?: string;
  jobType?: string[];
  salaryMin?: number;
  isActive: boolean;
  frequency: "instant" | "daily" | "weekly";
  lastSent?: Date;
}

const jobAlertSchema = new Schema<IJobAlert>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    keywords: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one keyword is required",
      },
    },
    location: { type: String, trim: true },
    jobType: {
      type: [String],
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
    },
    salaryMin: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ["instant", "daily", "weekly"],
      default: "daily",
    },
    lastSent: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient alert matching
jobAlertSchema.index({ user: 1, isActive: 1 });
jobAlertSchema.index({ isActive: 1, frequency: 1, lastSent: 1 });

export default mongoose.model<IJobAlert>("JobAlert", jobAlertSchema);
