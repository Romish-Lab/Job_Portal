import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import ScheduleInterviewModal, { InterviewType } from "../components/ScheduleInterviewModal";
import "../styles/Interviews.css";
import "../styles/EmployerInterviews.css";

interface EmployerInterview {
  _id: string;
  type: InterviewType;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  scheduledDate: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  result?: "passed" | "failed" | "pending";
  job: { _id: string; title: string; company: string };
  candidate: { _id: string; name: string; email: string };
}

type Filter = "upcoming" | "completed" | "cancelled" | "all";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function EmployerInterviews() {
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [reschedule, setReschedule] = useState<EmployerInterview | null>(null);
  const [completing, setCompleting] = useState<EmployerInterview | null>(null);

  const load = async () => {
    try {
      const { data } = await client.get("/interviews/employer");
      setInterviews(data.interviews);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't load interviews.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const onCancel = async (i: EmployerInterview) => {
    if (!confirm(`Cancel the interview with ${i.candidate.name}? They will be emailed.`)) return;
    setError("");
    try {
      await client.delete(`/interviews/${i._id}`);
      setOk("Interview cancelled.");
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't cancel the interview.");
    }
  };

  const now = Date.now();
  const filtered = interviews.filter((i) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return i.status === "scheduled" && new Date(i.scheduledDate).getTime() >= now;
    if (filter === "completed") return i.status === "completed";
    return i.status === "cancelled";
  });
  // soonest first for upcoming, newest first otherwise
  if (filter === "upcoming") filtered.sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="interviews-page">
      <div className="interviews-container">
        <div className="interviews-header">
          <h1>Interviews</h1>
          <p>
            Interviews you've scheduled. To schedule a new one, open a job's <Link to="/my-jobs">applicants</Link> and press
            “Schedule interview”.
          </p>
        </div>

        {ok && <div className="form-success">{ok}</div>}
        {error && <div className="form-error">{error}</div>}

        <div className="ei-filters">
          {(["upcoming", "completed", "cancelled", "all"] as Filter[]).map((f) => (
            <button key={f} className={`btn-ghost${filter === f ? " is-selected" : ""}`} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No {filter === "all" ? "" : filter} interviews.</div>
        ) : (
          <div className="interviews-grid">
            {filtered.map((i) => (
              <div key={i._id} className={`interview-card${i.status === "scheduled" ? " upcoming" : ""}`}>
                <div className="interview-card-content">
                  <div className="interview-info">
                    <div className="interview-header">
                      <div className="interview-title-group">
                        <h3>{i.candidate.name}</h3>
                        <p className="interview-company">
                          {i.job.title} · {i.candidate.email}
                        </p>
                      </div>
                      <span className={`interview-status-badge ${i.status}`}>{i.status[0].toUpperCase() + i.status.slice(1)}</span>
                    </div>

                    <div className="interview-metadata">
                      <div className="interview-metadata-item">{i.type} interview</div>
                      <div className="interview-metadata-item">{formatDate(i.scheduledDate)}</div>
                      <div className="interview-metadata-item">{i.duration} minutes</div>
                      {i.location && <div className="interview-metadata-item">{i.location}</div>}
                    </div>

                    {i.meetingLink && (
                      <p>
                        <a href={i.meetingLink} target="_blank" rel="noopener noreferrer">
                          Meeting link
                        </a>
                      </p>
                    )}
                    {i.notes && <p className="interview-notes"><strong>Notes:</strong> {i.notes}</p>}

                    {i.status === "completed" && (
                      <p className="interview-feedback">
                        <strong>Result:</strong> {i.result ?? "—"}
                        {i.rating ? ` · Rating ${i.rating}/5` : ""}
                        {i.feedback ? ` · ${i.feedback}` : ""}
                      </p>
                    )}

                    {i.status === "scheduled" && (
                      <div className="ei-actions">
                        <button className="btn-primary-sm" onClick={() => setCompleting(i)}>Mark completed</button>
                        <button className="btn-ghost" onClick={() => setReschedule(i)}>Reschedule</button>
                        <button className="btn-ghost btn-danger" onClick={() => onCancel(i)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reschedule && (
        <ScheduleInterviewModal
          mode="edit"
          heading={`Reschedule interview with ${reschedule.candidate.name}`}
          interviewId={reschedule._id}
          initial={{
            type: reschedule.type,
            scheduledDate: reschedule.scheduledDate,
            duration: reschedule.duration,
            location: reschedule.location,
            meetingLink: reschedule.meetingLink,
            notes: reschedule.notes,
          }}
          onClose={() => setReschedule(null)}
          onDone={(m) => {
            setReschedule(null);
            setOk(m);
            load();
          }}
        />
      )}

      {completing && (
        <CompleteDialog
          interview={completing}
          onClose={() => setCompleting(null)}
          onDone={() => {
            setCompleting(null);
            setOk("Interview marked as completed.");
            load();
          }}
        />
      )}
    </div>
  );
}

function CompleteDialog({ interview, onClose, onDone }: { interview: EmployerInterview; onClose: () => void; onDone: () => void }) {
  const [result, setResult] = useState<"passed" | "failed" | "pending">("pending");
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await client.put(`/interviews/${interview._id}`, { status: "completed", result, rating: rating || undefined, feedback });
      onDone();
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't update the interview.");
      setBusy(false);
    }
  };

  return (
    <div className="si-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="si-dialog" onSubmit={submit}>
        <h2>Complete interview with {interview.candidate.name}</h2>
        {error && <div className="form-error">{error}</div>}
        <div className="si-grid">
          <label>
            Result
            <select value={result} onChange={(e) => setResult(e.target.value as typeof result)}>
              <option value="pending">Pending decision</option>
              <option value="passed">Passed</option>
              <option value="failed">Not selected</option>
            </select>
          </label>
          <label>
            Rating
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="">No rating</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} / 5</option>
              ))}
            </select>
          </label>
          <label className="si-wide">
            Feedback (shown to the candidate)
            <textarea rows={3} maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </label>
        </div>
        <div className="si-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
