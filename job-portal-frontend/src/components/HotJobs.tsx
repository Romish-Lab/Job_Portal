import { CSSProperties, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Trophy } from "lucide-react";
import client from "../api/client";
import { Job } from "../types";
import { compactSalary } from "../utils/salary";

const ROTATE_MS = 4000; // change job every 4 seconds

const PALETTE = [
  "linear-gradient(135deg, #f2a516, #f7d36b)", // gold for #1
  "linear-gradient(135deg, #e0567a, #f79a5b)",
  "linear-gradient(135deg, #5b3b8a, #a37be0)",
  "linear-gradient(135deg, #146c5d, #3fb59a)",
  "linear-gradient(135deg, #3b4f7a, #6f8fd6)",
];
const MEDALS = ["🥇", "🥈", "🥉"];

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

  // Auto-advance; restarts whenever the job changes (including dot/arrow clicks)
  useEffect(() => {
    if (paused || jobs.length < 2) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % jobs.length), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, jobs.length]);

  if (jobs.length === 0) return null;

  const job = jobs[index];
  const salary = compactSalary(job.salaryMin, job.salaryMax);
  const go = (delta: number) => setIndex((i) => (i + delta + jobs.length) % jobs.length);

  return (
    <aside
      className="hot-jobs"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hot-head">
        <span className="hj-icon" aria-hidden="true">
          <Trophy size={18} />
        </span>
        <div>
          <h2>Highest paying jobs</h2>
          <small className="hj-sub">Top {jobs.length} by salary</small>
        </div>
      </div>

      {/* key remounts the card so the fade-in plays on every change */}
      <Link
        key={job._id}
        to={`/jobs/${job._id}`}
        className="hj-card"
        style={{ "--hj-bg": PALETTE[index % PALETTE.length] } as CSSProperties}
      >
        <span className="hj-rank" aria-hidden="true">
          {index + 1}
        </span>
        <span className="hj-pill">
          {MEDALS[index] ? `${MEDALS[index]} ` : `#${index + 1} · `}
          {job.type}
        </span>

        <h3 className="hj-title">{job.title}</h3>
        <p className="hj-company">{job.company}</p>

        {salary && (
          <div className="hj-salary">
            <small>Salary</small>
            {salary}
          </div>
        )}

        <div className="hj-foot">
          <span className="hj-where">
            <MapPin size={14} />
            <span>{job.location}</span>
          </span>
          <span className="hj-cta">
            View <ArrowRight size={14} />
          </span>
        </div>

        {/* countdown to the next job; hidden while hovering (rotation is paused) */}
        {!paused && jobs.length > 1 && (
          <span
            key={`bar-${index}`}
            className="hj-progress"
            style={{ animationDuration: `${ROTATE_MS}ms` }}
          />
        )}
      </Link>

      <div className="hot-nav">
        <button type="button" className="hj-arrow" aria-label="Previous job" onClick={() => go(-1)}>
          <ChevronLeft size={16} />
        </button>
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
        <button type="button" className="hj-arrow" aria-label="Next job" onClick={() => go(1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </aside>
  );
}