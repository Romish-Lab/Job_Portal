import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Application from "../models/application.model";
import Job from "../models/job.model";
import { isPubliclyVisible } from "../utils/adState";
import User from "../models/user.model";
import { sendEmail } from "../utils/sendEmail";
import {
  UPLOADS_ROOT,
  RESUME_DIR,
  PHOTO_DIR,
} from "../middleware/upload.middleware";
const STATUSES = ["pending", "reviewed", "accepted", "rejected"];
const MAX_LIMIT = 50;

const GENDERS = ["male", "female", "other", "prefer-not-to-say"];
const WORK_PREFERENCES = ["remote", "on-site", "hybrid"];
const MIN_AGE = 16;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// Remove files multer already wrote to disk when we reject the request afterwards
const discardUploads = (files?: {
  [field: string]: Express.Multer.File[];
}) => {
  if (!files) return;
  Object.values(files)
    .flat()
    .forEach((f) => fs.unlink(f.path, () => undefined));
};

// Candidate applies to a job (resume + photo handled by multer -> req.files)
export const applyToJob = async (req: Request, res: Response) => {
  const files = req.files as
    | { [field: string]: Express.Multer.File[] }
    | undefined;
  const reject = (status: number, message: string) => {
    discardUploads(files);
    return res.status(status).json({ message });
  };

  try {
    const { jobId } = req.params;
    const {
      fullName,
      email,
      phone,
      coverLetter,
      portfolioUrl,
      dateOfBirth,
      gender,
      nationality,
      address,
      highestEducation,
      university,
      yearsOfExperience,
      currentLocation,
      expectedSalary,
      availability,
      workPreference,
      skills, // comma-separated string from the form
      additionalInfo,
      declarationAccepted,
    } = req.body;

    if (!mongoose.isValidObjectId(jobId)) {
      return reject(400, "Invalid job id");
    }

    const job = await Job.findById(jobId);
    if (!job || !isPubliclyVisible(job)) {
      return reject(404, "Job not found or closed");
    }

    const resume = files?.resume?.[0];
    const photo = files?.photo?.[0];
    if (!resume) return reject(400, "Resume file is required");
    if (!photo) return reject(400, "Profile photo is required");
    if (photo.size > MAX_PHOTO_BYTES) {
      return reject(400, "Profile photo must be 2MB or smaller");
    }

    const required: Record<string, unknown> = {
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      nationality,
      address,
      currentLocation,
      highestEducation,
      yearsOfExperience,
      expectedSalary,
      availability,
      workPreference,
      skills,
      coverLetter,
    };
    const missing = Object.entries(required)
      .filter(
        ([, v]) => v === undefined || v === null || String(v).trim() === "",
      )
      .map(([k]) => k);
    if (missing.length > 0) {
      return reject(400, `Missing required field(s): ${missing.join(", ")}`);
    }

    if (String(declarationAccepted) !== "true") {
      return reject(
        400,
        "You must confirm that the information you provided is correct",
      );
    }

    if (!GENDERS.includes(gender)) {
      return reject(400, `Gender must be one of: ${GENDERS.join(", ")}`);
    }
    if (!WORK_PREFERENCES.includes(workPreference)) {
      return reject(
        400,
        `Work preference must be one of: ${WORK_PREFERENCES.join(", ")}`,
      );
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return reject(400, "Date of birth is not a valid date");
    }
    const minDob = new Date();
    minDob.setFullYear(minDob.getFullYear() - MIN_AGE);
    if (dob > minDob) {
      return reject(400, `You must be at least ${MIN_AGE} years old to apply`);
    }
    if (dob.getFullYear() < 1900) {
      return reject(400, "Date of birth is not a valid date");
    }

    if (Number(yearsOfExperience) < 0 || Number.isNaN(Number(yearsOfExperience))) {
      return reject(400, "Years of experience must be a valid number");
    }
    if (Number(expectedSalary) < 0 || Number.isNaN(Number(expectedSalary))) {
      return reject(400, "Expected salary must be a valid number");
    }

    const skillsArray = String(skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillsArray.length === 0) {
      return reject(400, "Please list at least one skill");
    }

    const application = await Application.create({
      job: jobId,
      candidate: req.user?.id,
      fullName,
      email,
      phone,
      // Stored as relative paths; served only via the authenticated
      // GET /api/applications/:id/resume and /:id/photo routes
      resumeUrl: `resumes/${resume.filename}`,
      photoUrl: `photos/${photo.filename}`,
      coverLetter,
      portfolioUrl: portfolioUrl || undefined,
      dateOfBirth: dob,
      gender,
      nationality,
      address,
      highestEducation,
      university: university || undefined,
      yearsOfExperience: Number(yearsOfExperience),
      currentLocation,
      expectedSalary: Number(expectedSalary),
      availability,
      workPreference,
      skills: skillsArray,
      additionalInfo: additionalInfo || undefined,
      declarationAccepted: true,
    });

    res.status(201).json({ message: "Application submitted", application });
  } catch (error: any) {
    discardUploads(files);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You already applied to this job" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
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

// Shared by the resume and photo downloads: only the candidate who applied,
// the employer who owns the job, or an admin may fetch the files.
const sendApplicationFile = async (
  req: Request,
  res: Response,
  kind: "resume" | "photo",
) => {
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
      return res.status(403).json({ message: `Not allowed to view this ${kind}` });
    }

    const stored = kind === "resume" ? application.resumeUrl : application.photoUrl;
    if (!stored) return res.status(404).json({ message: `No ${kind} on file` });

    // basename() blocks path traversal; resumes also fall back to the legacy
    // public folder for old records
    const filename = path.basename(stored);
    const candidates =
      kind === "resume"
        ? [path.join(RESUME_DIR, filename), path.join(UPLOADS_ROOT, filename)]
        : [path.join(PHOTO_DIR, filename)];
    const file = candidates.find((f) => fs.existsSync(f));
    if (!file) return res.status(404).json({ message: `${kind} file not found` });

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(file);
  } catch (error) {
    console.error(`download ${kind} error:`, error);
    res.status(500).json({ message: `Failed to load ${kind}` });
  }
};

export const downloadResume = (req: Request, res: Response) =>
  sendApplicationFile(req, res, "resume");

export const downloadPhoto = (req: Request, res: Response) =>
  sendApplicationFile(req, res, "photo");

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
    // Applications created before the new required fields existed would fail
    // full validation, so only validate the field we actually changed.
    await application.save({ validateModifiedOnly: true });

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
