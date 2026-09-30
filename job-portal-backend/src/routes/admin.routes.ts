import { Router } from "express";
import {
  getAdminJobs,
  approveJob,
  rejectJob,
  getAdvertisements,
  getAdminPricing,
  updateAdminPricing,
} from "../controllers/admin.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

// Everything under /api/admin is admin-only
router.use(protect, authorize("admin"));

router.get("/jobs", getAdminJobs);
router.patch("/jobs/:id/approve", approveJob);
router.patch("/jobs/:id/reject", rejectJob);
router.get("/advertisements", getAdvertisements);
router.get("/ad-pricing", getAdminPricing);
router.put("/ad-pricing", updateAdminPricing);

export default router;
