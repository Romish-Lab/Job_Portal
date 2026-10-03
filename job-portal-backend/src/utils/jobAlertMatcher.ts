import JobAlert, { IJobAlert } from "../models/jobAlert.model";
import Job, { IJob } from "../models/job.model";
import User from "../models/user.model";
import { sendEmail } from "./sendEmail";
import { publicJobFilter } from "./adState";

const MAX_ALERTS_PER_USER = 10;
export { MAX_ALERTS_PER_USER };

// ─── Matching helpers ──────────────────────────────────────────────────────────

/**
 * Returns true when the job satisfies every non-empty criterion on the alert.
 */
const alertMatchesJob = (alert: IJobAlert, job: IJob): boolean => {
  const haystack = [
    job.title,
    job.description,
    job.company,
    ...(job.requirements || []),
  ]
    .join(" ")
    .toLowerCase();

  const keywordHit = alert.keywords.some((kw) =>
    haystack.includes(kw.toLowerCase())
  );
  if (!keywordHit) return false;

  if (alert.location) {
    if (
      !job.location ||
      !job.location.toLowerCase().includes(alert.location.toLowerCase())
    ) {
      return false;
    }
  }

  if (alert.jobType && alert.jobType.length > 0) {
    if (!alert.jobType.includes(job.type)) return false;
  }

  if (alert.salaryMin != null && alert.salaryMin > 0) {
    const bestSalary = job.salaryMax ?? job.salaryMin ?? 0;
    if (bestSalary < alert.salaryMin) return false;
  }

  return true;
};

// ─── Build HTML email ──────────────────────────────────────────────────────────

const jobCardHtml = (job: IJob): string => {
  const salary =
    job.salaryMin || job.salaryMax
      ? `$${(job.salaryMin ?? 0).toLocaleString()}${job.salaryMax ? ` – $${job.salaryMax.toLocaleString()}` : "+"}`
      : "Not specified";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;background:#fff;">
      <h3 style="margin:0 0 4px;color:#1f2937;">${job.title}</h3>
      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
        ${job.company} · ${job.location} · ${job.type} · ${salary}
      </p>
      <a href="${clientUrl}/jobs/${job._id}"
         style="display:inline-block;padding:8px 18px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">
        View Job
      </a>
    </div>`;
};

const buildDigestHtml = (
  userName: string,
  jobs: IJob[],
  frequency: string
): string => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:35px 30px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:26px;">🔔 Job Alert</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
        ${jobs.length} new matching job${jobs.length !== 1 ? "s" : ""} (${frequency})
      </p>
    </div>
    <div style="padding:30px;">
      <p style="color:#374151;font-size:15px;">Hi ${userName},</p>
      <p style="color:#374151;font-size:15px;">We found jobs that match your alert criteria:</p>
      ${jobs.map(jobCardHtml).join("")}
      <div style="text-align:center;margin-top:24px;">
        <a href="${clientUrl}/jobs"
           style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">
          Browse All Jobs
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px 30px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        Manage your alerts in <a href="${clientUrl}/job-alerts" style="color:#2563eb;">Job Alerts</a>.
      </p>
    </div>
  </div>`;
};

// ─── Instant alerts: fire when a specific job goes live ────────────────────────

/**
 * Called right after a job becomes publicly visible (payment activation).
 * Finds alerts with frequency="instant", matches them, and sends emails.
 */
export const matchInstantAlertsForJob = async (
  jobId: unknown
): Promise<number> => {
  try {
    const job = await Job.findById(jobId);
    if (!job) return 0;

    const alerts = await JobAlert.find({
      isActive: true,
      frequency: "instant",
    }).lean();
    if (alerts.length === 0) return 0;

    // Group matching alerts by user
    const userAlerts = new Map<string, IJobAlert[]>();
    for (const alert of alerts) {
      if (alertMatchesJob(alert as unknown as IJobAlert, job)) {
        const uid = String(alert.user);
        const arr = userAlerts.get(uid) || [];
        arr.push(alert as unknown as IJobAlert);
        userAlerts.set(uid, arr);
      }
    }

    let sent = 0;
    for (const [userId, matchedAlerts] of userAlerts) {
      try {
        const user = await User.findById(userId).select("name email");
        if (!user) continue;

        await sendEmail({
          to: user.email,
          subject: `New job match: ${job.title} at ${job.company}`,
          html: buildDigestHtml(user.name, [job], "instant"),
        });

        const alertIds = matchedAlerts.map((a) => a._id);
        await JobAlert.updateMany(
          { _id: { $in: alertIds } },
          { $set: { lastSent: new Date() } }
        );
        sent++;
      } catch (err) {
        console.error(
          `[job-alerts] Failed to send instant alert to user ${userId}:`,
          (err as Error).message
        );
      }
    }

    if (sent > 0) {
      console.log(
        `[job-alerts] Sent instant alerts to ${sent} user(s) for job "${job.title}"`
      );
    }
    return sent;
  } catch (err) {
    console.error("[job-alerts] matchInstantAlertsForJob error:", err);
    return 0;
  }
};

// ─── Scheduled digest: called by cron for daily/weekly ─────────────────────────

/**
 * Processes all active alerts for the given frequency.
 * Finds jobs that became publicly visible since the alert's lastSent
 * (or since 24h/7d ago if never sent), matches them, and sends digest emails.
 */
export const processScheduledAlerts = async (
  frequency: "daily" | "weekly"
): Promise<number> => {
  try {
    const windowMs =
      frequency === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - windowMs);

    const alerts = await JobAlert.find({
      isActive: true,
      frequency,
      $or: [{ lastSent: { $lte: cutoff } }, { lastSent: null }],
    }).lean();
    if (alerts.length === 0) return 0;

    const liveFilter = publicJobFilter();
    const recentJobs = await Job.find({
      ...liveFilter,
      adStartDate: { $gte: cutoff },
    })
      .sort({ adStartDate: -1 })
      .limit(200)
      .lean();

    if (recentJobs.length === 0) {
      await JobAlert.updateMany(
        { _id: { $in: alerts.map((a) => a._id) } },
        { $set: { lastSent: new Date() } }
      );
      return 0;
    }

    // Group matching jobs by user
    const userJobs = new Map<
      string,
      { jobs: Set<string>; alertIds: string[] }
    >();

    for (const alert of alerts) {
      const uid = String(alert.user);
      if (!userJobs.has(uid))
        userJobs.set(uid, { jobs: new Set(), alertIds: [] });
      const entry = userJobs.get(uid)!;
      entry.alertIds.push(String(alert._id));

      for (const job of recentJobs) {
        if (alertMatchesJob(alert as unknown as IJobAlert, job as unknown as IJob)) {
          entry.jobs.add(String(job._id));
        }
      }
    }

    let sent = 0;
    const jobCache = new Map<string, IJob>();
    for (const j of recentJobs) jobCache.set(String(j._id), j as unknown as IJob);

    for (const [userId, { jobs: jobIdSet, alertIds }] of userJobs) {
      if (jobIdSet.size === 0) {
        await JobAlert.updateMany(
          { _id: { $in: alertIds } },
          { $set: { lastSent: new Date() } }
        );
        continue;
      }

      try {
        const user = await User.findById(userId).select("name email");
        if (!user) continue;

        const matchedJobs = [...jobIdSet]
          .map((id) => jobCache.get(id)!)
          .filter(Boolean)
          .slice(0, 20);

        await sendEmail({
          to: user.email,
          subject: `Your ${frequency} job alert: ${matchedJobs.length} new match${matchedJobs.length !== 1 ? "es" : ""}`,
          html: buildDigestHtml(user.name, matchedJobs, frequency),
        });

        await JobAlert.updateMany(
          { _id: { $in: alertIds } },
          { $set: { lastSent: new Date() } }
        );
        sent++;
      } catch (err) {
        console.error(
          `[job-alerts] Failed to send ${frequency} digest to user ${userId}:`,
          (err as Error).message
        );
      }
    }

    if (sent > 0) {
      console.log(`[job-alerts] Sent ${frequency} digests to ${sent} user(s)`);
    }
    return sent;
  } catch (err) {
    console.error(
      `[job-alerts] processScheduledAlerts(${frequency}) error:`,
      err
    );
    return 0;
  }
};

