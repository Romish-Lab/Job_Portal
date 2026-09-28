import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends the httpOnly JWT cookie set by the backend
});

// Turns "/uploads/abc.png" into "http://localhost:5000/uploads/abc.png"
export const assetUrl = (path: string) => `${API_URL.replace(/\/api$/, "")}${path}`;

export default client;