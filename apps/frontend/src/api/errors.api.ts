import { http } from "../shared/lib/http";

/**
 * Sortierschlüssel, die dem `SORT_MAP` im Backend entsprechen.
 * Verwende diese Keys für `orderBy`, um eine stabile Sortierung zu bekommen.
 */
export type ErrorOrderKey =
  | "kundennummer"
  | "nachname"
  | "vorname"
  | "strasse"
  | "plz"
  | "ort"
  | "datenfehler"
  | "aktiv"
  | "kennung"
  | "sgb_37_3"
  | "pflegefirma"
  | "err_missing_rhythmus"
  | "err_missing_kennung"
  | "err_inconsistent_kennung_rhythmus"
  | "err_missing_history"
  | "err_missing_contact"
  | "err_no_geocoding"
  | "err_address_changed"
  | "geocodable"
  | "error_class"
  | "error_count";

/**
 * Einfache Klassifikation von Adress-Problemen.
 * - `NO_ADDRESS_ISSUE`: Keine Adressprobleme
 * - `ADDRESS_GEOCODABLE`: Adresse fehlerhaft, aber (noch) geokodierbar
 * - `ADDRESS_NOT_GEOCODABLE`: Adresse nicht geokodierbar
 */
export type ErrorClass =
  | "NO_ADDRESS_ISSUE"
  | "ADDRESS_GEOCODABLE"
  | "ADDRESS_NOT_GEOCODABLE";

/**
 * Zeilenform gemäß `mapRow()` im Backend.
 * Repräsentiert eine aggregierte Sicht auf Datenfehler je Kunde/Datensatz.
 */
export type ErrorRow = {
  /** Kundennummer (ggf. abgeleitet/normalisiert) */
  kundennummer: string | null;
  nachname: string | null;
  vorname: string | null;
  /** Straßenname (ggf. unkorrigiert aus Quelle) */
  strasse: string | null;
  /** Hausnummer (als Text, um Zusätze zuzulassen) */
  hnr: string | null;
  /** Adresszusatz (z. B. Buchstaben hinter der HNr) */
  adz: string | null;
  /** Postleitzahl; Backend liefert hier Zahl oder null */
  plz: string | null;
  ort: string | null;
  telefon: string | null;
  mobil: string | null;
  /** Pflegegrad/Kennung */
  kennung: string | null;
  /** Besuchsrhythmus (frei-text oder Katalog) */
  besuchrhythmus: string | null;
  /** Historik-Feld aus QS */
  qs_besuch_historik: string | null;
  /** Sammel-Flag „dieser Datensatz hat einen Datenfehler“ */
  datenfehler: boolean | null;
  /** Kunde aktiv? */
  aktiv: boolean;
  /** Flag für Auftrag sgb 37.3 */
  sgb_37_3: boolean;
  /** Flag für Auftrag Pflegefirma */
  pflegefirma: boolean;
  geburtstag_fehler: boolean;

  /** Adresse prinzipiell geokodierbar? */
  geocodable: boolean;
  /** Adressfehlerklasse */
  error_class: ErrorClass;
  /** Anzahl gesetzter Fehlerflags */
  error_count: number;

  /** Einzelne Fehlerflags (vom Backend abgeleitet) */
  rhythmus_fehler: boolean;
  kennung_fehler: boolean;
  inkonsistenz: boolean;
  historik_fehler: boolean;
  kontakt_fehler: boolean;
  geom_fehler: boolean;

  adresse_neu?: string | null;
};

/**
 * Filter für den Fehlerreport. Nur definierte/nicht-leere Felder werden an die API übergeben.
 */
export type ErrorsFilters = {
  plz?: string | number;
  ort?: string;
  datenfehler?: boolean;
  geocodable?: boolean;
  error_class?: ErrorClass;

  // (optional) einzelne Flags:
  err_missing_rhythmus?: boolean;
  err_missing_kennung?: boolean;
  err_inconsistent_kennung_rhythmus?: boolean;
  err_missing_history?: boolean;
  err_missing_contact?: boolean;
  err_no_geocoding?: boolean;
  err_address_changed?: boolean;

  // Kundennummer und Kundenname filterbar
  kundennummer?: string;
  kundenname?: string;
};

/** Typ für Fehler statisik (Anzahl) */
export type ErrorsStatsDto = {
  total_filtered: number;
  datenfehler_count: number;
  by_error_class: {
    NO_ADDRESS_ISSUE: number;
    ADDRESS_GEOCODABLE: number;
    ADDRESS_NOT_GEOCODABLE: number;
  };
};

/**
 * DTO für die Paginierung/Sicht des Fehlerreports.
 */
export type ErrorsDto = {
  /** Gesamtanzahl (Server-seitig bestimmt, sonst Fallback auf `rows.length`) */
  total: number;
  /** Seitengröße */
  limit: number;
  /** Offset der ersten Zeile */
  offset: number;
  /** Sortier-Spalte */
  orderBy: ErrorOrderKey;
  /** Sortierrichtung */
  orderDir: "ASC" | "DESC";
  /** Datensätze der aktuellen Seite */
  rows: ErrorRow[];
  /** Error Statistik */
  errorStats: ErrorsStatsDto;
};

/**
 * Lädt den Fehlerreport (paginierbar + sortierbar + filterbar).
 *
 * @param params Paginierung, Sortierung und optionale Filter.
 * @returns Ein {@link ErrorsDto} mit `rows` und Metadaten.
 *
 * @example
 * ```ts
 * const data = await listErrors({
 *   limit: 25,
 *   orderBy: "error_class",
 *   orderDir: "DESC",
 *   filters: { geocodable: false }
 * });
 * ```
 */
export async function listErrors(params?: {
  limit?: number;
  offset?: number;
  orderBy?: ErrorOrderKey;
  orderDir?: "ASC" | "DESC";
  filters?: ErrorsFilters;
}): Promise<ErrorsDto> {
  const {
    limit = 50,
    offset = 0,
    orderBy = "error_class",
    orderDir = "DESC",
    filters = {},
  } = params ?? {};

  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    orderBy,
    orderDir,
  });

  // boolean → "true"/"false" und nur sinnvolle Werte anhängen
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    qs.set(k, typeof v === "boolean" ? String(v) : String(v));
  }

  const res = await http.get(`/reports/errors?${qs.toString()}`);
  const payload: any = res.data ?? {};
  const rows = (Array.isArray(payload.rows) ? payload.rows : []) as ErrorRow[];

  const errorStats: ErrorsStatsDto = {
    total_filtered: Number(
      payload?.stats?.total_filtered ?? payload?.total ?? rows.length ?? 0
    ),
    datenfehler_count: Number(payload?.stats?.datenfehler_count ?? 0),
    by_error_class: {
      NO_ADDRESS_ISSUE: Number(
        payload?.stats?.by_error_class?.NO_ADDRESS_ISSUE ?? 0
      ),
      ADDRESS_GEOCODABLE: Number(
        payload?.stats?.by_error_class?.ADDRESS_GEOCODABLE ?? 0
      ),
      ADDRESS_NOT_GEOCODABLE: Number(
        payload?.stats?.by_error_class?.ADDRESS_NOT_GEOCODABLE ?? 0
      ),
    },
  };

  console.log("Error API. stats:", errorStats);

  return {
    total: Number(payload.total ?? rows.length),
    limit: Number(payload.limit ?? limit),
    offset: Number(payload.offset ?? offset),
    orderBy: (payload.orderBy ?? orderBy) as ErrorsDto["orderBy"],
    orderDir: (payload.orderDir ?? payload.oderDir ?? orderDir) as
      | "ASC"
      | "DESC",
    rows,
    errorStats,
  };
}

/**
 * Erzeugt die Download-URL für den XLSX-Export des Fehlerreports.
 * Übergibt nur definierte Filterparameter.
 *
 * @param opts Optional: Filter, `orderBy`, `orderDir`
 * @returns Absolute URL gegen `VITE_API_BASE_URL` (oder `http://localhost:3000`)
 *
 * @example
 * ```ts
 * const href = errorsExportUrl({
 *   orderBy: "error_class",
 *   orderDir: "DESC",
 *   filters: { geocodable: false }
 * });
 * window.location.href = href;
 * ```
 */
export function errorsExportUrl(opts: {
  filters?: ErrorsFilters;
  orderBy?: ErrorOrderKey;
  orderDir?: "ASC" | "DESC";
}) {
  const qs = new URLSearchParams();
  if (opts.orderBy) qs.set("orderBy", opts.orderBy);
  if (opts.orderDir) qs.set("orderDir", opts.orderDir);
  for (const [k, v] of Object.entries(opts.filters ?? {})) {
    if (v === undefined || v === null) continue;
    qs.set(k, typeof v === "boolean" ? String(v) : String(v));
  }
  const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
  return `${base}/reports/errors.xlsx?${qs.toString()}`;
}
