import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createJobAlert,
  getJobAlerts,
  updateJobAlert,
  deleteJobAlert,
  toggleJobAlert,
} from "../controllers/jobAlert.controller";

const router = Router();

// All routes require authentication
router.use(protect);

router.post("/", createJobAlert);
router.get("/", getJobAlerts);
router.put("/:alertId", updateJobAlert);
router.delete("/:alertId", deleteJobAlert);
router.patch("/:alertId/toggle", toggleJobAlert);

export default router;
