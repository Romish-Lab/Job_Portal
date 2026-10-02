import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client, { assetUrl } from "../api/client";
import { CompanyProfileResponse } from "../types";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";
import AdStatusBadge from "../components/AdStatusBadge";
import JobAdActions from "../components/JobAdActions";

// Public company page: every live job of one employer.
// The owner also sees their jobs that aren't live, with edit / renew shortcuts.
export default function CompanyProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<CompanyProfileResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [id]);

  useEffect(() => {
    let cancelled = false; // ignore responses from a previous company / page
    setLoading(true);
    setError("");
    client
      .get(`/companies/${id}`, { params: { page } })
      .then(({ data }) => !cancelled && setData(data))
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(err.response?.status === 404 ? "Company not found." : err.response?.data?.message || "Couldn't load this company.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, page, user?.id]); // user?.id: reload once login state is known so the owner view appears

  if (loading && !data) return <div className="page-loading">Loading…</div>;
  if (error || !data) {
    return (
      <div className="page page-narrow">
        <div className="empty-state">{error || "Company not found."}</div>
        <Link to="/">← Browse all jobs</Link>
      </div>
    );
  }

  const { company, jobs, pages, inactiveJobs } = data;
  const isOwner = user?.id === company.id;

  return (
    <div className="page">
      <div className="job-detail-header">
        <div className="job-detail-top">
          {company.logoUrl ? (
            <img className="job-detail-logo" src={assetUrl(company.logoUrl)} alt={`${company.name} logo`} />
          ) : (
            <div className="job-detail-logo job-detail-logo-fallback">
              {company.name.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h1>{company.name}</h1>
            <p className="page-subtitle">
              {company.openJobs} open position{company.openJobs === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">{company.name} has no open positions right now.</div>
      ) : (
        <div className="job-grid" style={{ opacity: loading ? 0.6 : 1 }}>
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1 || loading}>
            ← Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)} disabled={loading}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(page + 1)} disabled={page === pages || loading}>
            Next →
          </button>
        </div>
      )}

      {isOwner && inactiveJobs && inactiveJobs.length > 0 && (
        <section className="job-detail-section" style={{ marginTop: "2.5rem" }}>
          <h2>Not currently advertised</h2>
          <p className="page-subtitle">Only you can see these. Renew or edit them to get them back online.</p>
          <div className="my-jobs-list">
            {inactiveJobs.map((job) => (
              <div className="my-job-row" key={job._id}>
                <div>
                  <h3>
                    {job.title} <AdStatusBadge state={job.adState} />
                  </h3>
                  <p className="job-row-meta">
                    {job.location} · <span className="job-type">{job.type}</span>
                  </p>
                </div>
                <div className="my-job-actions">
                  <JobAdActions job={job} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}