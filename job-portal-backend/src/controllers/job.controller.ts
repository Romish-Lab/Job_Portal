import { Request, Response } from "express";
import Job from "../models/job.model";
import Application from "../models/application.model";
import mongoose from "mongoose";

const JOB_TYPES = ["full-time", "part-time", "contract", "internship", "remote"];
const MAX_LIMIT = 50;

const normalizeRequirements = (requirements: unknown): string[] =>
  Array.isArray(requirements)
    ? requirements.map((r) => String(r).trim()).filter(Boolean)
    : typeof requirements === "string"
      ? requirements.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

// Only these fields may be set/changed by an employer (blocks mass assignment,
// e.g. a candidate-crafted request trying to set `employer` or `isActive` directly)
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
  if (body.isActive !== undefined) out.isActive = body.isActive === true || body.isActive === "true";
  return out;
};

// Employer creates a job posting
export const createJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.create({
      ...pickJobFields(req.body),
      logoUrl: req.file ? `/uploads/logos/${req.file.filename}` : undefined,
      employer: req.user?.id,
    });

    res.status(201).json({ message: "Job posted", job });
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

    const filter: Record<string, unknown> = { isActive: true };
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
      .select("_id title company location type isActive createdAt")
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
        activeJobs: jobs.filter((job) => job.isActive).length,
        totalApplications,
        pending,
        reviewed,
        accepted,
        rejected,
      },
      recentApplications,
      jobs: jobs.slice(0, 5),
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
    res.status(200).json({ jobs });
  } catch (error) {
    console.error("getMyJobs error:", error);
    res.status(500).json({ message: "Failed to load your jobs" });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Job not found or not yours" });
    }
    const job = await Job.findOne({ _id: req.params.id, employer: req.user?.id });
    if (!job) return res.status(404).json({ message: "Job not found or not yours" });

    Object.assign(job, pickJobFields(req.body));
    await job.save();
    res.status(200).json({ message: "Job updated", job });
  } catch (error) {
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