import { Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail";

export const sendContactMessage = async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email and message are required" });
  }

  // Always log it, so you can see submissions even without SMTP configured
  console.log("New contact message:", { name, email, subject, message });

  // Best-effort email: only tried if SMTP is configured, and never blocks the response
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      await sendEmail({
        to: process.env.SMTP_USER,
        subject: `New contact form message: ${subject || "No subject"}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });
    } catch (err) {
      console.error("Failed to send contact email:", (err as Error).message);
    }
  }

  res.status(200).json({ message: "Thanks! We'll get back to you soon." });
};