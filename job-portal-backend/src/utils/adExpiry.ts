import cron from "node-cron";
import Job from "../models/job.model";

// Turns every paid ad whose time is up into "expired". Safe to run repeatedly.
export const expireAds = async (): Promise<number> => {
  const result = await Job.updateMany(
    {
      paymentStatus: "paid",
      isActive: true,
      adExpiryDate: { $lte: new Date() },
    },
    { $set: { approvalStatus: "expired", isActive: false } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[ad-expiry] expired ${result.modifiedCount} advertisement(s)`);
  }
  return result.modifiedCount;
};

export const startAdExpiryScheduler = () => {
  // Catch up immediately (covers downtime), then every 5 minutes.
  expireAds().catch((e) => console.error("[ad-expiry] startup sweep failed:", e));
  cron.schedule("*/5 * * * *", () => {
    expireAds().catch((e) => console.error("[ad-expiry] sweep failed:", e));
  });
  console.log("[ad-expiry] scheduler started (every 5 minutes)");
};
