import "./App.css";
import ImportPage from "./pages/ImportPage";
import ErrorReportPage from "./pages/ErrorReportPage";
import { useState } from "react";
import Nav, { type Tab } from "./components/Nav";

/**
 * Root-Komponente der App.
 *
 * - Steuert das einfache Tab-Routing zwischen {@link ImportPage} und {@link ErrorReportPage}.
 * - Verwendet {@link Nav} als Kopfzeilen-Navigation.
 *
 * @remarks
 * Diese App nutzt kein Router-Framework; der aktive Tab wird rein
 * clientseitig in State gehalten.
 *
 * @example
 * ```tsx
 * import { createRoot } from "react-dom/client";
 * createRoot(document.getElementById("root")!).render(<App />);
 * ```
 */
function App() {
  /** Aktiver Tab der Anwendung (Import/Errors). */
  const [tab, setTab] = useState<Tab>("import");

  return (
    <div className="app">
      <Nav current={tab} onChange={setTab} />
      <main className="app__main">
        {tab === "import" ? <ImportPage /> : <ErrorReportPage />}
      </main>
    </div>
  );
}

export default App;
