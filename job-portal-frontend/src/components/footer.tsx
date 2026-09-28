import { Link } from "react-router-dom";

const JOB_TYPES = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
  { label: "Remote", value: "remote" },
];

const LOCATIONS = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Remote"];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-browse">
        <div className="footer-col">
          <h3>Browse by type</h3>
          <ul>
            {JOB_TYPES.map((t) => (
              <li key={t.value}>
                <Link to={`/?type=${t.value}`}>{t.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3>Browse by location</h3>
          <ul>
            {LOCATIONS.map((loc) => (
              <li key={loc}>
                <Link to={`/?location=${encodeURIComponent(loc)}`}>{loc}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3>For job seekers</h3>
          <ul>
            <li>
              <Link to="/register">Create a free account</Link>
            </li>
            <li>
              <Link to="/">Browse open roles</Link>
            </li>
            <li>
              <Link to="/my-applications">Track your applications</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>For employers</h3>
          <ul>
            <li>
              <Link to="/register">Create a free account</Link>
            </li>
            <li>
              <Link to="/post-job">Post a job</Link>
            </li>
            <li>
              <Link to="/my-jobs">Manage your postings</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-brand">
          <span className="brand footer-brand-name">
            Trailhead <span>Jobs</span>
          </span>
        </div>
        <p className="footer-copyright">
          © {year} Trailhead Jobs. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
