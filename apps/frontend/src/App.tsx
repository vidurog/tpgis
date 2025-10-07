import "./App.css";
import ImportPage from "./pages/ImportPage";
import ErrorReportPage from "./pages/ErrorReportPage";
import { useState } from "react";
import Nav, { type Tab } from "./components/Nav";

function App() {
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
