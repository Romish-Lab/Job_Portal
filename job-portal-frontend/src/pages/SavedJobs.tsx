import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Bookmark, MapPin, Clock, DollarSign, Briefcase, X } from "lucide-react";
import { API_ORIGIN } from "../api/client";
import "../styles/SavedJobs.css";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  logoUrl?: string;
  createdAt: string;
  available?: boolean;
  employer?: {
    name: string;
    company: string;
  };
}

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const { data } = await axios.get(`${API_ORIGIN}/api/saved-jobs`, {
        withCredentials: true,
      });
      setSavedJobs(data.savedJobs);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await axios.delete(`${API_ORIGIN}/api/saved-jobs/${jobId}`, {
        withCredentials: true,
      });
      setSavedJobs(savedJobs.filter((job) => job._id !== jobId));
      toast.success("Job removed from saved");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove job");
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not disclosed";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="saved-jobs-page">
      <div className="saved-jobs-container">
        {/* Header */}
        <div className="saved-jobs-header">
          <h1>
            <Bookmark className="bookmark-icon" size={32} />
            Saved Jobs
          </h1>
          <p>
            {savedJobs.length === 0
              ? "You haven't saved any jobs yet"
              : `${savedJobs.length} job${savedJobs.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>

        {/* No saved jobs */}
        {savedJobs.length === 0 ? (
          <div className="saved-jobs-empty">
            <Bookmark className="saved-jobs-empty-icon" size={64} />
            <h3>No saved jobs yet</h3>
            <p>Start saving jobs you're interested in to view them here</p>
            <Link to="/jobs" className="btn-browse-jobs">
              Browse Jobs
            </Link>
          </div>
        ) : (
          /* Saved jobs list */
          <div className="saved-jobs-grid">
            {savedJobs.map((job) => (
              <div key={job._id} className="saved-job-card">
                {/* Remove button */}
                <button
                  onClick={() => handleUnsaveJob(job._id)}
                  className="btn-remove-saved"
                  title="Remove from saved"
                >
                  <X size={20} />
                </button>

                <div className="job-card-content">
                  {/* Company logo */}
                  <div className="job-logo">
                    {job.logoUrl ? (
                      <img
                        src={`${API_ORIGIN}${job.logoUrl}`}
                        alt={job.company}
                      />
                    ) : (
                      <div className="job-logo-placeholder">
                        <Briefcase size={32} />
                      </div>
                    )}
                  </div>

                  {/* Job details */}
                  <div className="job-info">
                    {job.available === false ? (
                      <span className="job-title">{job.title}</span>
                    ) : (
                      <Link to={`/jobs/${job._id}`} className="job-title">
                        {job.title}
                      </Link>
                    )}
                    <p className="job-company">{job.company}</p>

                    {/* Job metadata */}
                    <div className="job-metadata">
                      <div className="job-metadata-item">
                        <MapPin size={16} />
                        {job.location}
                      </div>
                      <div className="job-metadata-item">
                        <Briefcase size={16} />
                        {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                      </div>
                      <div className="job-metadata-item">
                        <DollarSign size={16} />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </div>
                      <div className="job-metadata-item">
                        <Clock size={16} />
                        {formatDate(job.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    {job.available === false ? (
                      <p className="job-company">This job is no longer available.</p>
                    ) : (
                      <div className="job-actions">
                        <Link to={`/jobs/${job._id}`} className="btn-view-details">
                          View Details
                        </Link>
                        <Link to={`/jobs/${job._id}/apply`} className="btn-apply-now">
                          Apply Now
                        </Link>
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

export default SavedJobs;