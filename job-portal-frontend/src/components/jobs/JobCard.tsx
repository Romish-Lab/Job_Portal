import { Link } from "react-router-dom";
import { MapPin, Clock, DollarSign, Briefcase } from "lucide-react";
import { JobLogo } from "../ui/JobLogo";
import { formatSalary, formatDate } from "../../utils/formatters";

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salaryMin?: number;
    salaryMax?: number;
    logoUrl?: string;
    createdAt: string;
  };
  actions?: React.ReactNode;
  onClick?: () => void;
}

export const JobCard = ({ job, actions, onClick }: JobCardProps) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 relative"
      onClick={onClick}
    >
      {actions && <div className="absolute top-4 right-4">{actions}</div>}

      <div className="flex gap-6">
        <div className="flex-shrink-0">
          <JobLogo logoUrl={job.logoUrl} companyName={job.company} />
        </div>

        <div className="flex-1 min-w-0">
          <Link
            to={`/jobs/${job._id}`}
            className="text-xl font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {job.title}
          </Link>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{job.company}</p>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatSalary(job.salaryMin, job.salaryMax)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(job.createdAt)}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Link
              to={`/jobs/${job._id}`}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              View Details
            </Link>
            <Link
              to={`/jobs/${job._id}/apply`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
