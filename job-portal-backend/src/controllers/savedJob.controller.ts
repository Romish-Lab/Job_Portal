import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user.model";
import Job from "../models/job.model";
import { isPubliclyVisible } from "../utils/adState";

// Candidates only (enforced in the routes). Saving is idempotent: saving twice or
// removing twice both succeed, so a double-click or a second tab can't cause errors.

export const saveJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.isValidObjectId(jobId)) return res.status(404).json({ message: "Job not found" });

    const job = await Job.findById(jobId);
    // Only jobs candidates can currently see may be saved (hides pending/rejected/expired ones)
    if (!job || !isPubliclyVisible(job)) return res.status(404).json({ message: "Job not found" });

    await User.updateOne({ _id: req.user?.id }, { $addToSet: { savedJobs: job._id } });
    res.status(200).json({ message: "Job saved successfully" });
  } catch (error) {
    console.error("saveJob error:", error);
    res.status(500).json({ message: "Failed to save job" });
  }
};

export const unsaveJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.isValidObjectId(jobId)) return res.status(404).json({ message: "Job not found" });

    await User.updateOne({ _id: req.user?.id }, { $pull: { savedJobs: jobId } });
    res.status(200).json({ message: "Job removed from saved" });
  } catch (error) {
    console.error("unsaveJob error:", error);
    res.status(500).json({ message: "Failed to unsave job" });
  }
};

// Just the ids: the job cards use this to know which bookmarks to fill in (one request per page).
export const getSavedJobIds = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("savedJobs");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ ids: (user.savedJobs || []).map((id) => id.toString()) });
  } catch (error) {
    console.error("getSavedJobIds error:", error);
    res.status(500).json({ message: "Failed to get saved jobs" });
  }
};

export const getSavedJobs = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).populate({
      path: "savedJobs",
      populate: { path: "employer", select: "name company" },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const savedJobs = ((user.savedJobs || []) as any[])
      .filter(Boolean) // a deleted job leaves a null behind
      .map((job) => {
        const available = isPubliclyVisible(job, now);
        if (available) {
          const { rejectionReason, reviewedBy, reviewedAt, ...safe } = job.toObject();
          return { ...safe, available: true };
        }
        // Expired / unpublished: keep the entry so the user sees it, but reveal nothing private
        return {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          logoUrl: job.logoUrl,
          createdAt: job.createdAt,
          available: false,
        };
      });

    res.status(200).json({ savedJobs, count: savedJobs.length });
  } catch (error) {
    console.error("getSavedJobs error:", error);
    res.status(500).json({ message: "Failed to get saved jobs" });
  }
};

export const checkIfJobSaved = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const user = await User.findById(req.user?.id).select("savedJobs");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ isSaved: (user.savedJobs || []).some((id) => id.toString() === jobId) });
  } catch (error) {
    console.error("checkIfJobSaved error:", error);
    res.status(500).json({ message: "Failed to check saved status" });
  }
};
