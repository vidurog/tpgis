import { UtcDateTimeToBerlin } from "../shared/lib/dateTime";
import { http } from "../shared/lib/http";

/**
 * Metadatensatz einer Import-Ausführung (ein Eintrag pro Upload/Merge).
 */
export type ImportRun = {
  /** ID (abgeleitet aus `import_id` oder `id`) */
  id: string | number;
  /** Importzeitpunkt (bereits in Europe/Berlin konvertiert) */
  imported_at: string; // ISO/String
  /** Kürzel oder Name des Importeurs */
  imported_by: string;
  /** Ob der Import bereits gemerged wurde */
  merged: boolean;
  /** Anzahl eingefügter Zeilen im Merge-Vorgang */
  inserted_rows: number;
};

/** Paginierte DTO-Hülle für {@link ImportRun}. */
type ImportRunDto = {
  limit: number;
  offset: number;
  orderBy: string;
  orderDir: string;
  rows: ImportRun[];
  total: number;
};

/**
 * Rohdatensatz aus `kunden_import` (oder vergleichbarer Importtabelle).
 * Die Strings spiegeln den Rohinhalt wider; Datumswerte sind Strings.
 */
export type CustomerImport = {
  id: number | string;
  import_id: number | string;
  imported_at: string; // ISO String
  imported_by: string;
  kunde: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  mobil: string;
  geburtstag: string;
  kennung: string;
  start: string;
  ende: string;
  auftraege: string;
  serviceberater: string;
  qs_besuch_datum: string;
  qs_besuch_art: string;
  qs_besuch_historik: string;
  qs_besuch_hinweis_1: string;
  qs_besuch_hinweis_2: string;
};

/** Paginierte DTO-Hülle für {@link CustomerImport}. */
export type CustomerImportDTO = {
  limit: number;
  offset: number;
  orderBy: string;
  orderDir: "ASC" | "DESC";
  total: number;
  rows: CustomerImport[];
};

/**
 * Filter für die Import-Historie (Server-seitige Suche/Filterung).
 * Nur definierte/nicht-leere Felder werden als Query-String angehängt.
 */
export type CustomerImportFilter = {
  import_id?: string | number;
  imported_by?: string;
  kunde?: string;
  strasse?: string;
  ort?: string;
  /** Hinweis: Input kommt typischerweise als String an */
  plz?: number | string;
  /** ISO-UTC Startzeitpunkt (inkl.) */
  from?: string;
  /** ISO-UTC Endzeitpunkt (exkl. oder inkl. je nach Backend) */
  to?: string;
};

/**
 * Listet Metadaten aller Importe auf (paginierbar/sortierbar).
 * Konvertiert `imported_at` in die Zeitzone Europe/Berlin.
 *
 * @returns {@link ImportRunDto} mit konvertierten `rows`.
 *
 * @example
 * ```ts
 * const runs = await listImportRuns();
 * console.log(runs.rows[0].imported_at); // Berlin-Zeit
 * ```
 */
export async function listImportRuns(): Promise<ImportRunDto> {
  const res = await http.get<ImportRunDto>("/reports/runs");
  const payload = res.data as any;

  const runs: ImportRun[] = payload.rows.map((r: any) => ({
    // Backend hat import_id -> wir erzeugen id
    id: r.import_id ?? r.id ?? "",
    imported_at: UtcDateTimeToBerlin(r.imported_at),
    imported_by: r.imported_by ?? "",
    // falls Backend kein merged liefert, default false
    merged: Boolean(r.merged ?? r.is_merged ?? false),
    inserted_rows: Number(r.inserted_rows ?? r.inserted_rows ?? 0),
  }));

  return {
    limit: payload.limit ?? 50,
    offset: payload.offset ?? 0,
    orderBy: payload.orderBy ?? "imported_at",
    orderDir: payload.orderDir ?? "DESC",
    total: payload.total ?? payload.runs?.length ?? 0,
    rows: runs,
  };
}

/**
 * Listet `kunden_import` (paginierbar + filterbar).
 * Beachte: `UtcDateTimeToBerlin` wird auf `imported_at` angewandt.
 *
 * @param params Paginierung, Sortierung und optionale Filter.
 * @returns {@link CustomerImportDTO} mit normalisierten/konvertierten `rows`.
 *
 * @example
 * ```ts
 * const page = await listCustomerImports({
 *   limit: 100,
 *   filters: { imported_by: "000" }
 * });
 * ```
 */
export async function listCustomerImports(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "ASC" | "DESC";
  filters?: CustomerImportFilter;
}): Promise<CustomerImportDTO> {
  const {
    limit = 50,
    offset = 0,
    orderBy = "imported_at",
    orderDir = "DESC",
    filters = {},
  } = params ?? {};

  // Basisquery
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    orderBy,
    orderDir,
  });

  // Filter anwenden
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      query.set(k, String(v));
    }
  }

  // API CALL
  const res = await http.get<CustomerImportDTO>(
    `/reports/import-history?${query.toString()}`
  );
  const payload = (res.data as any) ?? {};

  const rawRows = Array.isArray(payload.rows) ? payload.rows : [];

  // Rows erzeugen
  const rows: CustomerImport[] = rawRows.map((r: any) => ({
    id: r.id ?? 0,
    import_id: r.import_id ?? 0,
    imported_at: UtcDateTimeToBerlin(r.imported_at),
    imported_by: r.imported_by ?? "000",
    kunde: r.kunde ?? null,
    strasse: r.strasse ?? null,
    plz: r.plz ?? null,
    ort: r.ort ?? null,
    telefon: r.telefon ?? null,
    mobil: r.mobil ?? null,
    geburtstag: r.geburtstag ?? null,
    kennung: r.kennung ?? null,
    start: r.start ?? null,
    ende: r.ende ?? null,
    auftraege: r.auftraege ?? null,
    serviceberater: r.serviceberater ?? null,
    qs_besuch_datum: r.qs_besuch_datum ?? null,
    qs_besuch_art: r.qs_besuch_art ?? null,
    qs_besuch_historik: r.qs_besuch_historik ?? null,
    qs_besuch_hinweis_1: String(r.qs_besuch_hinweis_1).includes("Lorem")
      ? "Lorem Ipsum"
      : null,
    qs_besuch_hinweis_2: String(r.qs_besuch_hinweis_2).includes("Lorem")
      ? "Lorem Ipsum"
      : null,
  }));

  return {
    total: Number(payload.total ?? rows.length),
    limit: Number(payload.limit ?? limit),
    offset: Number(payload.offset ?? offset),
    orderBy: String(payload.orderBy ?? orderBy),
    orderDir: (payload.orderDir ?? orderDir) as "ASC" | "DESC",
    rows,
  };
}
