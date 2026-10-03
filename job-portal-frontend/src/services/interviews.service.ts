import api from "../utils/api";

export interface Interview {
  _id: string;
  type: "phone" | "video" | "in-person" | "technical";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  scheduledDate: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  result?: "passed" | "failed" | "pending";
  job: {
    _id: string;
    title: string;
    company: string;
    logoUrl?: string;
  };
  employer?: {
    name: string;
    email: string;
    company: string;
  };
  candidate?: {
    name: string;
    email: string;
  };
}

export const interviewsService = {
  getCandidateInterviews: async () => {
    const { data } = await api.get("/api/interviews/candidate");
    return data;
  },

  getEmployerInterviews: async () => {
    const { data } = await api.get("/api/interviews/employer");
    return data;
  },

  scheduleInterview: async (applicationId: string, interviewData: any) => {
    const { data } = await api.post(`/api/interviews/schedule/${applicationId}`, interviewData);
    return data;
  },

  updateInterview: async (interviewId: string, updates: any) => {
    const { data } = await api.put(`/api/interviews/${interviewId}`, updates);
    return data;
  },

  cancelInterview: async (interviewId: string) => {
    const { data } = await api.delete(`/api/interviews/${interviewId}`);
    return data;
  },
};
