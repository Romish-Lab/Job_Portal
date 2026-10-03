import { Router } from "express";
import {
  getAdminJobs,
  approveJob,
  rejectJob,
  getAdvertisements,
  getAdminPricing,
  updateAdminPricing,
  getMessages,
  getUnreadCount,
  markMessageRead,
  deleteMessage,
} from "../controllers/admin.controller";
import { getStats, getAuditLogs, downloadReport } from "../controllers/adminDashboard.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

// Everything under /api/admin is admin-only
router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/audit-logs", getAuditLogs);
router.get("/reports/:type", downloadReport);

router.get("/jobs", getAdminJobs);
router.patch("/jobs/:id/approve", approveJob);
router.patch("/jobs/:id/reject", rejectJob);
router.get("/advertisements", getAdvertisements);
router.get("/ad-pricing", getAdminPricing);
router.put("/ad-pricing", updateAdminPricing);

router.get("/unread-count", getUnreadCount);
router.get("/messages", getMessages);
router.patch("/messages/:id/read", markMessageRead);
router.delete("/messages/:id", deleteMessage);

export default router;
