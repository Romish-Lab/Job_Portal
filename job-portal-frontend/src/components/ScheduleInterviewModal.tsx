import { FormEvent, useState } from "react";
import client from "../api/client";
import "../styles/EmployerInterviews.css";

export type InterviewType = "phone" | "video" | "in-person" | "technical";

export interface InterviewFormValues {
  type: InterviewType;
  scheduledDate: string; // ISO
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

interface Props {
  mode: "create" | "edit";
  heading: string;
  applicationId?: string; // create
  interviewId?: string; // edit (reschedule)
  initial?: InterviewFormValues;
  onClose: () => void;
  onDone: (message: string) => void;
}

// ISO string -> value for <input type="datetime-local"> in the user's time zone
const toLocalInput = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ScheduleInterviewModal({ mode, heading, applicationId, interviewId, initial, onClose, onDone }: Props) {
  const [type, setType] = useState<InterviewType>(initial?.type ?? "video");
  const [when, setWhen] = useState(toLocalInput(initial?.scheduledDate));
  const [duration, setDuration] = useState(String(initial?.duration ?? 60));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [meetingLink, setMeetingLink] = useState(initial?.meetingLink ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const date = new Date(when);
    if (!when || isNaN(date.getTime())) return setError("Please choose a date and time.");
    if (date.getTime() < Date.now()) return setError("The interview must be in the future.");

    const payload = {
      type,
      scheduledDate: date.toISOString(),
      duration: Number(duration),
      location: type === "in-person" ? location : "",
      meetingLink: type === "video" || type === "technical" ? meetingLink : "",
      notes,
    };

    setBusy(true);
    try {
      const { data } =
        mode === "create"
          ? await client.post(`/interviews/schedule/${applicationId}`, payload)
          : await client.put(`/interviews/${interviewId}`, payload);
      onDone(data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't save the interview.");
      setBusy(false);
    }
  };

  return (
    <div className="si-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="si-dialog" onSubmit={onSubmit}>
        <h2>{heading}</h2>
        <p className="si-hint">
          {mode === "create"
            ? "Only you, as the employer, can schedule this. The candidate is notified by email."
            : "The candidate will be emailed the new details."}
        </p>

        {error && <div className="form-error">{error}</div>}

        <div className="si-grid">
          <label>
            Interview type
            <select value={type} onChange={(e) => setType(e.target.value as InterviewType)}>
              <option value="phone">Phone</option>
              <option value="video">Video call</option>
              <option value="in-person">In person</option>
              <option value="technical">Technical</option>
            </select>
          </label>

          <label>
            Duration (minutes)
            <input type="number" min={15} max={480} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} required />
          </label>

          <label className="si-wide">
            Date and time
            <input type="datetime-local" value={when} min={toLocalInput(new Date().toISOString())} onChange={(e) => setWhen(e.target.value)} required />
          </label>

          {(type === "video" || type === "technical") && (
            <label className="si-wide">
              Meeting link (optional)
              <input type="url" placeholder="https://meet.google.com/..." maxLength={500} value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
            </label>
          )}

          {type === "in-person" && (
            <label className="si-wide">
              Location
              <input type="text" placeholder="Office address" maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
          )}

          <label className="si-wide">
            Notes for the candidate (optional)
            <textarea rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <div className="si-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Schedule interview" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
