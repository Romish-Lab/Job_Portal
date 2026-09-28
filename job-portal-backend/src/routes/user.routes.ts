import { Router } from "express";
import { getAllUsers, deleteUser } from "../controllers/user.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, authorize("admin"), getAllUsers);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
