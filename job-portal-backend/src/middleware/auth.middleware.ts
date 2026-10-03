import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";
import User from "../models/user.model";

// Verifies the JWT (from the "token" cookie or Authorization header), then checks the
// account still exists and isn't suspended. Attaches req.user (role comes from the DB).
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let decoded: TokenPayload;
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    const token = req.cookies?.token || bearer;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    decoded = verifyToken(token);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const user = await User.findById(decoded.id).select("role isSuspended");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    if (user.isSuspended) {
      return res.status(403).json({ message: "Your account has been suspended" });
    }
    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (error) {
    next(error);
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

// Like protect, but never rejects: attaches req.user if a valid token is present.
// Used on public routes that show extra data to the owner/admin.
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    const token = req.cookies?.token || bearer;
    if (token) req.user = verifyToken(token);
  } catch {
    // invalid token -> treat as anonymous
  }
  next();
};
