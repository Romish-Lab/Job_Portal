import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  scheduleInterview,
  getCandidateInterviews,
  getEmployerInterviews,
  updateInterviewStatus,
  cancelInterview,
} from "../controllers/interview.controller";

const router = Router();

// All routes require authentication
router.use(protect);

router.post("/schedule/:applicationId", scheduleInterview);
router.get("/candidate", getCandidateInterviews);
router.get("/employer", getEmployerInterviews);
router.put("/:interviewId", updateInterviewStatus);
router.delete("/:interviewId", cancelInterview);

export default router;
