import { Router } from "express";
import {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  downloadResume,
  downloadPhoto,
} from "../controllers/application.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { uploadApplicationFiles } from "../middleware/upload.middleware";

const router = Router();

// Candidate routes
router.post("/:jobId/apply", protect, authorize("candidate"), uploadApplicationFiles, applyToJob);
router.get("/mine", protect, authorize("candidate"), getMyApplications);

// Employer routes
router.get("/job/:jobId", protect, authorize("employer"), getApplicationsForJob);
router.get("/:id/resume", protect, downloadResume); // candidate owner, job employer or admin
router.get("/:id/photo", protect, downloadPhoto); // same access rules as the resume
router.patch("/:id/status", protect, authorize("employer"), updateApplicationStatus);

export default router;
