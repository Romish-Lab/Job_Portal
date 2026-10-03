import axios from "axios";

// Backend ORIGIN without "/api". An empty string means "same origin", which is what
// production uses (the backend serves the frontend). Accepts any of these env values:
//   (unset) -> http://localhost:5000      "/api" -> same origin
//   "http://localhost:5000"               "http://localhost:5000/api"
const rawUrl = import.meta.env.VITE_API_URL as string | undefined;
export const API_ORIGIN: string =
  rawUrl === undefined ? "http://localhost:5000" : rawUrl.replace(/\/+$/, "").replace(/\/api$/, "");

const client = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true, // sends the httpOnly JWT cookie set by the backend
});

// Turns "/uploads/abc.png" into "<origin>/uploads/abc.png"
export const assetUrl = (path: string) => `${API_ORIGIN}${path}`;

export default client;