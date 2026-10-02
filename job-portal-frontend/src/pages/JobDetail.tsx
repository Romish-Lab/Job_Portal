import { FormEvent, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Job } from "../types";
import { useAuth } from "../context/AuthContext";
import client, { assetUrl } from "../api/client";

interface ApplyForm {
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  portfolioUrl: string;
  highestEducation: string;
  university: string;
  yearsOfExperience: string;
  currentLocation: string;
  expectedSalary: string;
  availability: string;
  workPreference: "" | "remote" | "on-site" | "hybrid";
  skills: string;
  additionalInfo: string;
}

const emptyForm: ApplyForm = {
  fullName: "",
  email: "",
  phone: "",
  coverLetter: "",
  portfolioUrl: "",
  highestEducation: "",
  university: "",
  yearsOfExperience: "",
  currentLocation: "",
  expectedSalary: "",
  availability: "",
  workPreference: "",
  skills: "",
  additionalInfo: "",
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ApplyForm>(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get(`/jobs/${id}`).then(({ data }) => setJob(data.job)).finally(() => setLoading(false));
  }, [id]);

  // Pre-fill name/email once the user loads, without overwriting anything already typed
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      fullName: f.fullName || user.name,
      email: f.email || user.email,
    }));
  }, [user]);

  const setField = (field: keyof ApplyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onApply = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!resume) {
      setError("Please attach your resume (PDF, DOC, or DOCX).");
      return;
    }
    const required: [keyof ApplyForm, string][] = [
      ["fullName", "Full name"],
      ["email", "Email"],
      ["phone", "Phone number"],
      ["coverLetter", "Cover letter"],
      ["highestEducation", "Highest education"],
      ["yearsOfExperience", "Years of experience"],
      ["currentLocation", "Current location"],
      ["skills", "Relevant skills"],
    ];
    const missing = required.find(([key]) => !form[key].trim());
    if (missing) {
      setError(`${missing[1]} is required.`);
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    setApplying(true);
    try {
      await client.post(`/applications/${id}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Application submitted! You can track its status from My applications and you'll receive an email confirmation if your application is accepted.");
      setForm(emptyForm);
      setResume(null);
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't submit your application.");
    } finally {
      setApplying(false);
    }
  };

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

      <section className="job-detail-section apply-section">
        <h2>Apply</h2>

        {!user && (
          <p className="empty-state">
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
              Log in
            </a>{" "}
            as a candidate to apply for this role.
          </p>
        )}

        {user?.role === "employer" && (
          <p className="empty-state">Employers can't apply to job postings.</p>
        )}

        {user?.role === "candidate" && (
          <>
            {message && <div className="form-success">{message}</div>}

            {!showForm && !message && (
              <button
                className="btn-primary"
                type="button"
                onClick={() => setShowForm(true)}
              >
                Apply now
              </button>
            )}

            {showForm && (
              <form className="apply-form" onSubmit={onApply}>
                {error && <div className="form-error">{error}</div>}

                <div className="apply-form-grid">
                  <label>
                    Full name *
                    <input type="text" value={form.fullName} onChange={setField("fullName")} required />
                  </label>

                  <label>
                    Email *
                    <input type="email" value={form.email} onChange={setField("email")} required />
                  </label>

                  <label>
                    Phone number *
                    <input type="tel" value={form.phone} onChange={setField("phone")} required />
                  </label>

                  <label>
                    Current location *
                    <input
                      type="text"
                      value={form.currentLocation}
                      onChange={setField("currentLocation")}
                      placeholder="City, Country"
                      required
                    />
                  </label>

                  <label>
                    Highest education *
                    <input
                      type="text"
                      value={form.highestEducation}
                      onChange={setField("highestEducation")}
                      placeholder="e.g. Bachelor's in Computer Science"
                      required
                    />
                  </label>

                  <label>
                    University / College
                    <input type="text" value={form.university} onChange={setField("university")} />
                  </label>

                  <label>
                    Years of experience *
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={form.yearsOfExperience}
                      onChange={setField("yearsOfExperience")}
                      required
                    />
                  </label>

                  <label>
                    Expected salary
                    <input
                      type="number"
                      min={0}
                      value={form.expectedSalary}
                      onChange={setField("expectedSalary")}
                      placeholder="Annual, in your currency"
                    />
                  </label>

                  <label>
                    Availability / notice period
                    <input
                      type="text"
                      value={form.availability}
                      onChange={setField("availability")}
                      placeholder="e.g. Immediate, 2 weeks"
                    />
                  </label>

                  <label>
                    Work preference
                    <select value={form.workPreference} onChange={setField("workPreference")}>
                      <option value="">No preference</option>
                      <option value="remote">Remote</option>
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </label>

                  <label>
                    Portfolio / LinkedIn URL
                    <input
                      type="url"
                      value={form.portfolioUrl}
                      onChange={setField("portfolioUrl")}
                      placeholder="https://…"
                    />
                  </label>

                  <label>
                    Relevant skills *
                    <input
                      type="text"
                      value={form.skills}
                      onChange={setField("skills")}
                      placeholder="Comma-separated, e.g. React, Node.js, SQL"
                      required
                    />
                  </label>
                </div>

                <label>
                  Resume (PDF, DOC, or DOCX) *
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResume(e.target.files?.[0] || null)}
                    required
                  />
                </label>

                <label>
                  Cover letter *
                  <textarea
                    rows={4}
                    value={form.coverLetter}
                    onChange={setField("coverLetter")}
                    placeholder="Why you're a fit for this role…"
                    required
                  />
                </label>

                <label>
                  Additional information
                  <textarea
                    rows={3}
                    value={form.additionalInfo}
                    onChange={setField("additionalInfo")}
                    placeholder="Anything else you'd like the employer to know…"
                  />
                </label>

                <button className="btn-primary" type="submit" disabled={applying}>
                  {applying ? "Submitting…" : "Submit application"}
                </button>
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={applying}
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}