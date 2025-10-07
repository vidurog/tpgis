import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  withCredentials: false, // anpassen falls Cookies/Auth
});

// Optional: einfache Fehlerausgabe in der Konsole
http.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error(
      "API error:",
      err?.response?.status,
      err?.response?.data ?? err.message
    );
    return Promise.reject(err);
  }
);
