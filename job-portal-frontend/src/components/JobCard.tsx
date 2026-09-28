import { Link } from "react-router-dom";
import { Job } from "../types";
import { assetUrl } from "../api/client";

const GRADIENTS = [
  "linear-gradient(135deg, #146c5d, #3fb59a)",
  "linear-gradient(135deg, #b8862e, #f2c46d)",
  "linear-gradient(135deg, #3b4f7a, #6f8fd6)",
  "linear-gradient(135deg, #8a3b5a, #e0678f)",
  "linear-gradient(135deg, #4a7a3b, #9ccf6a)",
  "linear-gradient(135deg, #5b3b8a, #a37be0)",
];

function pickGradient(name: string) {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  const short = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
  if (job.salaryMin && job.salaryMax)
    return `$${short(job.salaryMin)}–${short(job.salaryMax)}`;
  return `$${short(job.salaryMin || job.salaryMax || 0)}`;
}

export default function JobCard({ job }: { job: Job }) {
  const initial = job.company?.charAt(0).toUpperCase() || "?";
  const salary = formatSalary(job);

  return (
    <Link to={`/jobs/${job._id}`} className="job-tile">
      <div
        className="tile-media"
        style={{ background: pickGradient(job.company || job.title) }}
      >
        {job.logoUrl ? (
          <img
            className="tile-logo"
            src={assetUrl(job.logoUrl)}
            alt={`${job.company} logo`}
          />
        ) : (
          <span className="tile-initial">{initial}</span>
        )}
        <span className="tile-type">{job.type}</span>
      </div>

      <div className="tile-body">
        <h3>{job.title}</h3>
        <p className="tile-company">{job.company}</p>
        <div className="tile-foot">
          <span className="tile-location">{job.location}</span>
          {salary && <span className="tile-salary">{salary}</span>}
        </div>
      </div>
    </Link>
  );
}
