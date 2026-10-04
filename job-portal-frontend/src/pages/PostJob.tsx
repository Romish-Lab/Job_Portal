import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client, { assetUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ExperienceLevel, Job, JobType, WorkMode } from "../types";

// Mirrors the server rule: a live, paid ad can't be edited
const isLive = (job: Job) =>
  job.approvalStatus === "approved" &&
  job.paymentStatus === "paid" &&
  job.isActive &&
  !!job.adExpiryDate &&
  new Date(job.adExpiryDate).getTime() > Date.now();

// Used for both "Post a job" (/post-job) and "Edit job" (/jobs/:id/edit)
export default function PostJob() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [type, setType] = useState<JobType>("full-time");
  const [workMode, setWorkMode] = useState<WorkMode | "">("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [educationRequirement, setEducationRequirement] = useState("");
  const [benefits, setBenefits] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [existing, setExisting] = useState<Job | null>(null);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Edit mode: load the job and prefill the form
  useEffect(() => {
    if (!id) return;
    client
      .get(`/jobs/${id}`)
      .then(({ data }) => {
        const j: Job = data.job;
        const ownerId = typeof j.employer === "object" ? j.employer._id : j.employer;
        if (user && ownerId !== user.id) {
          setLoadError("You can only edit your own job postings.");
          return;
        }
        setExisting(j);
        setTitle(j.title);
        setDescription(j.description);
        setRequirements((j.requirements || []).join(", "));
        setCompany(j.company);
        setLocation(j.location);
        setSalaryMin(j.salaryMin != null ? String(j.salaryMin) : "");
        setSalaryMax(j.salaryMax != null ? String(j.salaryMax) : "");
        setType(j.type);
        setWorkMode(j.workMode || "");
        setExperienceLevel(j.experienceLevel || "");
        setEducationRequirement(j.educationRequirement || "");
        setBenefits((j.benefits || []).join(", "));
      })
      .catch((err) => setLoadError(err.response?.data?.message || "Couldn't load this job."))
      .finally(() => setLoading(false));
  }, [id, user]);

  const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogo(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("requirements", requirements); // comma-separated, backend splits it
      formData.append("company", company);
      formData.append("location", location);
      // When editing, an empty salary is sent too so it can be removed
      if (editing || salaryMin) formData.append("salaryMin", salaryMin);
      if (editing || salaryMax) formData.append("salaryMax", salaryMax);
      formData.append("type", type);
      formData.append("workMode", workMode);
      formData.append("experienceLevel", experienceLevel);
      formData.append("educationRequirement", educationRequirement);
      formData.append("benefits", benefits);
      if (logo) formData.append("logo", logo);

      if (!editing) {
        await client.post("/jobs", formData);
        navigate("/my-jobs", { state: { message: "Job submitted. Waiting for admin approval." } });
        return;
      }

      const { data } = await client.put(`/jobs/${id}`, formData);
      const wasApproved = existing?.approvalStatus === "approved" || existing?.approvalStatus === "expired";
      if (!data.resubmitted && wasApproved) {
        // Nothing changed on an approved job: go straight to renewing / paying
        navigate(`/jobs/${id}/advertise`);
      } else {
        navigate("/my-jobs", { state: { message: data.message } });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Couldn't ${editing ? "update" : "create"} the job posting.`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  if (loadError) {
    return (
      <div className="page page-narrow">
        <div className="form-error">{loadError}</div>
        <Link to="/my-jobs">← Back to my postings</Link>
      </div>
    );
  }

  if (existing && isLive(existing)) {
    return (
      <div className="page page-narrow">
        <div className="page-header">
          <h1>Edit job</h1>
        </div>
        <div className="ad-note">
          This job has a live advertisement and can't be edited until it ends. Contact an admin if it needs urgent changes.
        </div>
        <p>
          <Link to="/my-jobs">← Back to my postings</Link>
        </p>
      </div>
    );
  }

  const approvedContent = existing?.approvalStatus === "approved" || existing?.approvalStatus === "expired";
  const shownLogo = preview || (existing?.logoUrl ? assetUrl(existing.logoUrl) : "");

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>{editing ? "Edit job" : "Post a job"}</h1>
        <p className="page-subtitle">
          {editing ? "Update the details candidates will see." : "Fill in the details candidates will see."}
        </p>
      </div>

      {editing && approvedContent && (
        <div className="ad-note">
          Changes to an approved job are reviewed again before it can be advertised.{" "}
          <Link to={`/jobs/${id}/advertise`}>Advertise without changes</Link>
        </div>
      )}
      {editing && existing?.approvalStatus === "rejected" && (
        <div className="ad-note ad-note--danger">
          Rejected{existing.rejectionReason ? `: ${existing.rejectionReason}` : ""}. Saving sends it back for review.
        </div>
      )}

      <form className="stacked-form" onSubmit={onSubmit}>
        {error && <div className="form-error">{error}</div>}

        <label>
          Company logo ({editing ? "leave empty to keep the current one; " : "optional, "}PNG/JPG/WEBP, max 2 MB)
          <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={onLogoChange} />
        </label>
        {shownLogo && <img className="logo-preview" src={shownLogo} alt="Logo preview" />}

        <label>
          Title
          <input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label>
          Description
          <textarea rows={5} required value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label>
          Requirements (comma-separated)
          <input
            placeholder="React, TypeScript, REST APIs"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </label>

        <div className="form-row">
          <label>
            Company
            <input required value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <label>
            Location
            <input required value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Salary min
            <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
          </label>
          <label>
            Salary max
            <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
          </label>
        </div>

        <label>
          Job type
          <select value={type} onChange={(e) => setType(e.target.value as JobType)}>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
        </label>

        <div className="form-row">
          <label>
            Work arrangement
            <select value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode | "")}>
              <option value="">Not specified</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </label>
          <label>
            Experience level
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel | "")}
            >
              <option value="">Not specified</option>
              <option value="entry-level">Entry level</option>
              <option value="mid-level">Mid level</option>
              <option value="senior-level">Senior level</option>
              <option value="lead">Lead</option>
            </select>
          </label>
        </div>

        <label>
          Education requirement
          <input
            placeholder="e.g. Bachelor's degree or equivalent experience"
            value={educationRequirement}
            onChange={(e) => setEducationRequirement(e.target.value)}
          />
        </label>

        <label>
          Benefits (comma-separated)
          <textarea
            rows={3}
            placeholder="Health insurance, paid leave, professional development"
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
          />
        </label>

        <div className="my-job-actions">
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? (editing ? "Saving…" : "Posting…") : editing ? "Save changes" : "Post job"}
          </button>
          {editing && (
            <Link className="btn-ghost" to="/my-jobs">
              Cancel
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
