import { useState, useEffect } from "react";
import { savedJobsService } from "../services/savedJobs.service";
import { toast } from "react-hot-toast";

export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const data = await savedJobsService.getSavedJobs();
      setSavedJobs(data.savedJobs);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch saved jobs");
      toast.error(err.response?.data?.message || "Failed to fetch saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const unsaveJob = async (jobId: string) => {
    try {
      await savedJobsService.unsaveJob(jobId);
      setSavedJobs(savedJobs.filter((job) => job._id !== jobId));
      toast.success("Job removed from saved");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove job");
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  return { savedJobs, loading, error, fetchSavedJobs, unsaveJob };
};
