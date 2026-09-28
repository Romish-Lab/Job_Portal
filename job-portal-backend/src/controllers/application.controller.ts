import { Request, Response } from "express";
import Application from "../models/application.model";
import Job from "../models/job.model";

// Candidate applies to a job (resume file handled by multer -> req.file)
export const applyToJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: "Job not found or closed" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const application = await Application.create({
      job: jobId,
      candidate: req.user?.id,
      resumeUrl: `/uploads/${req.file.filename}`,
      coverLetter,
    });

    res.status(201).json({ message: "Application submitted", application });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already applied to this job" });
    }
    res.status(500).json({ message: "Failed to apply", error: error.message });
  }
};

// Candidate: view their own applications
export const getMyApplications = async (req: Request, res: Response) => {
  const applications = await Application.find({ candidate: req.user?.id })
    .populate("job", "title company location")
    .sort({ createdAt: -1 });
  res.status(200).json({ applications });
};

// Employer: view applications for one of their job postings
export const getApplicationsForJob = async (req: Request, res: Response) => {
  const job = await Job.findOne({ _id: req.params.jobId, employer: req.user?.id });
  if (!job) return res.status(404).json({ message: "Job not found or not yours" });

  const applications = await Application.find({ job: job.id })
    .populate("candidate", "name email resumeUrl")
    .sort({ createdAt: -1 });

  res.status(200).json({ applications });
};

// Employer: update an application's status
export const updateApplicationStatus = async (req: Request, res: Response) => {
  const { status } = req.body;

  const application = await Application.findById(req.params.id).populate("job");
  if (!application) return res.status(404).json({ message: "Application not found" });

  const job = application.job as any;
  if (String(job.employer) !== req.user?.id) {
    return res.status(403).json({ message: "Not your job posting" });
  }

  application.status = status;
  await application.save();

  res.status(200).json({ message: "Application status updated", application });
};
