import mongoose, { Document, Schema, Types } from "mongoose";

export type InterviewType = "phone" | "video" | "in-person" | "technical";
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";

export interface IInterview extends Document {
  application: Types.ObjectId;
  job: Types.ObjectId;
  candidate: Types.ObjectId;
  employer: Types.ObjectId;

  type: InterviewType;
  status: InterviewStatus;
  scheduledDate: Date;
  duration: number; // in minutes
  location?: string;
  meetingLink?: string;
  notes?: string;

  feedback?: string;
  rating?: number; // 1-5
  result?: "passed" | "failed" | "pending";
}

const interviewSchema = new Schema<IInterview>(
  {
    application: { type: Schema.Types.ObjectId, ref: "Application", required: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employer: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["phone", "video", "in-person", "technical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
    scheduledDate: { type: Date, required: true },
    duration: { type: Number, required: true, default: 60 },
    location: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    notes: { type: String, trim: true },

    feedback: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    result: { type: String, enum: ["passed", "failed", "pending"] },
  },
  { timestamps: true }
);

// Indexes for efficient querying
interviewSchema.index({ candidate: 1, scheduledDate: 1 });
interviewSchema.index({ employer: 1, scheduledDate: 1 });
interviewSchema.index({ application: 1 });
interviewSchema.index({ status: 1, scheduledDate: 1 });

export default mongoose.model<IInterview>("Interview", interviewSchema);
