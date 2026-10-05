import mongoose, { Document, Schema, Types } from "mongoose";

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";
export type WorkPreference = "remote" | "on-site" | "hybrid";
export type Gender = "male" | "female" | "other" | "prefer-not-to-say";

export interface IApplication extends Document {
  job: Types.ObjectId;
  candidate: Types.ObjectId;

  // Applicant-submitted details
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  photoUrl: string;
  coverLetter: string;
  portfolioUrl?: string;
  dateOfBirth: Date;
  gender: Gender;
  nationality: string;
  address: string;
  highestEducation: string;
  university?: string;
  yearsOfExperience: number;
  currentLocation: string;
  expectedSalary: number;
  availability: string;
  workPreference: WorkPreference;
  skills: string[];
  additionalInfo?: string;
  declarationAccepted: boolean;

  status: ApplicationStatus;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Phone number must contain exactly 10 digits"],
    },
    resumeUrl: { type: String, required: true },
    photoUrl: { type: String, required: true },
    coverLetter: { type: String, required: true, trim: true },
    portfolioUrl: { type: String, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
      required: true,
    },
    nationality: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    highestEducation: { type: String, required: true, trim: true },
    university: { type: String, trim: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    currentLocation: { type: String, required: true, trim: true },
    expectedSalary: { type: Number, required: true, min: 0 },
    availability: { type: String, required: true, trim: true },
    workPreference: {
      type: String,
      enum: ["remote", "on-site", "hybrid"],
      required: true,
    },
    skills: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one skill is required",
      },
    },
    additionalInfo: { type: String, trim: true },
    declarationAccepted: { type: Boolean, required: true },

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
