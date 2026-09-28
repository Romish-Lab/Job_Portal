import { Request, Response } from "express";
import User from "../models/user.model";

// Admin only: list all users
export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await User.find().select("-password");
  res.status(200).json({ users });
};

// Admin only: delete a user by id
export const deleteUser = async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ message: "User deleted", id: user.id });
};