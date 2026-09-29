import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import client from "../api/client";
import { Job } from "../types";
import JobCard from "../components/JobCard";
import Hero, { SearchFilters } from "../components/Hero";
import HotJobs from "../components/HotJobs";

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The URL is the single source of truth for filters
  const title = searchParams.get("title") || "";
  const type = searchParams.get("type") || "";
  const company = searchParams.get("company") || "";
  const location = searchParams.get("location") || ""; // set by the footer links

  useEffect(() => {
    const params: Record<string, string> = {};
    if (title) params.title = title;
    if (type) params.type = type;
    if (company) params.company = company;
    if (location) params.location = location;

    setLoading(true);
    setError("");
    client
      .get("/jobs", { params })
      .then(({ data }) => setJobs(data.jobs))
      .catch(() => setError("Couldn't load jobs. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [title, type, company, location]);

  const onSearch = (f: SearchFilters) => {
    const next: Record<string, string> = {};
    if (f.title.trim()) next.title = f.title.trim();
    if (f.type) next.type = f.type;
    if (f.company.trim()) next.company = f.company.trim();
    setSearchParams(next);
  };

  return (
    <div className="home">
      <Hero initial={{ title, type, company }} onSearch={onSearch} />

      <div className="home-layout">
      <HotJobs />
      <div className="page page-home">
        <div className="page-header">
          <h2>Open roles</h2>
          <p className="page-subtitle">
            {location
              ? `Showing jobs in ${location}.`
              : "Current postings from employers on Trailhead."}
          </p>
        </div>

        {loading && <div className="page-loading">Loading jobs…</div>}
        {error && <div className="form-error">{error}</div>}
        {!loading && !error && jobs.length === 0 && (
          <div className="empty-state">
            No jobs match yet. Try clearing your filters.
          </div>
        )}

        <div className="job-grid">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
