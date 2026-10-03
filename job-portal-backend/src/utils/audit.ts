import { Request } from "express";
import AuditLog, { AuditAction } from "../models/auditLog.model";
import User from "../models/user.model";

interface AuditInput {
  action: AuditAction;
  targetType: "job" | "user" | "message" | "pricing";
  targetId?: string;
  targetLabel?: string;
  details?: string;
}

// Best-effort: a logging problem must never fail the admin action itself.
export const logAudit = async (req: Request, input: AuditInput) => {
  try {
    const actor = req.user?.id ? await User.findById(req.user.id).select("name email") : null;
    await AuditLog.create({
      actor: req.user?.id,
      actorName: actor?.name || "Unknown",
      actorEmail: actor?.email || "",
      ...input,
      details: input.details?.slice(0, 1000),
    });
  } catch (err) {
    console.error("Failed to write audit log:", (err as Error).message);
  }
};
