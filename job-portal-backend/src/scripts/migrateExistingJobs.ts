// Run ONCE after deploying the approval/payment feature:
//   npx ts-node src/scripts/migrateExistingJobs.ts [graceDays]
// Jobs created before the feature have no approvalStatus, so they'd vanish from
// the public listing. This grandfathers them in as approved + paid for
// `graceDays` (default 30) so the site isn't empty on day one.
import dotenv from "dotenv";
import mongoose from "mongoose";
import Job from "../models/job.model";

dotenv.config();

(async () => {
  const graceDays = Number(process.argv[2]) || 30;
  await mongoose.connect(process.env.MONGO_URI as string);

  const now = new Date();
  const expiry = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);

  // Documents written before the new fields existed
  const result = await Job.collection.updateMany(
    { approvalStatus: { $exists: false } },
    {
      $set: {
        approvalStatus: "approved",
        paymentStatus: "paid",
        adDuration: graceDays,
        adStartDate: now,
        adExpiryDate: expiry,
        isActive: true,
      },
    }
  );
  console.log(`Migrated ${result.modifiedCount} job(s); they expire on ${expiry.toISOString()}`);
  await mongoose.disconnect();
})();
