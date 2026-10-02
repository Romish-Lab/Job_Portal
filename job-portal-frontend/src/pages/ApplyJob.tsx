import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Gender, Job, WorkPreference } from "../types";
import { useAuth } from "../context/AuthContext";
import client, { assetUrl } from "../api/client";

interface ApplyForm {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "" | Gender;
  nationality: string;
  address: string;
  currentLocation: string;
  highestEducation: string;
  university: string;
  yearsOfExperience: string;
  skills: string;
  expectedSalary: string;
  availability: string;
  workPreference: "" | WorkPreference;
  portfolioUrl: string;
  coverLetter: string;
  additionalInfo: string;
}

const emptyForm: ApplyForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  address: "",
  currentLocation: "",
  highestEducation: "",
  university: "",
  yearsOfExperience: "",
  skills: "",
  expectedSalary: "",
  availability: "",
  workPreference: "",
  portfolioUrl: "",
  coverLetter: "",
  additionalInfo: "",
};

// [field, label] pairs that must be filled in before submitting
const REQUIRED_FIELDS: [keyof ApplyForm, string][] = [
  ["fullName", "Full name"],
  ["email", "Email"],
  ["phone", "Phone number"],
  ["dateOfBirth", "Date of birth"],
  ["gender", "Gender"],
  ["nationality", "Nationality"],
  ["address", "Address"],
  ["currentLocation", "Current location"],
  ["highestEducation", "Highest education"],
  ["yearsOfExperience", "Years of experience"],
  ["skills", "Relevant skills"],
  ["expectedSalary", "Expected salary"],
  ["availability", "Availability / notice period"],
  ["workPreference", "Work preference"],
  ["coverLetter", "Cover letter"],
];

const MIN_AGE = 16;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ApplyForm>(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get(`/jobs/${id}`)
      .then(({ data }) => setJob(data.job))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
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

  // Local preview of the chosen photo (revoked when it changes / on unmount)
  const photoPreview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo]
  );
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // Youngest allowed date of birth, formatted for <input type="date" max>
  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - MIN_AGE);
    return d.toISOString().split("T")[0];
  }, []);

  const setField =
    (field: keyof ApplyForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError("");
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!PHOTO_TYPES.includes(file.type)) {
      setError("Photo must be a PNG, JPG, or WEBP image.");
      e.target.value = "";
      setPhoto(null);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo must be 2MB or smaller.");
      e.target.value = "";
      setPhoto(null);
      return;
    }
    setPhoto(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!photo) {
      setError("Please upload a profile photo (PNG, JPG, or WEBP).");
      return;
    }
    if (!resume) {
      setError("Please attach your resume (PDF, DOC, or DOCX).");
      return;
    }
    const missing = REQUIRED_FIELDS.find(([key]) => !form[key].trim());
    if (missing) {
      setError(`${missing[1]} is required.`);
      return;
    }
    if (form.dateOfBirth > maxDob) {
      setError(`You must be at least ${MIN_AGE} years old to apply.`);
      return;
    }
    if (!declaration) {
      setError("Please confirm that the information you provided is correct.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("photo", photo);
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    formData.append("declarationAccepted", "true");

    setSubmitting(true);
    try {
      await client.post(`/applications/${id}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/my-applications", {
        replace: true,
        state: {
          flash: `Your application for ${job?.title ?? "this role"} was submitted. You'll get an email if it's accepted.`,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't submit your application.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!job) return <div className="page empty-state">Job not found.</div>;

  return (
    <div className="page page-narrow">
      <Link className="back-link" to={`/jobs/${job._id}`}>
        ← Back to job details
      </Link>

      <div className="apply-job-header">
        {job.logoUrl ? (
          <img
            className="job-detail-logo"
            src={assetUrl(job.logoUrl)}
            alt={`${job.company} logo`}
          />
        ) : (
          <div className="job-detail-logo job-detail-logo-fallback">
            {job.company?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            You're applying for
          </p>
          <h1 style={{ margin: "2px 0" }}>{job.title}</h1>
          <p className="job-row-meta">
            {job.company} · {job.location} ·{" "}
            <span className="job-type">{job.type}</span>
          </p>
        </div>
      </div>

      <form className="apply-form" onSubmit={onSubmit}>
        {error && <div className="form-error">{error}</div>}
        <p className="form-hint">Fields marked * are required.</p>

        {/* ---------------- Personal details ---------------- */}
        <fieldset className="form-section">
          <legend>Personal details</legend>

          <div className="photo-upload">
            {photoPreview ? (
              <img className="photo-preview" src={photoPreview} alt="Your photo preview" />
            ) : (
              <div className="photo-preview photo-preview-empty">No photo</div>
            )}
            <label>
              Profile photo *
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={onPhotoChange}
              />
              <span className="form-hint">
                A clear, recent headshot. PNG, JPG or WEBP, up to 2MB.
              </span>
            </label>
          </div>

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
              Date of birth *
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={setField("dateOfBirth")}
                min="1900-01-01"
                max={maxDob}
                required
              />
            </label>

            <label>
              Gender *
              <select value={form.gender} onChange={setField("gender")} required>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </label>

            <label>
              Nationality *
              <input type="text" value={form.nationality} onChange={setField("nationality")} required />
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
              Full address *
              <input
                type="text"
                value={form.address}
                onChange={setField("address")}
                placeholder="Street, area, city"
                required
              />
            </label>
          </div>
        </fieldset>

        {/* ---------------- Education & experience ---------------- */}
        <fieldset className="form-section">
          <legend>Education &amp; experience</legend>

          <div className="apply-form-grid">
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
            Portfolio / LinkedIn URL
            <input
              type="url"
              value={form.portfolioUrl}
              onChange={setField("portfolioUrl")}
              placeholder="https://…"
            />
          </label>
        </fieldset>

        {/* ---------------- Job preferences ---------------- */}
        <fieldset className="form-section">
          <legend>Job preferences</legend>

          <div className="apply-form-grid">
            <label>
              Expected salary *
              <input
                type="number"
                min={0}
                value={form.expectedSalary}
                onChange={setField("expectedSalary")}
                placeholder="Annual, in your currency"
                required
              />
            </label>

            <label>
              Availability / notice period *
              <input
                type="text"
                value={form.availability}
                onChange={setField("availability")}
                placeholder="e.g. Immediate, 2 weeks"
                required
              />
            </label>

            <label>
              Work preference *
              <select value={form.workPreference} onChange={setField("workPreference")} required>
                <option value="">Select…</option>
                <option value="remote">Remote</option>
                <option value="on-site">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* ---------------- Documents & cover letter ---------------- */}
        <fieldset className="form-section">
          <legend>Resume &amp; cover letter</legend>

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
              rows={5}
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
        </fieldset>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
          />
          <span>
            I confirm that the information provided is true and correct to the
            best of my knowledge. *
          </span>
        </label>

        <div className="apply-actions">
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit application"}
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => navigate(`/jobs/${job._id}`)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
