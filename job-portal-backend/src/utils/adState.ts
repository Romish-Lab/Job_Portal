import { IJob } from "../models/job.model";

export const EXPIRING_SOON_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AdState =
  | "pending_approval"
  | "rejected"
  | "payment_required"
  | "awaiting_payment"
  | "active"
  | "expiring_soon"
  | "expired";

// The ONE definition of "candidates may see this job".
// Used by the public listing, the job detail route and applying.
export const publicJobFilter = (now: Date = new Date()) => ({
  approvalStatus: "approved" as const,
  paymentStatus: "paid" as const,
  isActive: true,
  adExpiryDate: { $gt: now },
});

export const isPubliclyVisible = (job: IJob, now: Date = new Date()): boolean =>
  job.approvalStatus === "approved" &&
  job.paymentStatus === "paid" &&
  job.isActive === true &&
  !!job.adExpiryDate &&
  job.adExpiryDate.getTime() > now.getTime();

export const getDaysRemaining = (job: IJob, now: Date = new Date()): number => {
  if (!job.adExpiryDate) return 0;
  const ms = job.adExpiryDate.getTime() - now.getTime();
  return ms > 0 ? Math.ceil(ms / DAY_MS) : 0;
};

// Employer-facing state. Also correct if the cron sweeper hasn't run yet.
export const computeAdState = (
  job: IJob,
  hasOpenCheckout = false,
  now: Date = new Date()
): AdState => {
  if (job.approvalStatus === "rejected") return "rejected";
  if (job.approvalStatus === "pending") return "pending_approval";

  const expiredByDate = !!job.adExpiryDate && job.adExpiryDate.getTime() <= now.getTime();
  if (job.approvalStatus === "expired" || (job.paymentStatus === "paid" && expiredByDate)) {
    return "expired";
  }

  if (isPubliclyVisible(job, now)) {
    return getDaysRemaining(job, now) <= EXPIRING_SOON_DAYS ? "expiring_soon" : "active";
  }

  // approved but not paid
  return hasOpenCheckout ? "awaiting_payment" : "payment_required";
};
