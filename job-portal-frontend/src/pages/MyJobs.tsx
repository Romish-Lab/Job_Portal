import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { Job } from "../types";

export default function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const { data } = await client.get("/jobs/mine");
    setJobs(data.jobs);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this job posting? This can't be undone.")) return;
    await client.delete(`/jobs/${id}`);
    fetchJobs();
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My postings</h1>
        <p className="page-subtitle">Jobs you've posted, and who's applied.</p>
      </div>

      {jobs.length === 0 && (
        <div className="empty-state">
          You haven't posted any jobs yet. <Link to="/post-job">Post your first one</Link>.
        </div>
      )}

      <div className="my-jobs-list">
        {jobs.map((job) => (
          <div className="my-job-row" key={job._id}>
            <div>
              <h3>{job.title}</h3>
              <p className="job-row-meta">
                {job.company} · {job.location} · <span className="job-type">{job.type}</span>
              </p>
            </div>
            <div className="my-job-actions">
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
