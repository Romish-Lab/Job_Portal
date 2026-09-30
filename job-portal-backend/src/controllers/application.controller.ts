import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Application from "../models/application.model";
import Job from "../models/job.model";
import { isPubliclyVisible } from "../utils/adState";
import User from "../models/user.model";
import { sendEmail } from "../utils/sendEmail";
import { UPLOADS_ROOT, RESUME_DIR } from "../middleware/upload.middleware";
const STATUSES = ["pending", "reviewed", "accepted", "rejected"];
const MAX_LIMIT = 50;

// Candidate applies to a job (resume file handled by multer -> req.file)
export const applyToJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const {
      fullName,
      email,
      phone,
      coverLetter,
      portfolioUrl,
      highestEducation,
      university,
      yearsOfExperience,
      currentLocation,
      expectedSalary,
      availability,
      workPreference,
      skills, // comma-separated string from the form
      additionalInfo,
    } = req.body;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await Job.findById(jobId);
    if (!job || !isPubliclyVisible(job)) {
      return res.status(404).json({ message: "Job not found or closed" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const required: Record<string, unknown> = {
      fullName,
      email,
      phone,
      coverLetter,
      highestEducation,
      yearsOfExperience,
      currentLocation,
      skills,
    };
    const missing = Object.entries(required)
      .filter(
        ([, v]) => v === undefined || v === null || String(v).trim() === "",
      )
      .map(([k]) => k);
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing required field(s): ${missing.join(", ")}` });
    }

    const workPreferences = ["remote", "on-site", "hybrid"];
    if (workPreference && !workPreferences.includes(workPreference)) {
      return res.status(400).json({
        message: `Work preference must be one of: ${workPreferences.join(", ")}`,
      });
    }

    const skillsArray = String(skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillsArray.length === 0) {
      return res
        .status(400)
        .json({ message: "Please list at least one skill" });
    }

    const application = await Application.create({
      job: jobId,
      candidate: req.user?.id,
      fullName,
      email,
      phone,
      // Stored as a relative path; served only via GET /api/applications/:id/resume
      resumeUrl: `resumes/${req.file.filename}`,
      coverLetter,
      portfolioUrl: portfolioUrl || undefined,
      highestEducation,
      university: university || undefined,
      yearsOfExperience: Number(yearsOfExperience),
      currentLocation,
      expectedSalary: expectedSalary ? Number(expectedSalary) : undefined,
      availability: availability || undefined,
      workPreference: workPreference || undefined,
      skills: skillsArray,
      additionalInfo: additionalInfo || undefined,
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
          // console.log(
          //   `Sending acceptance email to ${candidate.email} for application ${application.id}`,
          // );
await sendEmail({
  to: candidate.email,
  subject: `Your application for ${job.title} was accepted 🎉`,
  html: `
    <div style="
      margin: 0;
      padding: 40px 20px;
      background-color: #f4f7fb;
      font-family: Arial, Helvetica, sans-serif;
    ">
      <div style="
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      ">

        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #111827, #2563eb);
          padding: 35px 30px;
          text-align: center;
          color: #ffffff;
        ">
          <div style="
            display: inline-block;
            background: rgba(255,255,255,0.15);
            padding: 12px;
            border-radius: 50%;
            font-size: 28px;
            margin-bottom: 12px;
          ">
            ✓
          </div>

          <h1 style="
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          ">
            Application Accepted!
          </h1>

          <p style="
            margin: 10px 0 0;
            font-size: 15px;
            color: #dbeafe;
          ">
            Great news about your job application
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 35px 30px;">

          <p style="
            margin: 0 0 18px;
            font-size: 16px;
            color: #111827;
          ">
            Hi <strong>${candidate.name}</strong>,
          </p>

          <p style="
            margin: 0 0 25px;
            font-size: 15px;
            line-height: 1.7;
            color: #4b5563;
          ">
            We're excited to let you know that your application has been
            <strong style="color: #16a34a;">accepted</strong>!
            The employer will contact you with the next steps.
          </p>

          <!-- Job Card -->
          <div style="
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 22px;
            margin: 25px 0;
          ">

            <p style="
              margin: 0 0 8px;
              font-size: 12px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">
              Position
            </p>

            <h2 style="
              margin: 0 0 10px;
              font-size: 21px;
              color: #111827;
            ">
              ${job.title}
            </h2>

            <p style="
              margin: 0;
              font-size: 15px;
              color: #4b5563;
            ">
              🏢 ${job.company}
            </p>

          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="
              display: inline-block;
              padding: 14px 28px;
              background: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
            ">
              View Application
            </a>
          </div>

          <p style="
            margin: 25px 0 0;
            font-size: 14px;
            line-height: 1.6;
            color: #6b7280;
          ">
            Keep an eye on your inbox for further communication from the
            employer.
          </p>

          <p style="
            margin: 25px 0 0;
            font-size: 15px;
            color: #374151;
          ">
            Best regards,<br>
            <strong>Your Job Portal Team</strong>
          </p>

        </div>

        <!-- Footer -->
        <div style="
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          padding: 20px 30px;
          text-align: center;
        ">
          <p style="
            margin: 0;
            font-size: 12px;
            color: #9ca3af;
          ">
            © 2026 Job Portal. All rights reserved.
          </p>

          <p style="
            margin: 8px 0 0;
            font-size: 12px;
            color: #9ca3af;
          ">
            You're receiving this email because you applied for this position.
          </p>
        </div>

      </div>
    </div>
  `,
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
