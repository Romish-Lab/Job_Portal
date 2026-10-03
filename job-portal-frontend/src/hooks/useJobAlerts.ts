import { useState, useEffect } from "react";
import { jobAlertsService, JobAlert } from "../services/jobAlerts.service";
import { toast } from "react-hot-toast";

export const useJobAlerts = () => {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await jobAlertsService.getAlerts();
      setAlerts(data.alerts);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch alerts");
      toast.error(err.response?.data?.message || "Failed to fetch job alerts");
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alertData: any) => {
    try {
      await jobAlertsService.createAlert(alertData);
      toast.success("Job alert created successfully");
      await fetchAlerts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create alert");
      throw err;
    }
  };

  const updateAlert = async (alertId: string, alertData: any) => {
    try {
      await jobAlertsService.updateAlert(alertId, alertData);
      toast.success("Job alert updated successfully");
      await fetchAlerts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update alert");
      throw err;
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await jobAlertsService.deleteAlert(alertId);
      toast.success("Job alert deleted");
      await fetchAlerts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete alert");
    }
  };

  const toggleAlert = async (alertId: string) => {
    try {
      await jobAlertsService.toggleAlert(alertId);
      await fetchAlerts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle alert");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
  };
};
