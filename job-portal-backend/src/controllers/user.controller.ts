import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user.model";
import { escapeRegex } from "../utils/adminHelpers";
import { logAudit } from "../utils/audit";

const PAGE_SIZE = 20;
const FILTERABLE_ROLES = ["candidate", "employer"];
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const role = String(req.query.role || "all");
    const search = String(req.query.search || "").trim().slice(0, 100);
    const pageNum = Math.max(Number(req.query.page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(req.query.limit) || PAGE_SIZE, 1), 100);

    const rx = search ? new RegExp(escapeRegex(search), "i") : null;
    const nameFilter: Record<string, unknown> = rx
      ? { $or: [{ name: rx }, { email: rx }, { company: rx }] }
      : {};
    const filter: Record<string, unknown> = { ...nameFilter };
    if (FILTERABLE_ROLES.includes(role)) filter.role = role;

    const [users, total, roleCounts] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1, _id: -1 }) // _id tie-breaker keeps pages stable
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
      User.aggregate([{ $match: nameFilter }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);

    const counts = { all: 0, candidate: 0, employer: 0 };
    for (const r of roleCounts) {
      counts.all += r.count;
      if (r._id === "candidate") counts.candidate = r.count;
      if (r._id === "employer") counts.employer = r.count;
    }

    res.status(200).json({
      users,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / limitNum), 1),
      counts,
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
// Shared guard for suspend / unsuspend / delete
const loadTarget = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const user = mongoose.isValidObjectId(id) ? await User.findById(id) : null;
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return null;
  }
  if (user.id === req.user?.id) {
    res.status(400).json({ message: "You can't do this to your own account" });
    return null;
  }
  if (user.role === "admin") {
    res.status(403).json({ message: "Admin accounts can't be changed from here" });
    return null;
  }
  return user;
};

// Admin only: suspend a user (blocked on their next request, can't log in)
export const suspendUser = async (req: Request, res: Response) => {
  const user = await loadTarget(req, res);
  if (!user) return;
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";
  user.isSuspended = true;
  user.suspendedReason = reason || undefined;
  user.suspendedAt = new Date();
  await user.save();
  await logAudit(req, {
    action: "user.suspend",
    targetType: "user",
    targetId: user.id,
    targetLabel: `${user.name} <${user.email}>`,
    details: reason || undefined,
  });
  res.status(200).json({ message: "User suspended" });
};

export const unsuspendUser = async (req: Request, res: Response) => {
  const user = await loadTarget(req, res);
  if (!user) return;
  user.isSuspended = false;
  user.suspendedReason = undefined;
  user.suspendedAt = undefined;
  await user.save();
  await logAudit(req, {
    action: "user.unsuspend",
    targetType: "user",
    targetId: user.id,
    targetLabel: `${user.name} <${user.email}>`,
  });
  res.status(200).json({ message: "User reinstated" });
};

// Admin only: delete a user by id
export const deleteUser = async (req: Request, res: Response) => {
  const user = await loadTarget(req, res);
  if (!user) return;
  await user.deleteOne();
  await logAudit(req, {
    action: "user.delete",
    targetType: "user",
    targetId: user.id,
    targetLabel: `${user.name} <${user.email}>`,
    details: `role: ${user.role}`,
  });
  res.status(200).json({ message: "User deleted", id: user.id });
};
