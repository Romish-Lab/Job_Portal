import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
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

// Only EMPLOYERS can schedule, reschedule, complete or cancel interviews
// (and only for jobs they own - checked in the controller).
router.post("/schedule/:applicationId", authorize("employer"), scheduleInterview);
router.get("/employer", authorize("employer"), getEmployerInterviews);
router.put("/:interviewId", authorize("employer"), updateInterviewStatus);
router.delete("/:interviewId", authorize("employer"), cancelInterview);

// Candidates can only VIEW their own interviews
router.get("/candidate", authorize("candidate"), getCandidateInterviews);

export default router;
