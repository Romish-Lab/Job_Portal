import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { Application } from "../types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  reviewed: "Reviewed",
  accepted: "Accepted",
  rejected: "Not selected",
};

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/applications/mine").then(({ data }) => {
      setApplications(data.applications);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My applications</h1>
        <p className="page-subtitle">Track the status of every job you've applied to.</p>
      </div>

      {applications.length === 0 && (
        <div className="empty-state">
          You haven't applied to anything yet. <Link to="/">Browse open roles</Link>.
        </div>
      )}

      <div className="application-list">
        {applications.map((app) => {
          const job = typeof app.job === "object" ? app.job : null;
          return (
            <div className="application-row" key={app._id}>
              <div>
                <h3>{job?.title || "Job posting"}</h3>
                <p className="job-row-meta">
                  {job?.company} · {job?.location}
                </p>
              </div>
              <span className={`status-badge status-${app.status}`}>
                {STATUS_LABEL[app.status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
