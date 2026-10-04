import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import {
  saveJob,
  unsaveJob,
  getSavedJobs,
  getSavedJobIds,
  checkIfJobSaved,
} from "../controllers/savedJob.controller";

const router = Router();

// Saved jobs are a candidate feature
router.use(protect, authorize("candidate"));

router.get("/", getSavedJobs);
router.get("/ids", getSavedJobIds);
router.get("/check/:jobId", checkIfJobSaved);
router.post("/:jobId", saveJob);
router.delete("/:jobId", unsaveJob);

export default router;
