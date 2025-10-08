import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * Einstiegspunkt der Anwendung.
 *
 * - Aktiviert Reacts {@link StrictMode}.
 * - Rendert {@link App} in das Root-Element.
 *
 * @example
 * ```html
 * <div id="root"></div>
 * <script type="module" src="/src/main.tsx"></script>
 * ```
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
