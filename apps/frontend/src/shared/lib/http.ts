import axios from "axios";

/**
 * Vorkonfigurierte Axios-Instanz für API-Aufrufe.
 *
 * @remarks
 * - Nutzt `VITE_API_BASE_URL` aus den Umgebungsvariablen, sonst `http://localhost:3000`.
 * - `withCredentials` ist deaktiviert (keine Cookies).
 * - Ein einfacher Response-Interceptor loggt Fehler in der Konsole.
 *
 * @example
 * ```ts
 * import { http } from "../shared/lib/http";
 *
 * const res = await http.get("/reports/errors");
 * console.log(res.data);
 * ```
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  withCredentials: false, // anpassen falls Cookies/Auth
});

/**
 * Interceptor für einfache Fehlerausgabe (Konsole).
 * @internal
 */
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
