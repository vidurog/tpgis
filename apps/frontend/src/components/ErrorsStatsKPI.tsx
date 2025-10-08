import "./styles/ErrorsStatsKpi.css";

/**
 * Kleine Kennzahl-Karte ("KPI").
 * Zeigt einen Label-Text und einen Zahlenwert oder Ladezustand.
 */
export default function ErrorsStatsKPI({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{loading ? "…" : value}</div>
    </div>
  );
}
