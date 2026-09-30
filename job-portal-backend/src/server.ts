import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import { UPLOADS_ROOT, LOGO_DIR } from "./middleware/upload.middleware";
import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.routes";
import userRoutes from "./routes/user.routes";
import applicationRoutes from "./routes/application.routes";
import contactRoutes from "./routes/contact.routes";
import adminRoutes from "./routes/admin.routes";
import paymentRoutes from "./routes/payment.routes";
import { stripeWebhook } from "./controllers/payment.controller";
import { startAdExpiryScheduler } from "./utils/adExpiry";

dotenv.config();

for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`${key} is not defined in .env`);
    process.exit(1);
  }
}

const app = express();
const isProd = process.env.NODE_ENV === "production";

// Behind a proxy (Render/Railway) so rate limiting sees the real client IP
if (isProd) app.set("trust proxy", 1);

// "cross-origin" resource policy lets the Vite/Vercel frontend load logos from this API
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
// Stripe webhook: needs the RAW body for signature checking, so it must be
// registered BEFORE express.json().
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Public files: company logos only. Resumes are NOT served statically;
// they go through GET /api/applications/:id/resume (auth + ownership check).
app.use("/uploads/logos", express.static(LOGO_DIR));
// Legacy logos uploaded before the logos/ folder existed: images only, never documents
app.use(
  "/uploads",
  (req, res, next) =>
    /^\/[^/]+\.(png|jpe?g|webp)$/i.test(req.path)
      ? next()
      : res.status(404).json({ message: "Not found" }),
  express.static(UPLOADS_ROOT),
);

// Rate limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many messages, please try again later" },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/contact", contactLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

// 404 handler
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    // Upload validation errors (file type/size) are the client's fault
    if (err.name === "MulterError" || /^Only .* allowed$/.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err.stack);
    res.status(500).json({
      message: "Something went wrong",
      ...(isProd ? {} : { error: err.message }),
    });
  },
);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startAdExpiryScheduler();
  app.listen(PORT, () =>
    console.log(`Server is up and running on http://localhost:${PORT}`),
  );
});
