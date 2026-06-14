import axios from "axios";

// In dev, leave VITE_API_URL empty so requests are relative ("/api/...") and
// go through the Vite proxy (see vite.config.js) — no CORS, port-proof.
// In production, set VITE_API_URL to the real backend origin at build time.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;