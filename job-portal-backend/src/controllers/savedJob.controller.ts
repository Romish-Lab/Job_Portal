import { Request, Response } from "express";
import User from "../models/user.model";
import Job from "../models/job.model";

export const saveJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can save jobs" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if job is already saved
    if (user.savedJobs?.some((id) => id.toString() === jobId)) {
      return res.status(400).json({ message: "Job already saved" });
    }

    user.savedJobs = user.savedJobs || [];
    user.savedJobs.push(job._id);
    await user.save();

    res.status(200).json({ message: "Job saved successfully", savedJobs: user.savedJobs });
  } catch (error) {
    res.status(500).json({ message: "Failed to save job", error: (error as Error).message });
  }
};

export const unsaveJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.savedJobs || user.savedJobs.length === 0) {
      return res.status(400).json({ message: "No saved jobs found" });
    }

    const initialLength = user.savedJobs.length;
    user.savedJobs = user.savedJobs.filter((id) => id.toString() !== jobId);

    if (user.savedJobs.length === initialLength) {
      return res.status(400).json({ message: "Job was not saved" });
    }

    await user.save();

    res.status(200).json({ message: "Job removed from saved", savedJobs: user.savedJobs });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsave job", error: (error as Error).message });
  }
};

export const getSavedJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).populate({
      path: "savedJobs",
      populate: {
        path: "employer",
        select: "name company",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      savedJobs: user.savedJobs || [],
      count: user.savedJobs?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get saved jobs", error: (error as Error).message });
  }
};

export const checkIfJobSaved = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSaved = user.savedJobs?.some((id) => id.toString() === jobId) || false;

    res.status(200).json({ isSaved });
  } catch (error) {
    res.status(500).json({ message: "Failed to check saved status", error: (error as Error).message });
  }
};
