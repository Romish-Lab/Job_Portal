import { Request, Response } from "express";
import User from "../models/user.model";
import { signToken } from "../utils/jwt";
import { sendEmail } from "../utils/sendEmail";
import crypto from "crypto";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, company } = req.body;

    // Only candidates and employers can self-register; admins come from `npm run seed:admin`
    if (role !== "candidate" && role !== "employer") {
      return res.status(400).json({ message: "Role must be candidate or employer" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role, company });
    const token = signToken({ id: user.id, role: user.role });

    res
      .cookie("token", token, cookieOptions)
      .status(201)
      .json({
        message: "Registered successfully",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: `Your account has been suspended.${user.suspendedReason ? ` Reason: ${user.suspendedReason}` : ""}`,
      });
    }

    const token = signToken({ id: user.id, role: user.role });

    res
      .cookie("token", token, cookieOptions)
      .status(200)
      .json({
        message: "Logged in successfully",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: (error as Error).message });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token").status(200).json({ message: "Logged out" });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ user });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

const message = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f7f6;
  font-family: Arial, Helvetica, sans-serif;
">

  <div style="
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <div style="
      background: linear-gradient(135deg, #111827, #1f2937);
      padding: 35px 30px;
      text-align: center;
    ">
      <h1 style="
        margin: 0;
        color: #ffffff;
        font-size: 28px;
        letter-spacing: -0.5px;
      ">
        Password Reset
      </h1>

      <p style="
        margin: 10px 0 0;
        color: #9ca3af;
        font-size: 14px;
      ">
        Let's get you back into your account.
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 35px;">

      <h2 style="
        margin-top: 0;
        color: #111827;
        font-size: 22px;
      ">
        Forgot your password?
      </h2>

      <p style="
        color: #4b5563;
        font-size: 15px;
        line-height: 1.7;
      ">
        No worries. We received a request to reset the password
        associated with your account.
      </p>

      <p style="
        color: #4b5563;
        font-size: 15px;
        line-height: 1.7;
      ">
        Click the button below to create a new password.
      </p>

      <!-- Button -->
      <div style="
        text-align: center;
        margin: 35px 0;
      ">
        <a href="${resetUrl}"
           target="_blank"
           style="
             display: inline-block;
             padding: 15px 32px;
             background: #10b981;
             color: #ffffff;
             text-decoration: none;
             font-size: 15px;
             font-weight: bold;
             border-radius: 10px;
             box-shadow: 0 5px 15px rgba(16,185,129,0.25);
           ">
          Reset My Password
        </a>
      </div>

      <!-- Expiry Notice -->
      <div style="
        background: #f0fdf4;
        border-left: 4px solid #10b981;
        padding: 14px 16px;
        border-radius: 8px;
        margin-bottom: 25px;
      ">
        <p style="
          margin: 0;
          color: #166534;
          font-size: 13px;
          line-height: 1.6;
        ">
          🔒 For your security, this link will expire in
          <strong>10 minutes</strong>.
        </p>
      </div>

      <p style="
        color: #6b7280;
        font-size: 13px;
        line-height: 1.6;
      ">
        If you didn't request a password reset, you can safely ignore
        this email. Your password will remain unchanged.
      </p>

      <!-- Fallback URL -->
      <p style="
        color: #9ca3af;
        font-size: 11px;
        line-height: 1.6;
        word-break: break-all;
        margin-top: 30px;
      ">
        If the button doesn't work, copy and paste this link into your browser:
        <br><br>
        <a href="${resetUrl}"
           target="_blank"
           style="color: #10b981;">
          ${resetUrl}
        </a>
      </p>

    </div>

    <!-- Footer -->
    <div style="
      background: #f9fafb;
      padding: 22px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    ">
      <p style="
        margin: 0;
        color: #9ca3af;
        font-size: 12px;
      ">
        © 2026 Job Portal. All rights reserved.
      </p>

      <p style="
        margin: 7px 0 0;
        color: #d1d5db;
        font-size: 11px;
      ">
        This is an automated security email. Please don't reply.
      </p>
    </div>

  </div>

</body>
</html>
`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request - Job Portal",
        html: message,
      });

      res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};
