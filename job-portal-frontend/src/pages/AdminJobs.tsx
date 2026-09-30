import { useEffect, useState } from "react";
import client from "../api/client";
import { formatDate, formatMoney } from "../utils/money";

type Tab = "pending" | "ads" | "pricing";

interface AdminJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
  employer: { name: string; email: string; company?: string } | null;
}

interface AdRow {
  _id: string;
  title: string;
  company: string;
  employer: { name: string; email: string } | null;
  adDuration: number;
  adStartDate: string;
  adExpiryDate: string;
  state: "active" | "expired";
  amount: number | null;
  currency: string | null;
}

interface AdSummary {
  paid: number;
  active: number;
  expired: number;
  revenue: Record<string, number>;
}

const salary = (j: AdminJob) =>
  j.salaryMin && j.salaryMax ? `${j.salaryMin.toLocaleString()} – ${j.salaryMax.toLocaleString()}` : (j.salaryMin || j.salaryMax)?.toLocaleString() || "Not specified";

/* ---------- Pending jobs ---------- */
function PendingJobs() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/admin/jobs", { params: { approvalStatus: "pending" } });
      setJobs(data.jobs);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't load pending jobs.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (job: AdminJob, action: "approve" | "reject") => {
    let body = {};
    if (action === "reject") {
      const reason = window.prompt("Reason for rejection (shown to the employer, optional):");
      if (reason === null) return; // cancelled
      body = { reason };
    }
    setBusyId(job._id);
    setError("");
    setOk("");
    try {
      await client.patch(`/admin/jobs/${job._id}/${action}`, body);
      setOk(`“${job.title}” ${action === "approve" ? "approved" : "rejected"}.`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || `Couldn't ${action} the job.`);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <>
      {ok && <div className="form-success">{ok}</div>}
      {error && <div className="form-error">{error}</div>}
      {jobs.length === 0 && <div className="empty-state">No jobs are waiting for approval.</div>}

      <div className="my-jobs-list">
        {jobs.map((job) => (
          <div className="admin-job" key={job._id}>
            <div className="admin-job-head">
              <div>
                <h3>{job.title}</h3>
                <p className="job-row-meta">
                  {job.company} · {job.location} · {job.type} · Salary: {salary(job)}
                </p>
                <p className="job-row-meta">
                  Employer: {job.employer?.name || "Unknown"} {job.employer?.email && `(${job.employer.email})`} · Created{" "}
                  {formatDate(job.createdAt)}
                </p>
              </div>
              <div className="my-job-actions">
                <button className="btn-ghost" onClick={() => setOpen(open === job._id ? null : job._id)}>
                  {open === job._id ? "Hide" : "View"}
                </button>
                <button className="btn-primary-sm" disabled={busyId === job._id} onClick={() => act(job, "approve")}>
                  Approve
                </button>
                <button className="btn-ghost btn-danger" disabled={busyId === job._id} onClick={() => act(job, "reject")}>
                  Reject
                </button>
              </div>
            </div>
            {open === job._id && (
              <div className="admin-job-body">
                <h4>Description</h4>
                <p className="admin-job-desc">{job.description}</p>
                {job.requirements.length > 0 && (
                  <>
                    <h4>Requirements</h4>
                    <ul>
                      {job.requirements.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Advertisements ---------- */
function Advertisements() {
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [rows, setRows] = useState<AdRow[]>([]);
  const [summary, setSummary] = useState<AdSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    client
      .get("/admin/advertisements", { params: { filter } })
      .then(({ data }) => {
        setRows(data.advertisements);
        setSummary(data.summary);
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load advertisements."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <>
      {error && <div className="form-error">{error}</div>}
      {summary && (
        <div className="admin-stats">
          <div className="dashboard-stat"><span>Paid ads</span><strong>{summary.paid}</strong></div>
          <div className="dashboard-stat"><span>Active</span><strong>{summary.active}</strong></div>
          <div className="dashboard-stat"><span>Expired</span><strong>{summary.expired}</strong></div>
          <div className="dashboard-stat">
            <span>Revenue</span>
            <strong>
              {Object.keys(summary.revenue).length === 0
                ? "—"
                : Object.entries(summary.revenue).map(([cur, amt]) => formatMoney(amt, cur)).join(", ")}
            </strong>
          </div>
        </div>
      )}

      <div className="admin-filter">
        {(["all", "active", "expired"] as const).map((f) => (
          <button key={f} className={`btn-ghost${filter === f ? " is-selected" : ""}`} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">No advertisements to show.</div>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th><th>Employer</th><th>Duration</th><th>Amount paid</th><th>Start</th><th>Expiry</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{r.title}<br /><small>{r.company}</small></td>
                  <td>{r.employer?.name || "—"}</td>
                  <td>{r.adDuration} days</td>
                  <td>{r.amount != null && r.currency ? formatMoney(r.amount, r.currency) : "—"}</td>
                  <td>{formatDate(r.adStartDate)}</td>
                  <td>{formatDate(r.adExpiryDate)}</td>
                  <td>
                    <span className={`status-badge ad-badge ad-${r.state}`}>{r.state === "active" ? "Active" : "Expired"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------- Pricing ---------- */
interface Row { days: string; price: string } // strings so inputs can be edited freely; price in major units

function Pricing() {
  const [rows, setRows] = useState<Row[]>([]);
  const [currency, setCurrency] = useState("usd");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    client
      .get("/admin/ad-pricing")
      .then(({ data }) => {
        setCurrency(data.currency);
        setRows(data.tiers.map((t: { days: number; price: number }) => ({ days: String(t.days), price: (t.price / 100).toFixed(2) })));
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load pricing."))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, field: keyof Row, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const save = async () => {
    setError("");
    setOk("");
    setBusy(true);
    try {
      const tiers = rows.map((r) => ({ days: Number(r.days), price: Math.round(Number(r.price) * 100) }));
      const { data } = await client.put("/admin/ad-pricing", { currency, tiers });
      setRows(data.tiers.map((t: { days: number; price: number }) => ({ days: String(t.days), price: (t.price / 100).toFixed(2) })));
      setOk("Pricing saved. It applies to new payments immediately.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't save pricing.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="stacked-form pricing-form">
      {ok && <div className="form-success">{ok}</div>}
      {error && <div className="form-error">{error}</div>}

      <label>
        Currency (3-letter code)
        <input value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value)} />
      </label>

      {rows.map((r, i) => (
        <div className="pricing-row" key={i}>
          <label>
            Days
            <input type="number" min={1} max={365} value={r.days} onChange={(e) => update(i, "days", e.target.value)} />
          </label>
          <label>
            Price ({currency.toUpperCase()})
            <input type="number" min={0.5} step="0.01" value={r.price} onChange={(e) => update(i, "price", e.target.value)} />
          </label>
          <button type="button" className="btn-ghost btn-danger" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}

      <div className="my-job-actions">
        <button type="button" className="btn-ghost" onClick={() => setRows((rs) => [...rs, { days: "", price: "" }])}>
          + Add duration
        </button>
        <button type="button" className="btn-primary" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save pricing"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function AdminJobs() {
  const [tab, setTab] = useState<Tab>("pending");
  const tabs: [Tab, string][] = [
    ["pending", "Pending jobs"],
    ["ads", "Advertisements"],
    ["pricing", "Ad pricing"],
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Job management</h1>
        <p className="page-subtitle">Approve new postings, monitor paid advertisements and set prices.</p>
      </div>

      <div className="admin-tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={`admin-tab${tab === key ? " is-active" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "pending" && <PendingJobs />}
      {tab === "ads" && <Advertisements />}
      {tab === "pricing" && <Pricing />}
    </div>
  );
}
