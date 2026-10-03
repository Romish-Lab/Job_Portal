import { Request, Response } from "express";
import User from "../models/user.model";
import Job from "../models/job.model";
import Payment from "../models/payment.model";
import Application from "../models/application.model";
import ContactMessage from "../models/contactMessage.model";
import AuditLog from "../models/auditLog.model";
import { escapeRegex, parsePaging, toCsv } from "../utils/adminHelpers";

const MONTHS = 6;

// [{ key: "2026-04", label: "Apr" }, ...] for the last 6 months, oldest first (UTC)
const lastMonths = () => {
  const now = new Date();
  return Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS - 1 - i), 1));
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
    };
  });
};
const monthsStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS - 1), 1));
};

// GET /api/admin/stats
export const getStats = async (_req: Request, res: Response) => {
  const now = new Date();
  const since = monthsStart();
  const months = lastMonths();

  const [
    totalUsers,
    suspendedUsers,
    usersByRole,
    jobsByStatus,
    pendingJobs,
    activeAds,
    totalApplications,
    unreadMessages,
    totalMessages,
    revenueTotals,
    revenueMonthly,
    signupsMonthly,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isSuspended: true }),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Job.aggregate([{ $group: { _id: "$approvalStatus", count: { $sum: 1 } } }]),
    Job.countDocuments({ approvalStatus: "pending" }),
    Job.countDocuments({ isActive: true, adExpiryDate: { $gt: now } }),
    Application.countDocuments({}),
    ContactMessage.countDocuments({ isRead: false }),
    ContactMessage.countDocuments({}),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$currency", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: "paid", paidAt: { $gte: since } } },
      {
        $group: {
          _id: { m: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, c: "$currency" },
          total: { $sum: "$amount" },
        },
      },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
  ]);

  const revenue: Record<string, number> = {};
  let paidAds = 0;
  for (const r of revenueTotals) {
    revenue[r._id] = r.total;
    paidAds += r.count;
  }

  // Monthly chart uses the currency that earned the most (a chart can't mix currencies)
  const chartCurrency = Object.entries(revenue).sort((a, b) => b[1] - a[1])[0]?.[0] || "usd";
  const revenueByMonth = months.map((m) => ({
    label: m.label,
    value: revenueMonthly.find((r) => r._id.m === m.key && r._id.c === chartCurrency)?.total || 0,
  }));
  const signupsByMonth = months.map((m) => ({
    label: m.label,
    value: signupsMonthly.find((r) => r._id === m.key)?.count || 0,
  }));

  const pick = (rows: any[], key: string) => rows.find((r) => r._id === key)?.count || 0;

  res.status(200).json({
    totals: {
      users: totalUsers,
      suspendedUsers,
      pendingJobs,
      activeAds,
      paidAds,
      applications: totalApplications,
      unreadMessages,
      messages: totalMessages,
      revenue, // minor units per currency
    },
    charts: {
      revenueCurrency: chartCurrency,
      revenueByMonth,
      signupsByMonth,
      usersByRole: ["candidate", "employer", "admin"].map((r) => ({ label: r, value: pick(usersByRole, r) })),
      jobsByStatus: ["pending", "approved", "rejected", "expired"].map((s) => ({
        label: s,
        value: pick(jobsByStatus, s),
      })),
    },
  });
};

// GET /api/admin/audit-logs?action=&search=&page=&limit=
export const getAuditLogs = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePaging(req.query, 20);
  const filter: Record<string, any> = {};

  const action = String(req.query.action || "");
  if (action && action !== "all") filter.action = action;
  const search = String(req.query.search || "").trim().slice(0, 100);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ actorName: rx }, { actorEmail: rx }, { targetLabel: rx }, { details: rx }];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  res.status(200).json({ logs, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
};

// ---------- CSV reports ----------

const REPORT_LIMIT = 50000;

// GET /api/admin/reports/:type?from=YYYY-MM-DD&to=YYYY-MM-DD   (type: users|jobs|payments|applications|messages|audit)
export const downloadReport = async (req: Request, res: Response) => {
  const type = String(req.params.type);

  // optional date range on createdAt (inclusive)
  const dateFilter: Record<string, Date> = {};
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;
  if (from && !isNaN(from.getTime())) dateFilter.$gte = from;
  if (to && !isNaN(to.getTime())) {
    to.setUTCHours(23, 59, 59, 999);
    dateFilter.$lte = to;
  }
  const range = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  let headers: string[] = [];
  let rows: unknown[][] = [];

  switch (type) {
    case "users": {
      const users = await User.find(range).select("-password").sort({ createdAt: -1 }).limit(REPORT_LIMIT);
      headers = ["Name", "Email", "Role", "Company", "Status", "Suspended reason", "Joined"];
      rows = users.map((u) => [
        u.name, u.email, u.role, u.company, u.isSuspended ? "suspended" : "active", u.suspendedReason, u.createdAt,
      ]);
      break;
    }
    case "jobs": {
      const jobs = await Job.find(range).populate("employer", "name email").sort({ createdAt: -1 }).limit(REPORT_LIMIT);
      headers = [
        "Title", "Company", "Location", "Type", "Salary min", "Salary max", "Approval", "Payment",
        "Ad days", "Ad start", "Ad expiry", "Employer", "Employer email", "Created",
      ];
      rows = jobs.map((j: any) => [
        j.title, j.company, j.location, j.type, j.salaryMin, j.salaryMax, j.approvalStatus, j.paymentStatus,
        j.adDuration, j.adStartDate, j.adExpiryDate, j.employer?.name, j.employer?.email, j.createdAt,
      ]);
      break;
    }
    case "payments": {
      const payments = await Payment.find({ status: "paid", ...range })
        .populate("job", "title company")
        .populate("employer", "name email")
        .sort({ paidAt: -1 })
        .limit(REPORT_LIMIT);
      headers = ["Paid at", "Job", "Company", "Employer", "Employer email", "Days", "Amount", "Currency"];
      rows = payments.map((p: any) => [
        p.paidAt, p.job?.title, p.job?.company, p.employer?.name, p.employer?.email, p.durationDays,
        (p.amount / 100).toFixed(2), String(p.currency).toUpperCase(),
      ]);
      break;
    }
    case "applications": {
      const apps = await Application.find(range).populate("job", "title company").sort({ createdAt: -1 }).limit(REPORT_LIMIT);
      headers = ["Applied", "Job", "Company", "Applicant", "Email", "Phone", "Experience (yrs)", "Location", "Status"];
      rows = apps.map((a: any) => [
        a.createdAt, a.job?.title, a.job?.company, a.fullName, a.email, a.phone, a.yearsOfExperience,
        a.currentLocation, a.status,
      ]);
      break;
    }
    case "messages": {
      const msgs = await ContactMessage.find(range).sort({ createdAt: -1 }).limit(REPORT_LIMIT);
      headers = ["Received", "Name", "Email", "Subject", "Message", "Read"];
      rows = msgs.map((m) => [m.createdAt, m.name, m.email, m.subject, m.message, m.isRead ? "yes" : "no"]);
      break;
    }
    case "audit": {
      const logs = await AuditLog.find(range).sort({ createdAt: -1 }).limit(REPORT_LIMIT);
      headers = ["When", "Admin", "Admin email", "Action", "Target", "Details"];
      rows = logs.map((l) => [l.createdAt, l.actorName, l.actorEmail, l.action, l.targetLabel, l.details]);
      break;
    }
    default:
      return res.status(400).json({ message: "Unknown report type" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${type}-report-${stamp}.csv"`);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(toCsv(headers, rows));
};
