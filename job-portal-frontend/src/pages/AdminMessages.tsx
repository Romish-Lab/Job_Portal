import { useEffect, useState } from "react";
import client from "../api/client";
import { formatDate } from "../utils/money";

type Filter = "all" | "unread" | "read";

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const formatDateTime = (iso: string) =>
  `${formatDate(iso)}, ${new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState({ unread: 0, total: 0 });
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async (f: Filter = filter) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/admin/messages", {
        params: { filter: f },
      });
      setMessages(data.messages);
      setCounts({ unread: data.unread, total: data.total });
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    setOpen(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setRead = async (m: ContactMessage, isRead: boolean) => {
    setBusyId(m._id);
    setError("");
    try {
      await client.patch(`/admin/messages/${m._id}/read`, { isRead });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't update the message.");
    } finally {
      setBusyId(null);
    }
  };

  // Opening a message marks it as read
  const toggle = (m: ContactMessage) => {
    const opening = open !== m._id;
    setOpen(opening ? m._id : null);
    if (opening && !m.isRead) setRead(m, true);
  };

  const onDelete = async (m: ContactMessage) => {
    if (!confirm("Delete this message? This can't be undone.")) return;
    setBusyId(m._id);
    setError("");
    try {
      await client.delete(`/admin/messages/${m._id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't delete the message.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Messages</h1>
        <p className="page-subtitle">
          Messages sent through the Contact Us page · {counts.unread} unread of{" "}
          {counts.total}
        </p>
      </div>

      <div className="admin-filter">
        {(["all", "unread", "read"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`btn-ghost${filter === f ? " is-selected" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="page-loading">Loading…</div>}
      {!loading && messages.length === 0 && (
        <div className="empty-state">No messages here yet.</div>
      )}

      {!loading && (
        <div className="my-jobs-list">
          {messages.map((m) => (
            <div
              className={`admin-job message-item${m.isRead ? "" : " is-unread"}`}
              key={m._id}
            >
              <div className="admin-job-head">
                <div>
                  <h3>
                    {!m.isRead && (
                      <span className="unread-dot" aria-label="Unread" />
                    )}
                    {m.subject || "(No subject)"}
                  </h3>
                  <p className="job-row-meta">
                    {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a> ·{" "}
                    {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <div className="my-job-actions">
                  <button className="btn-ghost" onClick={() => toggle(m)}>
                    {open === m._id ? "Hide" : "View"}
                  </button>
                  <button
                    className="btn-ghost"
                    disabled={busyId === m._id}
                    onClick={() => setRead(m, !m.isRead)}
                  >
                    {m.isRead ? "Mark unread" : "Mark read"}
                  </button>
                  <button
                    className="btn-ghost btn-danger"
                    disabled={busyId === m._id}
                    onClick={() => onDelete(m)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {open === m._id && (
                <div className="admin-job-body">
                  <p className="admin-job-desc message-body">{m.message}</p>
                  <a
                    className="btn-primary-sm"
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent("Re: " + (m.subject || "Your message"))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Reply by email
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
