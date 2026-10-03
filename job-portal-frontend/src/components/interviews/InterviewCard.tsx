import { Calendar, Clock, MapPin, Video, Phone, Users } from "lucide-react";
import { JobLogo } from "../ui/JobLogo";
import { StatusBadge } from "../ui/StatusBadge";
import { formatDateTime } from "../../utils/formatters";

interface InterviewCardProps {
  interview: {
    _id: string;
    type: "phone" | "video" | "in-person" | "technical";
    status: string;
    scheduledDate: string;
    duration: number;
    location?: string;
    meetingLink?: string;
    notes?: string;
    feedback?: string;
    result?: "passed" | "failed" | "pending";
    job: {
      _id: string;
      title: string;
      company: string;
      logoUrl?: string;
    };
  };
  isUpcoming?: boolean;
}

const getInterviewIcon = (type: string) => {
  const icons = {
    phone: <Phone className="h-5 w-5" />,
    video: <Video className="h-5 w-5" />,
    "in-person": <MapPin className="h-5 w-5" />,
    technical: <Users className="h-5 w-5" />,
  };
  return icons[type as keyof typeof icons] || <Calendar className="h-5 w-5" />;
};

export const InterviewCard = ({ interview, isUpcoming }: InterviewCardProps) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 ${
        isUpcoming ? "border-l-4 border-emerald-500" : ""
      }`}
    >
      <div className="flex gap-6">
        <div className="flex-shrink-0">
          <JobLogo logoUrl={interview.job.logoUrl} companyName={interview.job.company} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {interview.job.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{interview.job.company}</p>
            </div>
            <StatusBadge status={interview.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {getInterviewIcon(interview.type)}
              <span className="capitalize">{interview.type} Interview</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="h-5 w-5" />
              {formatDateTime(interview.scheduledDate)}
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="h-5 w-5" />
              {interview.duration} minutes
            </div>
            {interview.location && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-5 w-5" />
                {interview.location}
              </div>
            )}
          </div>

          {interview.meetingLink && (
            <div className="mt-4">
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Video className="h-4 w-4" />
                Join Meeting
              </a>
            </div>
          )}

          {interview.notes && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Notes:</strong> {interview.notes}
              </p>
            </div>
          )}

          {interview.feedback && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Feedback:</strong> {interview.feedback}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
