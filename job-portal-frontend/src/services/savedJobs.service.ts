import api from "../utils/api";

export interface SavedJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  logoUrl?: string;
  createdAt: string;
}

export const savedJobsService = {
  getSavedJobs: async () => {
    const { data } = await api.get("/api/saved-jobs");
    return data;
  },

  saveJob: async (jobId: string) => {
    const { data } = await api.post(`/api/saved-jobs/${jobId}`);
    return data;
  },

  unsaveJob: async (jobId: string) => {
    const { data } = await api.delete(`/api/saved-jobs/${jobId}`);
    return data;
  },

  checkIfSaved: async (jobId: string) => {
    const { data } = await api.get(`/api/saved-jobs/check/${jobId}`);
    return data;
  },
};
