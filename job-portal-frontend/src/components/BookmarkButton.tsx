import { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Bookmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSavedJobs } from "../context/SavedJobsContext";
import "../styles/Bookmark.css";

interface Props {
  jobId: string;
  showText?: boolean; // "Save" / "Saved" label next to the icon
  className?: string;
}

export default function BookmarkButton({ jobId, showText = false, className = "" }: Props) {
  const { user } = useAuth();
  const { isSaved, toggle, busyId } = useSavedJobs();
  const navigate = useNavigate();

  // Employers and admins can't save jobs
  if (user && user.role !== "candidate") return null;

  const saved = isSaved(jobId);

  const onClick = (e: MouseEvent) => {
    // The button sits on top of a card that is a link: don't follow it
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast("Log in as a candidate to save jobs");
      navigate("/login");
      return;
    }
    toggle(jobId);
  };

  return (
    <button
      type="button"
      className={`bookmark-btn${saved ? " is-saved" : ""}${showText ? " with-text" : ""} ${className}`}
      onClick={onClick}
      disabled={busyId === jobId}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved jobs" : "Save job"}
      title={saved ? "Remove from saved jobs" : "Save for later"}
    >
      <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
      {showText && <span>{saved ? "Saved" : "Save job"}</span>}
    </button>
  );
}
