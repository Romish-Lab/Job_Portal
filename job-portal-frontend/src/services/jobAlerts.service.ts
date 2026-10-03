import api from "../utils/api";

export interface JobAlert {
  _id: string;
  keywords: string[];
  location?: string;
  jobType?: string[];
  salaryMin?: number;
  isActive: boolean;
  frequency: "instant" | "daily" | "weekly";
  createdAt: string;
}

export interface CreateJobAlertData {
  keywords: string[];
  location?: string;
  jobType?: string[];
  salaryMin?: number;
  frequency: "instant" | "daily" | "weekly";
}

export const jobAlertsService = {
  getAlerts: async () => {
    const { data } = await api.get("/api/job-alerts");
    return data;
  },

  createAlert: async (alertData: CreateJobAlertData) => {
    const { data } = await api.post("/api/job-alerts", alertData);
    return data;
  },

  updateAlert: async (alertId: string, alertData: Partial<CreateJobAlertData>) => {
    const { data } = await api.put(`/api/job-alerts/${alertId}`, alertData);
    return data;
  },

  deleteAlert: async (alertId: string) => {
    const { data } = await api.delete(`/api/job-alerts/${alertId}`);
    return data;
  },

  toggleAlert: async (alertId: string) => {
    const { data } = await api.patch(`/api/job-alerts/${alertId}/toggle`);
    return data;
  },
};
