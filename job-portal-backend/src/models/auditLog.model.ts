import mongoose, { Document, Schema, Types } from "mongoose";

export type AuditAction =
  | "job.approve"
  | "job.reject"
  | "user.suspend"
  | "user.unsuspend"
  | "user.delete"
  | "message.delete"
  | "pricing.update";

export interface IAuditLog extends Document {
  actor?: Types.ObjectId;
  actorName: string; // snapshots, so the log still reads well if the admin is deleted
  actorEmail: string;
  action: AuditAction;
  targetType: "job" | "user" | "message" | "pricing";
  targetId?: string;
  targetLabel?: string;
  details?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "Unknown" },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String },
    targetLabel: { type: String },
    details: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
