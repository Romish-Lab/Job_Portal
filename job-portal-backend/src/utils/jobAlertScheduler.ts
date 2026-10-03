import cron from "node-cron";
import { processScheduledAlerts } from "./jobAlertMatcher";

export const startJobAlertScheduler = () => {
  // Daily digest: every day at 8:00 AM
  cron.schedule("0 8 * * *", () => {
    processScheduledAlerts("daily").catch((e: Error) =>
      console.error("[job-alerts] daily digest failed:", e)
    );
  });

  // Weekly digest: every Monday at 8:00 AM
  cron.schedule("0 8 * * 1", () => {
    processScheduledAlerts("weekly").catch((e: Error) =>
      console.error("[job-alerts] weekly digest failed:", e)
    );
  });

  console.log("[job-alerts] scheduler started (daily at 8 AM, weekly Mon 8 AM)");
};
