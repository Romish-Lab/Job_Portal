import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { EmployerDashboardResponse } from "../types";

export default function EmployerDashboard() {
  const [data, setData] = useState<EmployerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get("/jobs/dashboard")
      .then(({ data }) => setData(data))
      .catch((err) =>
        setError(err.response?.data?.message || "Couldn't load dashboard.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard…</div>;

  if (error) {
    return (
      <div className="page">
        <div className="form-error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentApplications, jobs } = data;

  return (
    <div className="page employer-dashboard">
      <div className="page-header dashboard-header">
        <div>
          <h1>Employer Dashboard</h1>
          <p className="page-subtitle">
            Manage your job postings and keep track of applicants.
          </p>
        </div>
        <Link className="btn-primary" to="/post-job">+ Post a job</Link>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span>Total jobs</span>
          <strong>{stats.totalJobs}</strong>
        </div>
        <div className="dashboard-stat">
          <span>Active jobs</span>
          <strong>{stats.activeJobs}</strong>
        </div>
        <div className="dashboard-stat">
          <span>Applications</span>
          <strong>{stats.totalApplications}</strong>
        </div>
        <div className="dashboard-stat dashboard-stat--pending">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
      </div>

      <div className="dashboard-status-grid">
        <div className="dashboard-status-card">
          <span>Reviewed</span>
          <strong>{stats.reviewed}</strong>
        </div>
        <div className="dashboard-status-card dashboard-status-card--success">
          <span>Accepted</span>
          <strong>{stats.accepted}</strong>
        </div>
        <div className="dashboard-status-card dashboard-status-card--danger">
          <span>Rejected</span>
          <strong>{stats.rejected}</strong>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Recent applications</h2>
            <p>Latest candidates who applied to your jobs.</p>
          </div>
        </div>

        {recentApplications.length === 0 ? (
          <div className="empty-state">No applications yet.</div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((application) => {
                  const candidate =
                    typeof application.candidate === "object"
                      ? application.candidate
                      : null;
                  const job =
                    typeof application.job === "object"
                      ? application.job
                      : null;

                  return (
                    <tr key={application._id}>
                      <td>
                        <strong>{candidate?.name || "Candidate"}</strong>
                        {candidate?.email && <small>{candidate.email}</small>}
                      </td>
                      <td>{job?.title || "Job"}</td>
                      <td>
                        <span className={`dashboard-status ${application.status}`}>
                          {application.status}
                        </span>
                      </td>
                      <td>{new Date(application.createdAt).toLocaleDateString()}</td>
                      <td>
                        {job && (
                          <Link
                            className="btn-ghost"
                            to={`/jobs/${job._id}/applicants`}
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>My recent postings</h2>
            <p>Your five latest job postings.</p>
          </div>
          <Link to="/my-jobs">View all</Link>
        </div>

        <div className="dashboard-jobs">
          {jobs.length === 0 ? (
            <div className="empty-state">
              You haven't posted any jobs yet. <Link to="/post-job">Post one</Link>.
            </div>
          ) : (
            jobs.map((job) => (
              <div className="dashboard-job-row" key={job._id}>
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company} · {job.location} · {job.type}</p>
                </div>
                <Link className="btn-ghost" to={`/jobs/${job._id}/applicants`}>
                  Applicants
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
