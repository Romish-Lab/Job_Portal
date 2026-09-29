import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { Job } from "../types";

const ROTATE_MS = 4000; // change job every 4 seconds

const salaryText = (job: Job) => {
  const short = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);
  if (job.salaryMin && job.salaryMax)
    return `$${short(job.salaryMin)}–${short(job.salaryMax)}`;
  const one = job.salaryMin || job.salaryMax;
  return one ? `$${short(one)}` : null;
};

export default function HotJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Load the 10 highest-paying jobs once
  useEffect(() => {
    client
      .get("/jobs", { params: { limit: 10, sort: "salary" } })
      .then(({ data }) => setJobs(data.jobs))
      .catch(() => setJobs([]));
  }, []);

  // Auto-advance; restarts whenever the job changes (including dot clicks)
  useEffect(() => {
    if (paused || jobs.length < 2) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % jobs.length),
      ROTATE_MS
    );
    return () => clearTimeout(timer);
  }, [index, paused, jobs.length]);

  if (jobs.length === 0) return null;

  const job = jobs[index];
  const salary = salaryText(job);

  return (
    <aside
      className="hot-jobs"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hot-head">
        <span aria-hidden="true">💰</span>
        <h2>Top paying jobs</h2>
      </div>

      {/* key remounts the card so the fade-in plays on every change */}
      <Link key={job._id} to={`/jobs/${job._id}`} className="hot-card">
        <span className="hot-type">
          #{index + 1} · {job.type}
        </span>
        <h3>{job.title}</h3>
        <p className="hot-company">{job.company}</p>
        <div className="hot-meta">
          <span>{job.location}</span>
          {salary && <span className="hot-salary">{salary}</span>}
        </div>
        <span className="hot-cta">View job →</span>
      </Link>

      <div className="hot-dots">
        {jobs.map((j, i) => (
          <button
            key={j._id}
            type="button"
            className={i === index ? "hot-dot active" : "hot-dot"}
            aria-label={`Show ${j.title}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </aside>
  );
}
