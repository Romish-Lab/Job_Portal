import { Request, Response } from "express";
import JobAlert from "../models/jobAlert.model";
import User from "../models/user.model";

export const createJobAlert = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { keywords, location, jobType, salaryMin, frequency } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can create job alerts" });
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ message: "At least one keyword is required" });
    }

    const jobAlert = await JobAlert.create({
      user: userId,
      keywords,
      location,
      jobType,
      salaryMin,
      frequency: frequency || "daily",
      isActive: true,
    });

    res.status(201).json({
      message: "Job alert created successfully",
      jobAlert,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create job alert", error: (error as Error).message });
  }
};

export const getJobAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const alerts = await JobAlert.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch job alerts", error: (error as Error).message });
  }
};

export const updateJobAlert = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { alertId } = req.params;
    const { keywords, location, jobType, salaryMin, frequency, isActive } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const alert = await JobAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: "Job alert not found" });
    }

    if (alert.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this alert" });
    }

    if (keywords !== undefined) alert.keywords = keywords;
    if (location !== undefined) alert.location = location;
    if (jobType !== undefined) alert.jobType = jobType;
    if (salaryMin !== undefined) alert.salaryMin = salaryMin;
    if (frequency !== undefined) alert.frequency = frequency;
    if (isActive !== undefined) alert.isActive = isActive;

    await alert.save();

    res.status(200).json({
      message: "Job alert updated successfully",
      jobAlert: alert,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update job alert", error: (error as Error).message });
  }
};

export const deleteJobAlert = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { alertId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const alert = await JobAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: "Job alert not found" });
    }

    if (alert.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this alert" });
    }

    await JobAlert.findByIdAndDelete(alertId);

    res.status(200).json({ message: "Job alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete job alert", error: (error as Error).message });
  }
};

export const toggleJobAlert = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { alertId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const alert = await JobAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: "Job alert not found" });
    }

    if (alert.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to toggle this alert" });
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    res.status(200).json({
      message: `Job alert ${alert.isActive ? "activated" : "deactivated"}`,
      jobAlert: alert,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle job alert", error: (error as Error).message });
  }
};
