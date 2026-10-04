import { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, MapPin, Sparkles } from "lucide-react";
import { Job } from "../types";
import { assetUrl } from "../api/client";
import BookmarkButton from "./BookmarkButton";
import { compactSalary } from "../utils/salary";

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

// "today", "3d ago", "2w ago", "1mo ago" (short enough for the pill)
const postedAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const typeLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1); // full-time -> Full-time

const NEW_FOR_DAYS = 3;
const isNew = (iso?: string) =>
  !!iso && Date.now() - new Date(iso).getTime() < NEW_FOR_DAYS * 24 * 60 * 60 * 1000;

export default function JobCard({ job }: { job: Job }) {
  const initial = job.company?.charAt(0).toUpperCase() || "?";
  const salary = compactSalary(job.salaryMin, job.salaryMax);
  const skills = (job.requirements || []).map((r) => r.trim()).filter(Boolean);
  const shownSkills = skills.slice(0, 3);
  const moreSkills = skills.length - shownSkills.length;
  const fresh = isNew(job.createdAt);

  return (
    // The wrapper holds the link AND the bookmark button (a button can't live inside a link)
    <div
      className="jc-wrap"
      style={{ "--jc-bg": pickGradient(job.company || job.title) } as CSSProperties}
    >
      <Link to={`/jobs/${job._id}`} className="jc">
        <div className="jc-cover">
          <div className="jc-pills">
            <span className="jc-type">{typeLabel(job.type)}</span>
            {fresh ? (
              <span className="jc-badge jc-badge-new">
                <Sparkles size={12} /> New
              </span>
            ) : (
              job.createdAt && (
                <span className="jc-badge">
                  <Clock size={12} /> {postedAgo(job.createdAt)}
                </span>
              )
            )}
          </div>
          <span className="jc-go" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </div>

        <div className="jc-logo">
          {job.logoUrl ? (
            <img src={assetUrl(job.logoUrl)} alt={`${job.company} logo`} />
          ) : (
            <span className="jc-initial">{initial}</span>
          )}
        </div>

        <div className="jc-body">
          <div className="jc-main">
            <h3 className="jc-title">{job.title}</h3>
            <p className="jc-company">{job.company}</p>

            {job.description && <p className="jc-desc">{job.description}</p>}

            {shownSkills.length > 0 && (
              <ul className="jc-tags">
                {shownSkills.map((s) => (
                  <li key={s} className="jc-tag">
                    {s}
                  </li>
                ))}
                {moreSkills > 0 && <li className="jc-tag jc-tag-more">+{moreSkills}</li>}
              </ul>
            )}
          </div>

          <div className="jc-foot">
            <span className="jc-where">
              <MapPin size={14} />
              <span>{job.location}</span>
            </span>
            {salary && <span className="jc-salary">{salary}</span>}
          </div>
        </div>
      </Link>

      <BookmarkButton jobId={job._id} className="jc-bookmark" />
    </div>
  );
}