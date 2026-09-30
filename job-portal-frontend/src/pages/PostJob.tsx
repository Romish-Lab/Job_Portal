import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { JobType } from "../types";

export default function PostJob() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [type, setType] = useState<JobType>("full-time");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      if (salaryMin) formData.append("salaryMin", salaryMin);
      if (salaryMax) formData.append("salaryMax", salaryMax);
      formData.append("type", type);
      if (logo) formData.append("logo", logo);

      await client.post("/jobs", formData);
      navigate("/my-jobs", {
        state: { message: "Job submitted. Waiting for admin approval." },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't create the job posting.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Post a job</h1>
        <p className="page-subtitle">Fill in the details candidates will see.</p>
      </div>

      <form className="stacked-form" onSubmit={onSubmit}>
        {error && <div className="form-error">{error}</div>}

        <label>
          Company logo (optional, PNG/JPG/WEBP, max 2 MB)
          <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={onLogoChange} />
        </label>
        {preview && <img className="logo-preview" src={preview} alt="Logo preview" />}

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

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Posting…" : "Post job"}
        </button>
      </form>
    </div>
  );
}