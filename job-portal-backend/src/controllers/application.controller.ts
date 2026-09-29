import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Application from "../models/application.model";
import Job from "../models/job.model";
import User from "../models/user.model";
import { sendEmail } from "../utils/sendEmail";
import { UPLOADS_ROOT, RESUME_DIR } from "../middleware/upload.middleware";

const STATUSES = ["pending", "reviewed", "accepted", "rejected"];
const MAX_LIMIT = 50;

// Candidate applies to a job (resume file handled by multer -> req.file)
export const applyToJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

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
      // Stored as a relative path; served only via GET /api/applications/:id/resume
      resumeUrl: `resumes/${req.file.filename}`,
      coverLetter,
    });

    res.status(201).json({ message: "Application submitted", application });
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You already applied to this job" });
    }
    console.error("Apply error:", error);
    res.status(500).json({ message: "Failed to apply" });
  }
};

// Candidate: view their own applications
export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const applications = await Application.find({ candidate: req.user?.id })
      .populate("job", "title company location")
      .sort({ createdAt: -1 });
    res.status(200).json({ applications });
  } catch (error) {
    console.error("getMyApplications error:", error);
    res.status(500).json({ message: "Failed to load applications" });
  }
};

// Employer: view applications for one of their job postings
export const getApplicationsForJob = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    const job = await Job.findOne({
      _id: req.params.jobId,
      employer: req.user?.id,
    });
    if (!job)
      return res.status(404).json({ message: "Job not found or not yours" });

    const pageNum = Math.max(Number(req.query.page) || 1, 1);
    const limitNum = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      MAX_LIMIT,
    );
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Application.find({ job: job.id })
        .populate("candidate", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Application.countDocuments({ job: job.id }),
    ]);

    res.status(200).json({
      applications,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getApplicationsForJob error:", error);
    res.status(500).json({ message: "Failed to load applicants" });
  }
};

// Authenticated resume download: only the candidate who applied, the employer
// who owns the job, or an admin may fetch the file.
export const downloadResume = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }
    const application = await Application.findById(req.params.id).populate(
      "job",
      "employer",
    );
    if (!application)
      return res.status(404).json({ message: "Application not found" });

    const userId = req.user?.id;
    const isCandidate = String(application.candidate) === userId;
    const isEmployer = String((application.job as any)?.employer) === userId;
    const isAdmin = req.user?.role === "admin";
    if (!isCandidate && !isEmployer && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not allowed to view this resume" });
    }

    // basename() blocks path traversal; fall back to the legacy public folder for old records
    const filename = path.basename(application.resumeUrl);
    const candidates = [
      path.join(RESUME_DIR, filename),
      path.join(UPLOADS_ROOT, filename),
    ];
    const file = candidates.find((f) => fs.existsSync(f));
    if (!file)
      return res.status(404).json({ message: "Resume file not found" });

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.sendFile(file);
  } catch (error) {
    console.error("downloadResume error:", error);
    res.status(500).json({ message: "Failed to load resume" });
  }
};

// Employer: update an application's status
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ message: `Status must be one of: ${STATUSES.join(", ")}` });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const application = await Application.findById(req.params.id).populate(
      "job",
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = application.job as any;

    if (String(job.employer) !== req.user?.id) {
      return res.status(403).json({ message: "Not your job posting" });
    }

    const wasAccepted = application.status === "accepted";

    application.status = status;
    await application.save();

    // Email the candidate only when the status newly becomes "accepted"
    if (status === "accepted" && !wasAccepted) {
      try {
        const candidate = await User.findById(application.candidate).select(
          "name email",
        );

        if (candidate) {
          await sendEmail({
            to: candidate.email,
            subject: `Your application for ${job.title} was accepted`,
            text: `Hi ${candidate.name},

Good news! Your application for "${job.title}" at ${job.company} has been accepted. The employer will contact you with next steps.

Best regards`,
          });
        }
      } catch (err) {
        console.error("Failed to send acceptance email:", err);
      }
    }

    return res.status(200).json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update application status" });
  }
};
