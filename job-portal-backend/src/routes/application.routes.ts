import { Router } from "express";
import {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
} from "../controllers/application.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { uploadResume } from "../middleware/upload.middleware";

const router = Router();

// Candidate routes
router.post("/:jobId/apply", protect, authorize("candidate"), uploadResume.single("resume"), applyToJob);
router.get("/mine", protect, authorize("candidate"), getMyApplications);

// Employer routes
router.get("/job/:jobId", protect, authorize("employer"), getApplicationsForJob);
router.patch("/:id/status", protect, authorize("employer"), updateApplicationStatus);

export default router;
