import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach JWT token from localStorage to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("sf_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// On 401 — clear storage and redirect to login
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sf_token");
      localStorage.removeItem("sf_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
