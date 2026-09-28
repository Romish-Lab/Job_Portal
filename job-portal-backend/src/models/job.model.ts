import mongoose, { Document, Schema, Types } from "mongoose";

export type JobType = "full-time" | "part-time" | "contract" | "internship" | "remote";

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
  isActive: boolean;

  
}


const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    company: { type: String, required: true },
    location: { type: String, required: true },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
      default: "full-time",
    },
    employer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", location: "text" });

export default mongoose.model<IJob>("Job", jobSchema);
