import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export type UserRole = "candidate" | "employer"| "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company?: string;      // used when role = employer
  resumeUrl?: string;    // used when role = candidate
  savedJobs?: mongoose.Types.ObjectId[];  // jobs bookmarked by candidates
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  isSuspended?: boolean;
  suspendedReason?: string;
  suspendedAt?: Date;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  getResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["candidate", "employer","admin"], required: true },
    company: { type: String, trim: true },
    resumeUrl: { type: String },
    savedJobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    isSuspended: { type: Boolean, default: false, index: true },
    suspendedReason: { type: String, trim: true, maxlength: 500 },
    suspendedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

export default mongoose.model<IUser>("User", userSchema);
