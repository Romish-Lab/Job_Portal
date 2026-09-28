import { Request, Response } from "express";
import User from "../models/user.model";
import { signToken } from "../utils/jwt";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, company } = req.body;

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
