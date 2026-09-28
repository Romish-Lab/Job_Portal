import { FormEvent, ReactNode, useEffect, useState } from "react";

export interface SearchFilters {
  title: string;
  type: string;
  company: string;
}

const CATEGORIES = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
  { label: "Remote", value: "remote" },
];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function Hero({
  initial,
  onSearch,
}: {
  initial: SearchFilters;
  onSearch: (f: SearchFilters) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [type, setType] = useState(initial.type);
  const [company, setCompany] = useState(initial.company);

  // keep the bar in sync when the URL changes (e.g. footer "browse by" links)
  useEffect(() => {
    setTitle(initial.title);
    setType(initial.type);
    setCompany(initial.company);
  }, [initial.title, initial.type, initial.company]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch({ title, type, company });
  };

  return (
    <section className="landing-hero">
      <div className="hero-shapes" aria-hidden="true">
        <span className="shape shape-ring" />
        <span className="shape shape-circle" />
        <span className="shape shape-square" />
        <span className="shape shape-triangle" />
        <span className="shape shape-dots" />
        <span className="shape shape-diamond" />
      </div>

      <div className="landing-hero-inner">
        <p className="hero-eyebrow">Your next career move starts here</p>
        <h1>
          Find jobs, vacancy, career{" "}
          <span className="hero-accent">online.</span>
        </h1>
        <p className="hero-sub">
          Search open roles from employers, apply in a few clicks, and track
          every application in one place.
        </p>
      </div>

      <div className="hero-search-wrap">
        <form className="search-bar" onSubmit={submit} role="search">
          <label className="search-field">
            <Icon>
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
            </Icon>
            <input
              aria-label="Job title"
              placeholder="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="search-field">
            <Icon>
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </Icon>
            <select
              aria-label="Job category"
              className={type ? "" : "is-placeholder"}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Job Category</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="search-field">
            <Icon>
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-4h4v4" />
            </Icon>
            <input
              aria-label="Company"
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>

          <button className="search-btn" type="submit">
            <Icon>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </Icon>
            <span>Search</span>
          </button>
        </form>
      </div>
    </section>
  );
}
