import { Request, Response } from "express";
import User from "../models/user.model";
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PAGE_SIZE = 20;
const FILTERABLE_ROLES = ["candidate", "employer"];
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const role = String(req.query.role || "all");
    const search = String(req.query.search || "").trim().slice(0, 100);
    const pageNum = Math.max(Number(req.query.page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(req.query.limit) || PAGE_SIZE, 1), 100);

    const nameFilter: Record<string, unknown> = search
      ? { name: new RegExp(escapeRegex(search), "i") }
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
// Admin only: delete a user by id
export const deleteUser = async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ message: "User deleted", id: user.id });
};

