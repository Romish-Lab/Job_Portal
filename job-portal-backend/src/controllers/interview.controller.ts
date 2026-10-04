import { Request, Response } from "express";
import mongoose from "mongoose";
import Interview from "../models/interview.model";
import Application from "../models/application.model";
import Job from "../models/job.model";
import { sendEmail } from "../utils/sendEmail";
import { interviewScheduledTemplate } from "../utils/emailTemplates";
import { escapeHtml } from "../utils/escapeHtml";

// WHO CAN DO WHAT
//  - schedule / reschedule / complete / cancel: only the EMPLOYER who owns the job
//  - view: the employer (their interviews) or the candidate (their own interviews)
// Roles are enforced in interview.routes.ts; ownership is enforced here.

const TYPES = ["phone", "video", "in-person", "technical"] as const;
const RESULTS = ["passed", "failed", "pending"] as const;
const MINUTE = 60 * 1000;

type Fields = {
  type?: (typeof TYPES)[number];
  scheduledDate?: Date;
  duration?: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
};

// Validates the scheduling fields. `partial` = only validate what was sent (reschedule).
export const parseSchedule = (body: Record<string, any>, partial: boolean): { data: Fields } | { error: string } => {
  const data: Fields = {};

  if (!partial || body.type !== undefined) {
    if (!TYPES.includes(body.type)) return { error: "Interview type must be phone, video, in-person or technical" };
    data.type = body.type;
  }

  if (!partial || body.scheduledDate !== undefined) {
    const date = new Date(body.scheduledDate);
    if (typeof body.scheduledDate !== "string" || isNaN(date.getTime())) return { error: "Please choose a valid date and time" };
    if (date.getTime() < Date.now() + 5 * MINUTE) return { error: "The interview must be scheduled in the future" };
    if (date.getTime() > Date.now() + 365 * 24 * 60 * MINUTE) return { error: "The interview can be at most one year away" };
    data.scheduledDate = date;
  }

  if (body.duration !== undefined && body.duration !== "") {
    const d = Number(body.duration);
    if (!Number.isInteger(d) || d < 15 || d > 480) return { error: "Duration must be between 15 and 480 minutes" };
    data.duration = d;
  }

  if (body.location !== undefined) {
    if (typeof body.location !== "string" || body.location.length > 200) return { error: "Location is too long (max 200 characters)" };
    data.location = body.location.trim();
  }

  if (body.meetingLink !== undefined) {
    if (typeof body.meetingLink !== "string" || body.meetingLink.length > 500) return { error: "Meeting link is too long" };
    const link = body.meetingLink.trim();
    if (link) {
      try {
        const u = new URL(link);
        if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      } catch {
        return { error: "Meeting link must be a valid http(s) URL" };
      }
    }
    data.meetingLink = link;
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== "string" || body.notes.length > 1000) return { error: "Notes are too long (max 1000 characters)" };
    data.notes = body.notes.trim();
  }

  return { data };
};

// Best-effort: an email problem must never fail the action
const emailCandidate = async (to: string | undefined, subject: string, html: string) => {
  if (!to) return;
  try {
    await sendEmail({ to, subject, html });
  } catch (err) {
    console.error("Failed to send interview email:", (err as Error).message);
  }
};

const scheduledEmailHtml = (job: { title: string; company: string }, i: { type: string; scheduledDate: Date; duration: number; location?: string; meetingLink?: string; notes?: string }) =>
  interviewScheduledTemplate({
    jobTitle: escapeHtml(job.title),
    company: escapeHtml(job.company),
    type: escapeHtml(i.type),
    scheduledDate: i.scheduledDate,
    duration: i.duration,
    location: i.location ? escapeHtml(i.location) : undefined,
    meetingLink: i.meetingLink ? escapeHtml(i.meetingLink) : undefined,
    notes: i.notes ? escapeHtml(i.notes) : undefined,
  });

export const scheduleInterview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { applicationId } = req.params;
    if (!mongoose.isValidObjectId(applicationId)) return res.status(404).json({ message: "Application not found" });

    const parsed = parseSchedule(req.body, false);
    if ("error" in parsed) return res.status(400).json({ message: parsed.error });
    const { data } = parsed;

    const application = await Application.findById(applicationId).populate("candidate", "name email");
    if (!application) return res.status(404).json({ message: "Application not found" });

    const job = await Job.findById(application.job);
    if (!job || job.employer.toString() !== userId) {
      return res.status(403).json({ message: "You can only schedule interviews for applicants to your own jobs" });
    }

    if (application.status === "rejected") {
      return res.status(409).json({ message: "This applicant was rejected. Change their status first to schedule an interview." });
    }

    const open = await Interview.findOne({ application: application._id, status: { $in: ["scheduled", "rescheduled"] } });
    if (open) {
      return res.status(409).json({ message: "This applicant already has an upcoming interview. Reschedule or cancel it from the Interviews page." });
    }

    const candidate = application.candidate as any;
    const interview = await Interview.create({
      application: application._id,
      job: job._id,
      candidate: candidate._id,
      employer: userId,
      type: data.type,
      scheduledDate: data.scheduledDate,
      duration: data.duration ?? 60,
      location: data.location || undefined,
      meetingLink: data.meetingLink || undefined,
      notes: data.notes || undefined,
      status: "scheduled",
    });

    await emailCandidate(
      candidate.email,
      `Interview Scheduled - ${job.title}`,
      scheduledEmailHtml(job, interview),
    );

    res.status(201).json({ message: "Interview scheduled. The candidate has been notified by email.", interview });
  } catch (error) {
    console.error("scheduleInterview error:", error);
    res.status(500).json({ message: "Failed to schedule interview" });
  }
};

export const getCandidateInterviews = async (req: Request, res: Response) => {
  try {
    const interviews = await Interview.find({ candidate: req.user?.id })
      .populate("job", "title company logoUrl")
      .populate("employer", "name email company")
      .sort({ scheduledDate: -1 });
    res.status(200).json({ interviews, count: interviews.length });
  } catch (error) {
    console.error("getCandidateInterviews error:", error);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};

export const getEmployerInterviews = async (req: Request, res: Response) => {
  try {
    const interviews = await Interview.find({ employer: req.user?.id })
      .populate("job", "title company")
      .populate("candidate", "name email")
      .sort({ scheduledDate: -1 });
    res.status(200).json({ interviews, count: interviews.length });
  } catch (error) {
    console.error("getEmployerInterviews error:", error);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};

// Employer: complete an interview (with result/feedback/rating) or reschedule it.
export const updateInterviewStatus = async (req: Request, res: Response) => {
  try {
    const { interviewId } = req.params;
    if (!mongoose.isValidObjectId(interviewId)) return res.status(404).json({ message: "Interview not found" });

    const interview = await Interview.findById(interviewId).populate("candidate", "email").populate("job", "title company");
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.employer.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Not authorized to update this interview" });
    }

    const { status, feedback, rating, result } = req.body;

    if (status !== undefined && status !== "completed") {
      return res.status(400).json({ message: "Status can only be set to completed here. Use cancel to cancel an interview." });
    }
    if (result !== undefined && !RESULTS.includes(result)) return res.status(400).json({ message: "Result must be passed, failed or pending" });
    if (rating !== undefined && rating !== "" && (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }
    if (feedback !== undefined && (typeof feedback !== "string" || feedback.length > 2000)) {
      return res.status(400).json({ message: "Feedback is too long (max 2000 characters)" });
    }

    if (interview.status === "cancelled") {
      return res.status(409).json({ message: "This interview was cancelled" });
    }

    // Reschedule: only while the interview is still upcoming
    const wantsReschedule = ["scheduledDate", "duration", "location", "meetingLink", "notes", "type"].some((k) => req.body[k] !== undefined);
    let rescheduled = false;
    if (wantsReschedule) {
      if (interview.status === "completed") return res.status(409).json({ message: "A completed interview can't be rescheduled" });
      const parsed = parseSchedule(req.body, true);
      if ("error" in parsed) return res.status(400).json({ message: parsed.error });
      const { data } = parsed;
      if (data.type !== undefined) interview.type = data.type;
      if (data.scheduledDate !== undefined) interview.scheduledDate = data.scheduledDate;
      if (data.duration !== undefined) interview.duration = data.duration;
      if (data.location !== undefined) interview.location = data.location || undefined;
      if (data.meetingLink !== undefined) interview.meetingLink = data.meetingLink || undefined;
      if (data.notes !== undefined) interview.notes = data.notes || undefined;
      rescheduled = true;
    }

    if (status === "completed") interview.status = "completed";
    if (feedback !== undefined) interview.feedback = feedback.trim() || undefined;
    if (rating !== undefined && rating !== "") interview.rating = Number(rating);
    if (result !== undefined) interview.result = result;

    await interview.save();

    if (rescheduled) {
      const job = interview.job as any;
      await emailCandidate(
        (interview.candidate as any)?.email,
        `Interview Rescheduled - ${job?.title ?? ""}`,
        scheduledEmailHtml(job, interview),
      );
    }

    res.status(200).json({ message: "Interview updated successfully", interview });
  } catch (error) {
    console.error("updateInterviewStatus error:", error);
    res.status(500).json({ message: "Failed to update interview" });
  }
};

export const cancelInterview = async (req: Request, res: Response) => {
  try {
    const { interviewId } = req.params;
    if (!mongoose.isValidObjectId(interviewId)) return res.status(404).json({ message: "Interview not found" });

    const interview = await Interview.findById(interviewId).populate("candidate", "email").populate("job", "title company");
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.employer.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Not authorized to cancel this interview" });
    }
    if (interview.status === "completed") return res.status(409).json({ message: "A completed interview can't be cancelled" });
    if (interview.status === "cancelled") return res.status(200).json({ message: "Interview was already cancelled" });

    interview.status = "cancelled";
    await interview.save();

    const job = interview.job as any;
    await emailCandidate(
      (interview.candidate as any)?.email,
      `Interview Cancelled - ${job?.title ?? ""}`,
      `<p>Hello,</p><p>Your interview for <strong>${escapeHtml(job?.title)}</strong> at <strong>${escapeHtml(job?.company)}</strong> scheduled for ${escapeHtml(interview.scheduledDate.toLocaleString())} has been cancelled by the employer.</p><p>You can check your applications for updates.</p>`,
    );

    res.status(200).json({ message: "Interview cancelled successfully" });
  } catch (error) {
    console.error("cancelInterview error:", error);
    res.status(500).json({ message: "Failed to cancel interview" });
  }
};
