import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { Application, ApplicationStatus } from "../types";

const STATUSES: ApplicationStatus[] = ["pending", "reviewed", "accepted", "rejected"];

export default function JobApplicants() {
  const { id } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/applications/job/${id}`);
      setApplications(data.applications);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't load applicants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onStatusChange = async (appId: string, status: ApplicationStatus) => {
    await client.patch(`/applications/${appId}/status`, { status });
    fetchApplicants();
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page empty-state">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Applicants</h1>
        <p className="page-subtitle">Review candidates and update their status.</p>
      </div>

      {applications.length === 0 && <div className="empty-state">No applications yet for this role.</div>}

      <div className="application-list">
        {applications.map((app) => {
          const candidate = typeof app.candidate === "object" ? app.candidate : null;
          return (
            <div className="applicant-row" key={app._id}>
              <div className="applicant-info">
                <h3>{candidate?.name}</h3>
                <p className="job-row-meta">{candidate?.email}</p>
                {app.coverLetter && <p className="cover-letter">{app.coverLetter}</p>}
                <a
                  className="resume-link"
                  href={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000"}${app.resumeUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View resume
                </a>
              </div>
              <select
                className="status-select"
                value={app.status}
                onChange={(e) => onStatusChange(app._id, e.target.value as ApplicationStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
