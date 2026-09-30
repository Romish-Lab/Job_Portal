import { Router } from "express";
import { uploadLogo } from "../middleware/upload.middleware";
import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  getEmployerDashboard,
  updateJob,
  deleteJob,
} from "../controllers/job.controller";
import { protect, authorize, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getJobs);
router.get("/mine", protect, authorize("employer"), getMyJobs);
router.get("/dashboard", protect, authorize("employer"), getEmployerDashboard);
router.get("/:id", optionalAuth, getJobById);
router.post("/", protect, authorize("employer"), uploadLogo.single("logo"), createJob);
router.put("/:id", protect, authorize("employer"), updateJob);
router.delete("/:id", protect, authorize("employer"), deleteJob);

export default router;
