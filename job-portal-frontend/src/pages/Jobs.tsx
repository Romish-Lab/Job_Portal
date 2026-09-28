import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import client from "../api/client";
import { Job } from "../types";
import JobCard from "../components/JobCard";

export default function Jobs() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = async (overrides?: {
    search?: string;
    location?: string;
    type?: string;
  }) => {
    setLoading(true);
    setError("");
    try {
      const s = overrides?.search ?? search;
      const l = overrides?.location ?? location;
      const t = overrides?.type ?? type;

      const params: Record<string, string> = {};
      if (s) params.search = s;
      if (l) params.location = l;
      if (t) params.type = t;

      const { data } = await client.get("/jobs", { params });
      setJobs(data.jobs);
    } catch {
      setError("Couldn't load jobs. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setLocation(searchParams.get("location") || "");
    setType(searchParams.get("type") || "");
    fetchJobs({
      search: searchParams.get("search") || "",
      location: searchParams.get("location") || "",
      type: searchParams.get("type") || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const onSubmitFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="home">
    <div className="page">
      <div className="page-header">
        <h1>Open roles</h1>
        <p className="page-subtitle">
          Browse current postings from employers on Trailhead.
        </p>
      </div>

      <form className="filter-bar" onSubmit={onSubmitFilters}>
        <input
          placeholder="Search title or company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Any type</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
          <option value="remote">Remote</option>
        </select>
        <button className="btn-primary-sm" type="submit">
          Filter
        </button>
      </form>

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
  );
}
