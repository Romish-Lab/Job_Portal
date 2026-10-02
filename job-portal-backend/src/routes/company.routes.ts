import { Router } from "express";
import { getCompanyProfile } from "../controllers/company.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// Public. optionalAuth lets the owner see their own non-live jobs too.
router.get("/:id", optionalAuth, getCompanyProfile);

export default router;