import { useEffect, useRef, useState } from "react";
import client from "../api/client";

type RoleFilter = "all" | "employer" | "candidate";

interface AdminUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
}

const PAGE_SIZE = 20;

const TABS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "View all users" },
  { key: "employer", label: "View employers" },
  { key: "candidate", label: "View candidates" },
];

// 1 … 4 5 [6] 7 8 … 20
const pageWindow = (current: number, total: number): (number | "…")[] => {
  const pages = new Set<number>([1, total]);
  for (let p = current - 2; p <= current + 2; p++) if (p >= 1 && p <= total) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState<RoleFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value sent to the API
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, employer: 0, candidate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0); // ignore responses from outdated requests

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchUsers = async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/users", {
        params: { role, search: search || undefined, page, limit: PAGE_SIZE },
      });
      if (id !== requestId.current) return;
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
      setCounts(data.counts);
    } catch (err: any) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || "Couldn't load users.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, search, page]);

  const changeRole = (r: RoleFilter) => {
    setRole(r);
    setPage(1);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this user? This can't be undone.")) return;
    try {
      await client.delete(`/users/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't delete the user.");
      return;
    }
    if (users.length === 1 && page > 1) setPage(page - 1);
    else fetchUsers();
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Manage users</h1>
        <p className="page-subtitle">Browse, search, and remove candidates and employers.</p>
      </div>

      <div className="admin-filter">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn-ghost${role === t.key ? " is-selected" : ""}`}
            onClick={() => changeRole(t.key)}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      <input
        type="search"
        className="admin-search"
        placeholder="Search users by name…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        aria-label="Search users by name"
      />

      {error && <div className="form-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
        </thead>
        <tbody>
          {!loading && users.length === 0 && (
            <tr>
              <td colSpan={4}>
                <div className="empty-state">
                  {search ? `No users match “${search}”.` : "No users found."}
                </div>
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u._id || u.id} style={{ opacity: loading ? 0.5 : 1 }}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td><span className="role-tag">{u.role}</span></td>
              <td>
                {u.role !== "admin" && (
                  <button className="btn-ghost btn-danger" onClick={() => onDelete((u._id || u.id) as string)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && users.length === 0 && <div className="page-loading">Loading…</div>}

      {total > 0 && (
        <p className="page-subtitle admin-users-range">Showing {from}–{to} of {total}</p>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1 || loading}>← Previous</button>
          {pageWindow(page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`}>…</span>
            ) : (
              <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)} disabled={loading}>
                {p}
              </button>
            )
          )}
          <button onClick={() => setPage(page + 1)} disabled={page === pages || loading}>Next →</button>
        </div>
      )}
    </div>
  );
}