import { Request, Response } from "express";
import mongoose from "mongoose";
import Job from "../models/job.model";
import User from "../models/user.model";
import {
  publicJobFilter,
  isPubliclyVisible,
  computeAdState,
  getDaysRemaining,
} from "../utils/adState";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

// Public: GET /api/companies/:id?page=1&limit=12   (:id = the employer's user id)
// Everyone sees the company's LIVE jobs. The owner additionally gets `inactiveJobs`
// (pending / rejected / unpaid / expired) so they can edit and renew from this page.
export const getCompanyProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Only name + company are exposed: never the email
    const employer = await User.findOne({ _id: id, role: "employer" }).select("name company");
    if (!employer) return res.status(404).json({ message: "Company not found" });

    const pageNum = Math.max(Number(req.query.page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const live = { employer: employer._id, ...publicJobFilter() };

    const [jobs, total, newest, withLogo] = await Promise.all([
      Job.find(live)
        .select("-rejectionReason -reviewedBy -reviewedAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Job.countDocuments(live),
      Job.findOne(live).sort({ createdAt: -1 }).select("company"),
      // Logo comes from a LIVE job only, so unapproved content is never shown publicly
      Job.findOne({ ...live, logoUrl: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .select("logoUrl"),
    ]);

    let inactiveJobs: unknown[] | undefined;
    if (req.user?.id === String(employer._id)) {
      const now = new Date();
      const all = await Job.find({ employer: employer._id }).sort({ createdAt: -1 });
      inactiveJobs = all
        .filter((j) => !isPubliclyVisible(j, now))
        .map((j) => ({
          ...j.toObject(),
          adState: computeAdState(j, false, now),
          daysRemaining: getDaysRemaining(j, now),
        }));
    }

    res.status(200).json({
      company: {
        id: employer.id,
        name: employer.company || newest?.company || employer.name,
        logoUrl: withLogo?.logoUrl,
        openJobs: total,
      },
      jobs,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / limitNum), 1),
      ...(inactiveJobs ? { inactiveJobs } : {}),
    });
  } catch (error) {
    console.error("getCompanyProfile error:", error);
    res.status(500).json({ message: "Failed to load company" });
  }
};