import { useEffect, useState } from "react";
import client from "../api/client";
import Pagination from "../components/Pagination";
import { formatDate } from "../utils/money";

interface Log {
  _id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetLabel?: string;
  details?: string;
  createdAt: string;
}

const ACTIONS: Record<string, string> = {
  "job.approve": "Approved job",
  "job.reject": "Rejected job",
  "user.suspend": "Suspended user",
  "user.unsuspend": "Reinstated user",
  "user.delete": "Deleted user",
  "message.delete": "Deleted message",
  "pricing.update": "Updated ad pricing",
};

const when = (iso: string) =>
  `${formatDate(iso)}, ${new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

export default function AdminAudit() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [action, setAction] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    client
      .get("/admin/audit-logs", { params: { action, search: search || undefined, page, limit: 20 } })
      .then(({ data }) => {
        setLogs(data.logs);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load the audit log."))
      .finally(() => setLoading(false));
  }, [action, search, page]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Audit log</h1>
        <p className="page-subtitle">{total} recorded admin action{total === 1 ? "" : "s"}.</p>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search admin, target or details…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="all">All actions</option>
          {Object.entries(ACTIONS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="page-loading">Loading…</div>}
      {!loading && logs.length === 0 && <div className="empty-state">Nothing logged yet.</div>}

      {!loading && logs.length > 0 && (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td>{when(l.createdAt)}</td>
                  <td>
                    {l.actorName}
                    <div className="job-row-meta">{l.actorEmail}</div>
                  </td>
                  <td><span className="role-tag">{ACTIONS[l.action] || l.action}</span></td>
                  <td>{l.targetLabel || "—"}</td>
                  <td className="audit-details">{l.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}
