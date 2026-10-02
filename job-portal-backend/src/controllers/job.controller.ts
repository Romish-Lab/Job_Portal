import { Request, Response } from "express";
import Job from "../models/job.model";
import Application from "../models/application.model";
import mongoose from "mongoose";
import Payment from "../models/payment.model";
import {
  publicJobFilter,
  isPubliclyVisible,
  computeAdState,
  getDaysRemaining,
} from "../utils/adState";

const JOB_TYPES = ["full-time", "part-time", "contract", "internship", "remote"];
const MAX_LIMIT = 50;

const normalizeRequirements = (requirements: unknown): string[] =>
  Array.isArray(requirements)
    ? requirements.map((r) => String(r).trim()).filter(Boolean)
    : typeof requirements === "string"
      ? requirements.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

// Only these fields may be set/changed by an employer (blocks mass assignment).
// approvalStatus, paymentStatus, isActive and the ad dates are NEVER taken from the
// request: they are set by the admin-approval and Stripe payment flows only.
const pickJobFields = (body: Record<string, any>) => {
  const out: Record<string, unknown> = {};
  for (const key of ["title", "description", "company", "location"]) {
    if (typeof body[key] === "string") out[key] = body[key].trim();
  }
  for (const key of ["salaryMin", "salaryMax"]) {
    if (body[key] !== undefined && body[key] !== "" && !Number.isNaN(Number(body[key]))) {
      out[key] = Number(body[key]);
    }
  }
  if (JOB_TYPES.includes(body.type)) out.type = body.type;
  if (body.requirements !== undefined) out.requirements = normalizeRequirements(body.requirements);
  return out;
};

// Employer creates a job posting
export const createJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.create({
      ...pickJobFields(req.body),
      logoUrl: req.file ? `/uploads/logos/${req.file.filename}` : undefined,
      employer: req.user?.id,
      approvalStatus: "pending",
      paymentStatus: "unpaid",
      isActive: false,
    });

    res.status(201).json({ message: "Job submitted. Waiting for admin approval.", job });
  } catch (error) {
    if ((error as any).name === "ValidationError") {
      return res.status(400).json({ message: (error as Error).message });
    }
    console.error("createJob error:", error);
    res.status(500).json({ message: "Failed to create job" });
  }
};

// Public: list jobs with optional search/filter/pagination
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getJobs = async (req: Request, res: Response) => {
  try {
    const {
      search,
      title,
      company,
      location,
      type,
      page = "1",
      limit = "10",
      sort,
    } = req.query;

    // Visibility is enforced on every request, so expired ads disappear
    // even if the cron sweeper hasn't run yet.
    const filter: Record<string, unknown> = { ...publicJobFilter() };
    if (search) filter.$text = { $search: String(search) };
    if (title) filter.title = new RegExp(escapeRegex(String(title)), "i");
    if (company) filter.company = new RegExp(escapeRegex(String(company)), "i");
    if (location) filter.location = new RegExp(escapeRegex(String(location)), "i");
    if (type && JOB_TYPES.includes(String(type))) filter.type = type;
    if (sort === "salary") filter.$or = [{ salaryMax: { $gt: 0 } }, { salaryMin: { $gt: 0 } }];

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 10, 1), MAX_LIMIT);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .select("-rejectionReason -reviewedBy -reviewedAt")
        .populate("employer", "name company")
        .sort(sort === "salary" ? { salaryMax: -1, salaryMin: -1 } : { createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Job.countDocuments(filter),
    ]);

    res.status(200).json({ jobs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("getJobs error:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Job not found" });
    }
    const job = await Job.findById(req.params.id).populate("employer", "name company");
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Non-public jobs (pending/rejected/unpaid/expired) are visible only to the owner and admins
    const employerId = String((job.employer as any)?._id ?? job.employer);
    const isOwner = req.user?.id === employerId;
    const isAdmin = req.user?.role === "admin";
    if (!isPubliclyVisible(job) && !isOwner && !isAdmin) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json({ job });
  } catch (error) {
    console.error("getJobById error:", error);
    res.status(500).json({ message: "Failed to fetch job" });
  }
};

// Employer dashboard: summary statistics and recent applications
export const getEmployerDashboard = async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.id;

    const jobs = await Job.find({ employer: employerId })
      .select("_id title company location type isActive approvalStatus paymentStatus adExpiryDate createdAt")
      .sort({ createdAt: -1 });

    const jobIds = jobs.map((job) => job._id);

    const [totalApplications, pending, reviewed, accepted, rejected, recentApplications] =
      await Promise.all([
        Application.countDocuments({ job: { $in: jobIds } }),
        Application.countDocuments({ job: { $in: jobIds }, status: "pending" }),
        Application.countDocuments({ job: { $in: jobIds }, status: "reviewed" }),
        Application.countDocuments({ job: { $in: jobIds }, status: "accepted" }),
        Application.countDocuments({ job: { $in: jobIds }, status: "rejected" }),
        Application.find({ job: { $in: jobIds } })
          .populate("candidate", "name email")
          .populate("job", "title company")
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    res.status(200).json({
      stats: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((job) => isPubliclyVisible(job)).length,
        pendingApproval: jobs.filter((job) => job.approvalStatus === "pending").length,
        needPayment: jobs.filter(
          (job) => job.approvalStatus === "approved" && !isPubliclyVisible(job),
        ).length,
        totalApplications,
        pending,
        reviewed,
        accepted,
        rejected,
      },
      recentApplications,
      jobs: jobs.slice(0, 5).map((job) => ({
        ...job.toObject(),
        adState: computeAdState(job),
        daysRemaining: getDaysRemaining(job),
      })),
    });
  } catch (error) {
    console.error("getEmployerDashboard error:", error);
    res.status(500).json({ message: "Failed to load employer dashboard" });
  }
};

// Employer's own postings
export const getMyJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({ employer: req.user?.id }).sort({ createdAt: -1 });

    // A checkout opened in the last 24h that hasn't finished yet
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const open = await Payment.find({
      job: { $in: jobs.map((j) => j._id) },
      status: "pending",
      createdAt: { $gte: since },
    }).select("job");
    const openSet = new Set(open.map((p) => String(p.job)));

    const now = new Date();
    res.status(200).json({
      jobs: jobs.map((j) => ({
        ...j.toObject(),
        adState: computeAdState(j, openSet.has(String(j._id)), now),
        daysRemaining: getDaysRemaining(j, now),
      })),
    });
  } catch (error) {
    console.error("getMyJobs error:", error);
    res.status(500).json({ message: "Failed to load your jobs" });
  }
};

import fs from "fs";
import { getStripe } from "../utils/stripe";

// ---- helpers for updateJob ----
const sameValue = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// A logo uploaded on a request that is then rejected must not stay on disk
const discardUpload = (req: Request) => {
  if (req.file) fs.unlink(req.file.path, () => {});
};

// Closes unfinished Stripe checkouts for a job. Without this, a checkout opened BEFORE an
// edit could be paid AFTER it, and the payment flow would publish the edited content
// without it being reviewed again.
const closeOpenCheckouts = async (jobId: unknown) => {
  const open = await Payment.find({ job: jobId, status: "pending" });
  for (const p of open) {
    if (p.stripeSessionId) {
      try {
        await getStripe().checkout.sessions.expire(p.stripeSessionId);
      } catch {
        /* already expired/completed */
      }
    }
    p.status = "expired";
    await p.save();
  }
};

// PUT /api/jobs/:id  (JSON or multipart, so the logo can be replaced)
export const updateJob = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      discardUpload(req);
      return res.status(404).json({ message: "Job not found or not yours" });
    }
    const job = await Job.findOne({ _id: req.params.id, employer: req.user?.id });
    if (!job) {
      discardUpload(req);
      return res.status(404).json({ message: "Job not found or not yours" });
    }

    // A live, paid ad can't be edited: that would bypass moderation.
    if (isPubliclyVisible(job)) {
      discardUpload(req);
      return res.status(409).json({
        message: "A live advertisement can't be edited. Contact an admin.",
      });
    }

    const updates: Record<string, unknown> = pickJobFields(req.body);
    // An empty salary field in the edit form means "remove it"
    for (const key of ["salaryMin", "salaryMax"]) {
      if (req.body[key] === "") updates[key] = undefined;
    }
    if (req.file) updates.logoUrl = `/uploads/logos/${req.file.filename}`;

    const changed = Object.entries(updates).some(
      ([key, value]) => !sameValue((job as any)[key], value),
    );
    // Content that an admin already approved (including expired ads and approved-but-unpaid jobs)
    const wasApproved = job.approvalStatus === "approved" || job.approvalStatus === "expired";

    Object.assign(job, updates);

    let resubmitted = false;
    if (job.approvalStatus === "rejected") {
      // Editing a rejected job resubmits it for review
      job.approvalStatus = "pending";
      job.rejectionReason = undefined;
      resubmitted = true;
    } else if (wasApproved && changed) {
      // Edited content must be reviewed again before it can be advertised.
      // isActive MUST go false too: the expiry sweeper flips any isActive+paid+past-expiry
      // job to "expired", which the checkout accepts, so it would undo this review.
      // paymentStatus and the ad dates are kept: admin ad history and revenue depend on them.
      job.approvalStatus = "pending";
      job.isActive = false;
      job.rejectionReason = undefined;
      job.reviewedBy = undefined;
      job.reviewedAt = undefined;
      resubmitted = true;
      await closeOpenCheckouts(job._id);
    }

    await job.save();
    res.status(200).json({
      message: resubmitted
        ? "Changes saved. Your job is back in review; once approved you can advertise it again."
        : "Job updated",
      job,
      resubmitted,
    });
  } catch (error) {
    discardUpload(req);
    if ((error as any).name === "ValidationError") {
      return res.status(400).json({ message: (error as Error).message });
    }
    console.error("updateJob error:", error);
    res.status(500).json({ message: "Failed to update job" });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Job not found or not yours" });
    }
    const job = await Job.findOneAndDelete({ _id: req.params.id, employer: req.user?.id });
    if (!job) return res.status(404).json({ message: "Job not found or not yours" });
    // Remove the now-orphaned applications
    await Application.deleteMany({ job: job._id });
    res.status(200).json({ message: "Job deleted" });
  } catch (error) {
    console.error("deleteJob error:", error);
    res.status(500).json({ message: "Failed to delete job" });
  }
};