import { Request, Response } from "express";
import Job from "../models/job.model";
import Application from "../models/application.model";

// Employer creates a job posting
export const createJob = async (req: Request, res: Response) => {
  try {
    const { requirements, ...rest } = req.body;

    const job = await Job.create({
      ...rest,
      requirements: Array.isArray(requirements)
        ? requirements
        : typeof requirements === "string"
          ? requirements
              .split(",")
              .map((r: string) => r.trim())
              .filter(Boolean)
          : [],
      logoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      employer: req.user?.id,
    });

    res.status(201).json({ message: "Job posted", job });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to create job",
        error: (error as Error).message,
      });
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
    if (location)
      filter.location = new RegExp(escapeRegex(String(location)), "i");
    if (type) filter.type = type;
    if (sort === "salary")
      filter.$or = [{ salaryMax: { $gt: 0 } }, { salaryMin: { $gt: 0 } }];

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("employer", "name company")
        .sort(
          sort === "salary"
            ? { salaryMax: -1, salaryMin: -1 }
            : { createdAt: -1 }
        )
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Job.countDocuments(filter),
    ]);

    res
      .status(200)
      .json({ jobs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to fetch jobs",
        error: (error as Error).message,
      });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id).populate(
    "employer",
    "name company",
  );
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.status(200).json({ job });
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
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to load employer dashboard",
      error: error.message,
    });
  }
};

// Employer's own postings
export const getMyJobs = async (req: Request, res: Response) => {
  const jobs = await Job.find({ employer: req.user?.id }).sort({
    createdAt: -1,
  });
  res.status(200).json({ jobs });
};

export const updateJob = async (req: Request, res: Response) => {
  const job = await Job.findOne({ _id: req.params.id, employer: req.user?.id });
  if (!job)
    return res.status(404).json({ message: "Job not found or not yours" });

  Object.assign(job, req.body);
  await job.save();
  res.status(200).json({ message: "Job updated", job });
};

export const deleteJob = async (req: Request, res: Response) => {
  const job = await Job.findOneAndDelete({
    _id: req.params.id,
    employer: req.user?.id,
  });
  if (!job)
    return res.status(404).json({ message: "Job not found or not yours" });
  res.status(200).json({ message: "Job deleted" });
};