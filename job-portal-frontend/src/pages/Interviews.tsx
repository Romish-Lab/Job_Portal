import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import "../styles/Interviews.css";
import { API_ORIGIN } from "../api/client";
interface Interview {
  _id: string;
  type: "phone" | "video" | "in-person" | "technical";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  scheduledDate: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  result?: "passed" | "failed" | "pending";
  job: {
    _id: string;
    title: string;
    company: string;
    logoUrl?: string;
  };
  employer?: {
    name: string;
    email: string;
    company: string;
  };
  candidate?: {
    name: string;
    email: string;
  };
}

const Interviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data } = await axios.get(
        `${API_ORIGIN}/api/interviews/candidate`,
        { withCredentials: true },
      );
      setInterviews(data.interviews);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch interviews",
      );
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInterviews = () => {
    const now = new Date();
    switch (filter) {
      case "upcoming":
        return interviews.filter(
          (i) => i.status === "scheduled" && new Date(i.scheduledDate) > now,
        );
      case "completed":
        return interviews.filter((i) => i.status === "completed");
      default:
        return interviews;
    }
  };

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone size={20} />;
      case "video":
        return <Video size={20} />;
      case "in-person":
        return <MapPin size={20} />;
      case "technical":
        return <Users size={20} />;
      default:
        return <Calendar size={20} />;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let prefix = "";
    if (diffInDays === 0) prefix = "Today, ";
    else if (diffInDays === 1) prefix = "Tomorrow, ";
    else if (diffInDays === -1) prefix = "Yesterday, ";

    return (
      prefix +
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  const filteredInterviews = getFilteredInterviews();
  const upcomingCount = interviews.filter(
    (i) => i.status === "scheduled" && new Date(i.scheduledDate) > new Date(),
  ).length;
  const completedCount = interviews.filter(
    (i) => i.status === "completed",
  ).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="interviews-page">
      <div className="interviews-container">
        {/* Header */}
        <div className="interviews-header">
          <h1>
            <Calendar className="calendar-icon" size={32} />
            My Interviews
          </h1>
          <p>
            {interviews.length === 0
              ? "No interviews scheduled yet"
              : `${interviews.length} interview${interviews.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="interview-filter-tabs">
          <button
            onClick={() => setFilter("all")}
            className={`interview-filter-tab ${filter === "all" ? "active" : ""}`}
          >
            All ({interviews.length})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`interview-filter-tab ${filter === "upcoming" ? "active" : ""}`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`interview-filter-tab ${filter === "completed" ? "active" : ""}`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* No interviews */}
        {filteredInterviews.length === 0 ? (
          <div className="interviews-empty">
            <Calendar className="interviews-empty-icon" size={64} />
            <h3>No interviews found</h3>
            <p>
              {filter === "upcoming"
                ? "You don't have any upcoming interviews"
                : filter === "completed"
                  ? "You don't have any completed interviews yet"
                  : "You haven't been scheduled for any interviews yet"}
            </p>
          </div>
        ) : (
          /* Interviews list */
          <div className="interviews-grid">
            {filteredInterviews.map((interview) => (
              <div
                key={interview._id}
                className={`interview-card ${
                  isUpcoming(interview.scheduledDate) &&
                  interview.status === "scheduled"
                    ? "upcoming"
                    : ""
                }`}
              >
                <div className="interview-card-content">
                  {/* Job logo */}
                  <div className="interview-logo">
                    {interview.job.logoUrl ? (
                      <img
                        src={`${API_ORIGIN}${interview.job.logoUrl}`}
                        alt={interview.job.company}
                      />
                    ) : (
                      <div className="interview-logo-placeholder">
                        <Calendar size={32} />
                      </div>
                    )}
                  </div>

                  {/* Interview details */}
                  <div className="interview-info">
                    <div className="interview-header">
                      <div className="interview-title-group">
                        <h3>{interview.job.title}</h3>
                        <p className="interview-company">
                          {interview.job.company}
                        </p>
                      </div>
                      <span
                        className={`interview-status-badge ${interview.status}`}
                      >
                        {interview.status.charAt(0).toUpperCase() +
                          interview.status.slice(1)}
                      </span>
                    </div>

                    {/* Interview metadata */}
                    <div className="interview-metadata">
                      <div className="interview-metadata-item">
                        <span className="type-icon">
                          {getInterviewIcon(interview.type)}
                        </span>
                        <span className="capitalize">
                          {interview.type} Interview
                        </span>
                      </div>
                      <div className="interview-metadata-item">
                        <Calendar size={20} />
                        {formatDate(interview.scheduledDate)}
                      </div>
                      <div className="interview-metadata-item">
                        <Clock size={20} />
                        {interview.duration} minutes
                      </div>
                      {interview.location && (
                        <div className="interview-metadata-item">
                          <MapPin size={20} />
                          {interview.location}
                        </div>
                      )}
                    </div>

                    {/* Meeting link */}
                    {interview.meetingLink && (
                      <div className="interview-meeting-link">
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-join-meeting"
                        >
                          <Video size={16} />
                          Join Meeting
                        </a>
                      </div>
                    )}

                    {/* Notes */}
                    {interview.notes && (
                      <div className="interview-notes">
                        <p>
                          <strong>Notes:</strong> {interview.notes}
                        </p>
                      </div>
                    )}

                    {/* Result (if completed) */}
                    {interview.status === "completed" && interview.result && (
                      <div className={`interview-result ${interview.result}`}>
                        {interview.result === "passed" ? (
                          <>
                            <CheckCircle size={20} />
                            <span>Passed</span>
                          </>
                        ) : interview.result === "failed" ? (
                          <>
                            <XCircle size={20} />
                            <span>Not selected</span>
                          </>
                        ) : (
                          <span>Pending result</span>
                        )}
                      </div>
                    )}

                    {/* Feedback */}
                    {interview.feedback && (
                      <div className="interview-feedback">
                        <p>
                          <strong>Feedback:</strong> {interview.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;
