import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.routes";
import userRoutes from "./routes/user.routes";
import applicationRoutes from "./routes/application.routes";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

// 404 handler
app.use((_req, res) =>
  res.status(404).json({ message: "Server is up and Running!!!!!!" }),
);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  },
);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Server is up and running on http://localhost:${PORT}`),
  );
});
