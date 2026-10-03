import { Router } from "express";
import { getAllUsers, deleteUser, suspendUser, unsuspendUser } from "../controllers/user.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, authorize("admin"), getAllUsers);
router.patch("/:id/suspend", protect, authorize("admin"), suspendUser);
router.patch("/:id/unsuspend", protect, authorize("admin"), unsuspendUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
