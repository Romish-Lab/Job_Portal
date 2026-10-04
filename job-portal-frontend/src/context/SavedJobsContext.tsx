import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "react-hot-toast";
import client from "../api/client";
import { useAuth } from "./AuthContext";

interface SavedJobsValue {
  isSaved: (jobId: string) => boolean;
  toggle: (jobId: string) => Promise<void>;
  busyId: string | null;
}

const SavedJobsContext = createContext<SavedJobsValue | undefined>(undefined);

// Loads the candidate's saved job ids ONCE, so every bookmark button on a page
// can show its state without making its own request.
export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "candidate") {
      setIds(new Set());
      return;
    }
    client
      .get("/saved-jobs/ids")
      .then(({ data }) => setIds(new Set<string>(data.ids)))
      .catch(() => setIds(new Set()));
  }, [user?.id, user?.role]);

  const isSaved = useCallback((jobId: string) => ids.has(jobId), [ids]);

  const toggle = useCallback(
    async (jobId: string) => {
      const wasSaved = ids.has(jobId);
      setBusyId(jobId);
      // optimistic update, rolled back if the request fails
      setIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.delete(jobId) : next.add(jobId);
        return next;
      });
      try {
        if (wasSaved) await client.delete(`/saved-jobs/${jobId}`);
        else await client.post(`/saved-jobs/${jobId}`);
        toast.success(wasSaved ? "Removed from saved jobs" : "Job saved");
      } catch (err: any) {
        setIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(jobId) : next.delete(jobId);
          return next;
        });
        toast.error(err.response?.data?.message || "Couldn't update saved jobs");
      } finally {
        setBusyId(null);
      }
    },
    [ids],
  );

  return <SavedJobsContext.Provider value={{ isSaved, toggle, busyId }}>{children}</SavedJobsContext.Provider>;
}

export function useSavedJobs() {
  const ctx = useContext(SavedJobsContext);
  if (!ctx) throw new Error("useSavedJobs must be used inside <SavedJobsProvider>");
  return ctx;
}
