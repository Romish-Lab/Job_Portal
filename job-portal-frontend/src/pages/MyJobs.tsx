import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import client from "../api/client";
import { Job } from "../types";
import AdStatusBadge from "../components/AdStatusBadge";
import { formatDate } from "../utils/money";

// One line under each job explaining where it is in the approve -> pay -> live flow
function AdDetails({ job }: { job: Job }) {
  switch (job.adState) {
    case "pending_approval":
      return <p className="ad-note">Waiting for admin approval</p>;
    case "rejected":
      return (
        <p className="ad-note ad-note--danger">
          Rejected{job.rejectionReason ? `: ${job.rejectionReason}` : ""}
        </p>
      );
    case "payment_required":
    case "awaiting_payment":
      return (
        <p className="ad-note">
          {job.adState === "awaiting_payment"
            ? "Payment started but not completed."
            : "Approved! Pay for an advertisement to publish this job."}
        </p>
      );
    case "active":
    case "expiring_soon":
      return (
        <p className="ad-note ad-note--ok">
          <strong>Advertisement Active</strong> · Expires: {formatDate(job.adExpiryDate)} · Days Remaining:{" "}
          {job.daysRemaining}
        </p>
      );
    case "expired":
      return (
        <p className="ad-note">
          <strong>Advertisement Expired</strong> on {formatDate(job.adExpiryDate)}
        </p>
      );
    default:
      return null;
  }
}

export default function MyJobs() {
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const flash = (location.state as { message?: string } | null)?.message;

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/jobs/mine");
      setJobs(data.jobs);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't load your postings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this job posting? This can't be undone.")) return;
    try {
      await client.delete(`/jobs/${id}`);
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't delete the job.");
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My postings</h1>
        <p className="page-subtitle">Jobs you've posted, their advertisement status, and who's applied.</p>
      </div>

      {flash && <div className="form-success">{flash}</div>}
      {error && <div className="form-error">{error}</div>}

      {jobs.length === 0 && (
        <div className="empty-state">
          You haven't posted any jobs yet. <Link to="/post-job">Post your first one</Link>.
        </div>
      )}

      <div className="my-jobs-list">
        {jobs.map((job) => (
          <div className="my-job-row" key={job._id}>
            <div>
              <h3>
                {job.title} <AdStatusBadge state={job.adState} />
              </h3>
              <p className="job-row-meta">
                {job.company} · {job.location} · <span className="job-type">{job.type}</span>
              </p>
              <AdDetails job={job} />
            </div>
            <div className="my-job-actions">
              {(job.adState === "payment_required" || job.adState === "awaiting_payment") && (
                <Link className="btn-primary-sm" to={`/jobs/${job._id}/advertise`}>
                  Pay for Advertisement
                </Link>
              )}
              {job.adState === "expired" && (
                <Link className="btn-primary-sm" to={`/jobs/${job._id}/advertise`}>
                  Renew advertisement
                </Link>
              )}
              <Link className="btn-ghost" to={`/jobs/${job._id}/applicants`}>
                View applicants
              </Link>
              <button className="btn-ghost btn-danger" onClick={() => onDelete(job._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
