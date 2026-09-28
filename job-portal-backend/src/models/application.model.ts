import mongoose, { Document, Schema, Types } from "mongoose";

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface IApplication extends Document {
  job: Types.ObjectId;
  candidate: Types.ObjectId;
  resumeUrl: string;
  coverLetter?: string;
  status: ApplicationStatus;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// A candidate can only apply once per job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model<IApplication>("Application", applicationSchema);
