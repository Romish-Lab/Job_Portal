import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  jobId: string;
  className?: string;
  showText?: boolean;
}

const BookmarkButton = ({ jobId, className = "", showText = false }: BookmarkButtonProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, [jobId]);

  const checkIfSaved = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/saved-jobs/check/${jobId}`,
        { withCredentials: true }
      );
      setIsSaved(data.isSaved);
    } catch (error) {
      // User might not be logged in, silently fail
      setIsSaved(false);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      if (isSaved) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/saved-jobs/${jobId}`, {
          withCredentials: true,
        });
        setIsSaved(false);
        toast.success("Job removed from saved");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/saved-jobs/${jobId}`,
          {},
          { withCredentials: true }
        );
        setIsSaved(true);
        toast.success("Job saved successfully");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update saved status";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`flex items-center gap-2 transition-all ${
        isSaved
          ? "text-emerald-500 hover:text-emerald-600"
          : "text-gray-400 hover:text-emerald-500"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={isSaved ? "Remove from saved" : "Save for later"}
    >
      <Bookmark
        className={`h-5 w-5 transition-all ${isSaved ? "fill-current" : ""}`}
      />
      {showText && (
        <span className="text-sm font-medium">{isSaved ? "Saved" : "Save"}</span>
      )}
    </button>
  );
};

export default BookmarkButton;
