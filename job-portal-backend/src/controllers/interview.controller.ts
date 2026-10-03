import { Request, Response } from "express";
import Interview from "../models/interview.model";
import Application from "../models/application.model";
import Job from "../models/job.model";
import User from "../models/user.model";
import { sendEmail } from "../utils/sendEmail";

export const scheduleInterview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { applicationId } = req.params;
    const { type, scheduledDate, duration, location, meetingLink, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "employer") {
      return res.status(403).json({ message: "Only employers can schedule interviews" });
    }

    const application = await Application.findById(applicationId).populate("job candidate");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await Job.findById(application.job);
    if (!job || job.employer.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to schedule interview for this application" });
    }

    const interview = await Interview.create({
      application: application._id,
      job: job._id,
      candidate: application.candidate,
      employer: userId,
      type,
      scheduledDate: new Date(scheduledDate),
      duration: duration || 60,
      location,
      meetingLink,
      notes,
      status: "scheduled",
    });

    // Send email notification to candidate
    const candidate = application.candidate as any;
    const emailMessage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 35px 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Interview Scheduled! 🎉</h1>
    </div>

    <div style="padding: 40px 35px;">
      <h2 style="margin-top: 0; color: #111827; font-size: 22px;">Great news!</h2>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
        You have been invited for an interview for the position of <strong>${job.title}</strong> at <strong>${job.company}</strong>.
      </p>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">Interview Details</h3>
        <p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
        <p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Date & Time:</strong> ${new Date(scheduledDate).toLocaleString()}</p>
        <p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Duration:</strong> ${duration || 60} minutes</p>
        ${location ? `<p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Location:</strong> ${location}</p>` : ""}
        ${meetingLink ? `<p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #10b981;">${meetingLink}</a></p>` : ""}
      </div>

      ${notes ? `<p style="color: #4b5563; font-size: 14px; line-height: 1.6;"><strong>Additional Notes:</strong><br>${notes}</p>` : ""}

      <div style="text-align: center; margin: 35px 0;">
        <a href="${process.env.CLIENT_URL}/my-applications"
           style="display: inline-block; padding: 15px 32px; background: #10b981; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; border-radius: 10px; box-shadow: 0 5px 15px rgba(16,185,129,0.25);">
          View My Applications
        </a>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        Good luck with your interview! Make sure to prepare and arrive on time.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 22px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2026 Job Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    try {
      await sendEmail({
        to: candidate.email,
        subject: `Interview Scheduled - ${job.title}`,
        html: emailMessage,
      });
    } catch (emailError) {
      console.error("Failed to send interview email:", emailError);
    }

    res.status(201).json({
      message: "Interview scheduled successfully",
      interview,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to schedule interview", error: (error as Error).message });
  }
};

export const getCandidateInterviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const interviews = await Interview.find({ candidate: userId })
      .populate("job", "title company logoUrl")
      .populate("employer", "name email company")
      .sort({ scheduledDate: -1 });

    res.status(200).json({ interviews, count: interviews.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch interviews", error: (error as Error).message });
  }
};

export const getEmployerInterviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const interviews = await Interview.find({ employer: userId })
      .populate("job", "title company")
      .populate("candidate", "name email")
      .populate("application")
      .sort({ scheduledDate: -1 });

    res.status(200).json({ interviews, count: interviews.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch interviews", error: (error as Error).message });
  }
};

export const updateInterviewStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { interviewId } = req.params;
    const { status, feedback, rating, result } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.employer.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this interview" });
    }

    if (status) interview.status = status;
    if (feedback) interview.feedback = feedback;
    if (rating) interview.rating = rating;
    if (result) interview.result = result;

    await interview.save();

    res.status(200).json({
      message: "Interview updated successfully",
      interview,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update interview", error: (error as Error).message });
  }
};

export const cancelInterview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { interviewId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const interview = await Interview.findById(interviewId).populate("candidate job");
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.employer.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to cancel this interview" });
    }

    interview.status = "cancelled";
    await interview.save();

    res.status(200).json({ message: "Interview cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel interview", error: (error as Error).message });
  }
};
