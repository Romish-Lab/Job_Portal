import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";

// Verifies the JWT (from the "token" cookie or Authorization header) and attaches req.user
export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    const token = req.cookies?.token || bearer;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded: TokenPayload = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Restricts a route to specific roles, e.g. authorize("employer")
export const authorize = (...roles: Array<"candidate" | "employer" | "admin">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied for this role" });
    }
    next();
  };
};
