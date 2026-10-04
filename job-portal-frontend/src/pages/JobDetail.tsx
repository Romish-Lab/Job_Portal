import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Job } from "../types";
import { useAuth } from "../context/AuthContext";
import BookmarkButton from "../components/BookmarkButton";
import "../styles/Bookmark.css";
import client, { assetUrl } from "../api/client";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/jobs/${id}`).then(({ data }) => setJob(data.job)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!job) return <div className="page empty-state">Job not found.</div>;

  const employerLabel = typeof job.employer === "object" ? job.employer.company || job.employer.name : "";
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;

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
              {employerId ? <Link to={`/companies/${employerId}`}>{job.company}</Link> : job.company} · {job.location} ·{" "}
              <span className="job-type">{job.type}</span>
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

      {(job.workMode || job.experienceLevel || job.educationRequirement) && (
        <section className="job-detail-section">
          <h2>Job details</h2>
          <dl className="job-facts">
            {job.workMode && (
              <div>
                <dt>Work arrangement</dt>
                <dd>{job.workMode.replace("-", " ")}</dd>
              </div>
            )}
            {job.experienceLevel && (
              <div>
                <dt>Experience level</dt>
                <dd>{job.experienceLevel.replace(/-/g, " ")}</dd>
              </div>
            )}
            {job.educationRequirement && (
              <div>
                <dt>Education</dt>
                <dd>{job.educationRequirement}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {!!job.benefits?.length && (
        <section className="job-detail-section">
          <h2>Benefits</h2>
          <ul className="requirement-list">
            {job.benefits.map((benefit, i) => (
              <li key={i}>{benefit}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="job-detail-section apply-section">
        <h2>Apply</h2>

        {!user && (
          <p className="empty-state">
            <Link to="/login">Log in</Link>{" "}
            as a candidate to apply for this role.
          </p>
        )}

        {user?.role === "employer" && (
          <p className="empty-state">Employers can't apply to job postings.</p>
        )}

        {user?.role === "candidate" && (
          <>
            <p className="job-row-meta" style={{ marginBottom: "1rem" }}>
              You'll be taken to a separate page to fill in your details, upload
              your photo and resume, and submit your application.
            </p>
            <div className="apply-actions">
              <Link className="btn-primary" to={`/jobs/${job._id}/apply`}>
                Apply now
              </Link>
              <BookmarkButton jobId={job._id} showText />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
