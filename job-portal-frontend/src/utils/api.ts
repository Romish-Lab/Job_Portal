import axios from "axios";
import { API_ORIGIN } from "../api/client";

const api = axios.create({
  baseURL: API_ORIGIN,
  withCredentials: true,
});

export default api;