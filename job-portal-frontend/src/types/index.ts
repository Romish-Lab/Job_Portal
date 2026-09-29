export type UserRole = "candidate" | "employer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
}

export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "remote";

export interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  company: string;
  logoUrl?: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  type: JobType;
  employer: { _id: string; name: string; company?: string } | string;
  isActive: boolean;
  createdAt: string;
}

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "accepted"
  | "rejected";

export interface Application {
  _id: string;
  job:
    | { _id: string; title: string; company: string; location: string }
    | string;
  candidate:
    | { _id: string; name: string; email: string; resumeUrl?: string }
    | string;
  resumeUrl: string;
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string;
}
export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pending: number;
  reviewed: number;
  accepted: number;
  rejected: number;
}

export interface DashboardJobSummary {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  isActive: boolean;
  createdAt: string;
}

export interface EmployerDashboardResponse {
  stats: DashboardStats;
  recentApplications: Application[];
  jobs: DashboardJobSummary[];
}