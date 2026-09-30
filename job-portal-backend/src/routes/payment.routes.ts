import { Router } from "express";
import {
  getAdPricing,
  createCheckoutSession,
  confirmPayment,
} from "../controllers/payment.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

// The Stripe webhook is mounted separately in server.ts (it needs the raw body).
router.get("/pricing", protect, authorize("employer", "admin"), getAdPricing);
router.post("/checkout", protect, authorize("employer"), createCheckoutSession);
router.post("/confirm", protect, authorize("employer"), confirmPayment);

export default router;
