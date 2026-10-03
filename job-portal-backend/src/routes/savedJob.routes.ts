import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkIfJobSaved,
} from "../controllers/savedJob.controller";

const router = Router();

// All routes require authentication
router.use(protect);

router.get("/", getSavedJobs);
router.post("/:jobId", saveJob);
router.delete("/:jobId", unsaveJob);
router.get("/check/:jobId", checkIfJobSaved);

export default router;
