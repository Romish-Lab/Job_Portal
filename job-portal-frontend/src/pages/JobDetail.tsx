import { FormEvent, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Job } from "../types";
import { useAuth } from "../context/AuthContext";
import client, { assetUrl } from "../api/client";
export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get(`/jobs/${id}`).then(({ data }) => setJob(data.job)).finally(() => setLoading(false));
  }, [id]);

  const onApply = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!resume) {
      setError("Please attach your resume (PDF, DOC, or DOCX).");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    if (coverLetter) formData.append("coverLetter", coverLetter);

    setApplying(true);
    try {
      await client.post(`/applications/${id}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Application submitted! You can track its status from My applications.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't submit your application.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!job) return <div className="page empty-state">Job not found.</div>;

  const employerLabel = typeof job.employer === "object" ? job.employer.company || job.employer.name : "";

  return (
    <div className="page page-narrow">
      <div className="job-detail-header">
        <div className="job-detail-top">
          {job.logoUrl ? (
            <img className="job-detail-logo" src={assetUrl(job.logoUrl)} alt={`${job.company} logo`} />
          ) : (
            <div className="job-detail-logo job-detail-logo-fallback">
              {job.company?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h1>{job.title}</h1>
            <p className="job-row-meta">
              {job.company} · {job.location} · <span className="job-type">{job.type}</span>
            </p>
            {employerLabel && <p className="job-employer">Posted by {employerLabel}</p>}
          </div>
        </div>
      </div>

      <section className="job-detail-section">
        <h2>Description</h2>
        <p className="job-description">{job.description}</p>
      </section>

      {job.requirements?.length > 0 && (
        <section className="job-detail-section">
          <h2>Requirements</h2>
          <ul className="requirement-list">
            {job.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="job-detail-section apply-section">
        <h2>Apply</h2>

        {!user && (
          <p className="empty-state">
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
              Log in
            </a>{" "}
            as a candidate to apply for this role.
          </p>
        )}

        {user?.role === "employer" && (
          <p className="empty-state">Employers can't apply to job postings.</p>
        )}

        {user?.role === "candidate" && (
          <form className="apply-form" onSubmit={onApply}>
            {message && <div className="form-success">{message}</div>}
            {error && <div className="form-error">{error}</div>}

            <label>
              Resume (PDF, DOC, or DOCX)
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
              />
            </label>

            <label>
              Cover letter (optional)
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Why you're a fit for this role…"
              />
            </label>

            <button className="btn-primary" type="submit" disabled={applying}>
              {applying ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
