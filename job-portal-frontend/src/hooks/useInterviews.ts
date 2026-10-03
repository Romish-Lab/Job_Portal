import { useState, useEffect } from "react";
import { interviewsService, Interview } from "../services/interviews.service";
import { toast } from "react-hot-toast";

export const useInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await interviewsService.getCandidateInterviews();
      setInterviews(data.interviews);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch interviews");
      toast.error(err.response?.data?.message || "Failed to fetch interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  return { interviews, loading, error, fetchInterviews };
};
