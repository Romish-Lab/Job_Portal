import { Router } from "express";
import { uploadLogo } from "../middleware/upload.middleware";
import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
} from "../controllers/job.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getJobs);
router.get("/mine", protect, authorize("employer"), getMyJobs);
router.get("/:id", getJobById);
router.post("/", protect, authorize("employer"), uploadLogo.single("logo"), createJob);
router.put("/:id", protect, authorize("employer"), updateJob);
router.delete("/:id", protect, authorize("employer"), deleteJob);

export default router;
