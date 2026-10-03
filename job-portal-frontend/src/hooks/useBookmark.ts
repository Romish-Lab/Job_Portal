import { useState, useEffect } from "react";
import { savedJobsService } from "../services/savedJobs.service";

export const useBookmark = (jobId: string) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, [jobId]);

  const checkIfSaved = async () => {
    try {
      const data = await savedJobsService.checkIfSaved(jobId);
      setIsSaved(data.isSaved);
    } catch (error) {
      setIsSaved(false);
    }
  };

  const toggleBookmark = async () => {
    setLoading(true);
    try {
      if (isSaved) {
        await savedJobsService.unsaveJob(jobId);
        setIsSaved(false);
        return { success: true, message: "Job removed from saved" };
      } else {
        await savedJobsService.saveJob(jobId);
        setIsSaved(true);
        return { success: true, message: "Job saved successfully" };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update saved status",
      };
    } finally {
      setLoading(false);
    }
  };

  return { isSaved, loading, toggleBookmark };
};
