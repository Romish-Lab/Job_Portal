import mongoose, { Document, Schema, Types } from "mongoose";

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";
export type WorkPreference = "remote" | "on-site" | "hybrid";

export interface IApplication extends Document {
  job: Types.ObjectId;
  candidate: Types.ObjectId;

  // Applicant-submitted details
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  portfolioUrl?: string;
  highestEducation: string;
  university?: string;
  yearsOfExperience: number;
  currentLocation: string;
  expectedSalary?: number;
  availability?: string;
  workPreference?: WorkPreference;
  skills: string[];
  additionalInfo?: string;

  status: ApplicationStatus;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String, required: true, trim: true },
    portfolioUrl: { type: String, trim: true },
    highestEducation: { type: String, required: true, trim: true },
    university: { type: String, trim: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    currentLocation: { type: String, required: true, trim: true },
    expectedSalary: { type: Number, min: 0 },
    availability: { type: String, trim: true },
    workPreference: { type: String, enum: ["remote", "on-site", "hybrid"] },
    skills: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one skill is required",
      },
    },
    additionalInfo: { type: String, trim: true },

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