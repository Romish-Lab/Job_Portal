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

export type WorkMode = "on-site" | "hybrid" | "remote";
export type ExperienceLevel = "entry-level" | "mid-level" | "senior-level" | "lead";

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
  workMode?: WorkMode;
  experienceLevel?: ExperienceLevel;
  educationRequirement?: string;
  benefits?: string[];
  employer: { _id: string; name: string; company?: string } | string;
  isActive: boolean;
  createdAt: string;

  // approval + paid advertisement (all set by the server)
  approvalStatus?: ApprovalStatus;
  paymentStatus?: PaymentStatus;
  rejectionReason?: string;

   reviewedAt?: string;
  adDuration?: number;
  adStartDate?: string | null;
  adExpiryDate?: string | null;
  adState?: AdState; // computed by GET /jobs/mine and the dashboard
  daysRemaining?: number;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
export type PaymentStatus = "unpaid" | "paid" | "failed";
export type AdState =
  | "pending_approval"
  | "rejected"
  | "payment_required"
  | "awaiting_payment"
  | "active"
  | "expiring_soon"
  | "expired";

export interface AdTier {
  days: number;
  price: number; // cents
}

export interface AdPricing {
  currency: string;
  tiers: AdTier[];
}

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "accepted"
  | "rejected";

export type WorkPreference = "remote" | "on-site" | "hybrid";
export type Gender = "male" | "female" | "other" | "prefer-not-to-say";

export interface Application {
  _id: string;
  job:
    | { _id: string; title: string; company: string; location: string }
    | string;
  candidate:
    | { _id: string; name: string; email: string; resumeUrl?: string }
    | string;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  photoUrl?: string; // older applications have no photo
  coverLetter: string;
  portfolioUrl?: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  address?: string;
  highestEducation: string;
  university?: string;
  yearsOfExperience: number;
  currentLocation: string;
  expectedSalary?: number;
  availability?: string;
  workPreference?: WorkPreference;
  skills: string[];
  additionalInfo?: string;
  declarationAccepted?: boolean;
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
  pendingApproval?: number;
  needPayment?: number;
}

export interface DashboardJobSummary {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  isActive: boolean;
  createdAt: string;
  adState?: AdState;
  daysRemaining?: number;
  adExpiryDate?: string | null;
}

export interface EmployerDashboardResponse {
  stats: DashboardStats;
  recentApplications: Application[];
  jobs: DashboardJobSummary[];
}

// GET /api/companies/:id
export interface CompanyProfileResponse {
 company: { id: string; name: string; logoUrl?: string; openJobs: number };
 jobs: Job[]; // live jobs, one page
 total: number;
 page: number;
 pages: number;
 inactiveJobs?: Job[]; // only sent to the owner
}
