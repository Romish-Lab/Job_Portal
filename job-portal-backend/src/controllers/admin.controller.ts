import { Request, Response } from "express";
import Job from "../models/job.model";
import Payment from "../models/payment.model";
import User from "../models/user.model";
import AdPricing from "../models/adPricing.model";
import { getPricing } from "../utils/adPricing";
import { sendEmail } from "../utils/sendEmail";
import ContactMessage from "../models/contactMessage.model";
import mongoose from "mongoose";
import { logAudit } from "../utils/audit";
import { escapeRegex, parsePaging } from "../utils/adminHelpers";

// Best-effort: an email problem must never fail a moderation action
const notifyEmployer = async (employerId: unknown, subject: string, text: string) => {
  try {
    const employer = await User.findById(employerId).select("name email");
    if (employer) await sendEmail({ to: employer.email, subject, text: `Hi ${employer.name},\n\n${text}\n\nBest regards` });
  } catch (err) {
    console.error("Failed to send moderation email:", (err as Error).message);
  }
};

// List jobs for moderation (default: pending)
export const getAdminJobs = async (req: Request, res: Response) => {
  const allowed = ["pending", "approved", "rejected", "expired"];
  const status = String(req.query.approvalStatus || "pending");
  const filter = status === "all" ? {} : allowed.includes(status) ? { approvalStatus: status } : { approvalStatus: "pending" };

  const jobs = await Job.find(filter)
    .populate("employer", "name email company")
    .sort({ createdAt: -1 });
  res.status(200).json({ jobs });
};

export const approveJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (job.approvalStatus !== "pending" && job.approvalStatus !== "rejected") {
    return res.status(409).json({ message: `Job is already ${job.approvalStatus}` });
  }

  job.approvalStatus = "approved";
  job.rejectionReason = undefined;
  job.reviewedBy = req.user?.id as any;
  job.reviewedAt = new Date();
  await job.save();
  await logAudit(req, {
    action: "job.approve",
    targetType: "job",
    targetId: job.id,
    targetLabel: `${job.title} (${job.company})`,
  });

  notifyEmployer(
    job.employer,
    `Your job "${job.title}" was approved`,
    `Your job posting "${job.title}" was approved. Log in and choose an advertisement duration to publish it to candidates.`
  );
  res.status(200).json({ message: "Job approved", job });
};

export const rejectJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  // Only pending jobs can be rejected: an approved job may already have a payment in flight.
  if (job.approvalStatus !== "pending") {
    return res.status(409).json({ message: `Only pending jobs can be rejected (this one is ${job.approvalStatus})` });
  }

  const reason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";
  job.approvalStatus = "rejected";
  job.rejectionReason = reason || undefined;
  job.reviewedBy = req.user?.id as any;
  job.reviewedAt = new Date();
  job.isActive = false;
  await job.save();
  await logAudit(req, {
    action: "job.reject",
    targetType: "job",
    targetId: job.id,
    targetLabel: `${job.title} (${job.company})`,
    details: reason || undefined,
  });

  notifyEmployer(
    job.employer,
    `Your job "${job.title}" was not approved`,
    `Your job posting "${job.title}" was rejected.${reason ? ` Reason: ${reason}` : ""}\nYou can edit the posting to resubmit it for review.`
  );
  res.status(200).json({ message: "Job rejected", job });
};

// Advertisement overview: ?filter=all|active|expired
export const getAdvertisements = async (req: Request, res: Response) => {
  const filter = String(req.query.filter || "all");
  const now = new Date();

  const jobs = await Job.find({ paymentStatus: "paid" })
    .populate("employer", "name email company")
    .sort({ adExpiryDate: -1 });

  const payments = await Payment.find({ job: { $in: jobs.map((j) => j._id) }, status: "paid" }).sort({ paidAt: -1 });
  const latest = new Map<string, (typeof payments)[number]>();
  for (const p of payments) if (!latest.has(String(p.job))) latest.set(String(p.job), p);

  const rows = jobs.map((j) => {
    const p = latest.get(String(j._id));
    const live = j.isActive && !!j.adExpiryDate && j.adExpiryDate > now;
    return {
      _id: j._id,
      title: j.title,
      company: j.company,
      employer: j.employer,
      adDuration: j.adDuration,
      adStartDate: j.adStartDate,
      adExpiryDate: j.adExpiryDate,
      state: live ? "active" : "expired",
      amount: p?.amount ?? null,
      currency: p?.currency ?? null,
      paidAt: p?.paidAt ?? null,
    };
  });

  const revenue: Record<string, number> = {};
  for (const p of payments) revenue[p.currency] = (revenue[p.currency] || 0) + p.amount;

  res.status(200).json({
    summary: {
      paid: rows.length,
      active: rows.filter((r) => r.state === "active").length,
      expired: rows.filter((r) => r.state === "expired").length,
      revenue, // minor units per currency
    },
    advertisements: filter === "all" ? rows : rows.filter((r) => r.state === filter),
  });
};

export const getAdminPricing = async (_req: Request, res: Response) => {
  const pricing = await getPricing();
  res.status(200).json({ currency: pricing.currency, tiers: pricing.tiers });
};

// Body: { currency?: "usd", tiers: [{ days: 7, price: 1000 }, ...] }  (price in cents)
export const updateAdminPricing = async (req: Request, res: Response) => {
  const { tiers, currency } = req.body;
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return res.status(400).json({ message: "At least one price tier is required" });
  }

  const seen = new Set<number>();
  const clean: { days: number; price: number }[] = [];
  for (const t of tiers) {
    const days = Number(t?.days);
    const price = Number(t?.price);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return res.status(400).json({ message: "Days must be a whole number between 1 and 365" });
    }
    if (!Number.isInteger(price) || price < 50) {
      return res.status(400).json({ message: "Price must be a whole number of cents, at least 50" });
    }
    if (seen.has(days)) return res.status(400).json({ message: `Duplicate duration: ${days} days` });
    seen.add(days);
    clean.push({ days, price });
  }
  clean.sort((a, b) => a.days - b.days);

  const cur = typeof currency === "string" && /^[a-zA-Z]{3}$/.test(currency) ? currency.toLowerCase() : undefined;

  await getPricing(); // make sure the document exists
  const pricing = await AdPricing.findOneAndUpdate(
    { key: "default" },
    { $set: { tiers: clean, ...(cur ? { currency: cur } : {}) } },
    { new: true }
  );
  await logAudit(req, {
    action: "pricing.update",
    targetType: "pricing",
    targetLabel: "Advertisement pricing",
    details: clean.map((t) => `${t.days}d=${t.price}`).join(", ") + (cur ? ` (${cur})` : ""),
  });
  res.status(200).json({ message: "Pricing updated", currency: pricing?.currency, tiers: pricing?.tiers });
};

// ---------- Contact-us messages ----------

// GET /api/admin/messages?filter=all|unread|read&search=&page=&limit=
export const getMessages = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePaging(req.query, 10);
  const status = String(req.query.filter || "all");
  const query: Record<string, any> = {};
  if (status === "unread") query.isRead = false;
  if (status === "read") query.isRead = true;

  const search = String(req.query.search || "").trim().slice(0, 100);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
  }

  const [messages, matching, unread, total] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(query),
    ContactMessage.countDocuments({ isRead: false }),
    ContactMessage.countDocuments({}),
  ]);
  res.status(200).json({
    messages,
    unread,
    total,
    matching,
    page,
    pages: Math.max(1, Math.ceil(matching / limit)),
  });
};

// GET /api/admin/unread-count  (used by the navbar badge)
export const getUnreadCount = async (_req: Request, res: Response) => {
  const unread = await ContactMessage.countDocuments({ isRead: false });
  res.status(200).json({ unread });
};

// PATCH /api/admin/messages/:id/read   body: { isRead?: boolean } (defaults to true)
export const markMessageRead = async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Message not found" });
  const isRead = typeof req.body?.isRead === "boolean" ? req.body.isRead : true;
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead }, { new: true });
  if (!msg) return res.status(404).json({ message: "Message not found" });
  res.status(200).json({ message: "Updated", contactMessage: msg });
};

export const deleteMessage = async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Message not found" });
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  await logAudit(req, {
    action: "message.delete",
    targetType: "message",
    targetId: msg.id,
    targetLabel: `${msg.subject || "(No subject)"} — ${msg.email}`,
  });
  res.status(200).json({ message: "Message deleted" });
};
