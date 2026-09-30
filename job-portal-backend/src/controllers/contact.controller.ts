import { Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail";
import ContactMessage from "../models/contactMessage.model"

export const sendContactMessage = async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (![name, email, message].every((v) => typeof v === "string" && v.trim())) {
    return res
      .status(400)
      .json({ message: "Name, email and message are required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: "A valid email is required" });
  }
  if (
    name.length > 100 ||
    email.length > 200 ||
    message.length > 5000 ||
    (subject && String(subject).length > 200)
  ) {
    return res.status(400).json({ message: "Message is too long" });
  }

  // Save it so admins can read it in the admin panel (Messages tab)
  try {
    await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject ? String(subject).trim() : undefined,
      message: message.trim(),
    });
  } catch (err) {
    console.error("Failed to save contact message:", (err as Error).message);
    return res.status(500).json({ message: "Couldn't send your message. Please try again." });
  }

  // Best-effort email: only tried if SMTP is configured, and never blocks the response
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      await sendEmail({
        to: process.env.SMTP_USER,
        subject: `New contact form message: ${String(subject || "No subject").replace(/[\r\n]+/g, " ")}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });
    } catch (err) {
      console.error("Failed to send contact email:", (err as Error).message);
    }
  }

  res.status(200).json({ message: "Thanks! We'll get back to you soon." });
};