import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { Application, ApplicationStatus } from "../types";

const STATUSES: ApplicationStatus[] = [
  "pending",
  "reviewed",
  "accepted",
  "rejected",
];

export default function JobApplicants() {
  const { id } = useParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplicants = async (page = currentPage) => {
    setLoading(true);

    try {
      const { data } = await client.get(`/applications/job/${id}`, {
        params: { page, limit: 10 },
      });
      setApplications(data.applications);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't load applicants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  useEffect(() => {
    fetchApplicants(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentPage]);

  const onStatusChange = async (
    appId: string,
    status: ApplicationStatus
  ) => {
    try {
      await client.patch(`/applications/${appId}/status`, { status });

      setApplications((prev) =>
        prev.map((app) =>
          app._id === appId
            ? { ...app, status }
            : app
        )
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Couldn't update application status."
      );
    }
  };

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  if (error) {
    return <div className="page empty-state">{error}</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Applicants</h1>
        <p className="page-subtitle">
          Review candidates and update their status.
        </p>
      </div>

      {applications.length === 0 && (
        <div className="empty-state">
          No applications yet for this role.
        </div>
      )}

      <div className="application-list">
        {applications.map((app) => {
          const candidate =
            typeof app.candidate === "object"
              ? app.candidate
              : null;

          return (
            <div className="applicant-row" key={app._id}>
              <div className="applicant-info">
                <h3>{candidate?.name}</h3>

                <p className="job-row-meta">
                  {candidate?.email}
                </p>

                {app.coverLetter && (
                  <p className="cover-letter">
                    {app.coverLetter}
                  </p>
                )}

                <a
                  className="resume-link"
                  href={`${
                    import.meta.env.VITE_API_URL?.replace(
                      /\/api$/,
                      ""
                    ) || "http://localhost:5000"
                  }${app.resumeUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View resume
                </a>
              </div>

              <select
                className="status-select"
                value={app.status}
                onChange={(e) =>
                  onStatusChange(
                    app._id,
                    e.target.value as ApplicationStatus
                  )
                }
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

      {!loading && !error && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "active" : ""}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}