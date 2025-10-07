import { UtcDateTimeToBerlin } from "../shared/lib/dateTime";
import { http } from "../shared/lib/http";

export type ImportRun = {
  id: string | number;
  imported_at: string; // ISO/String
  imported_by: string;
  merged: boolean;
  inserted_rows: number;
};

type ImportRunDto = {
  limit: number;
  offset: number;
  orderBy: string;
  orderDir: string;
  rows: ImportRun[];
  total: number;
};

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

export type CustomerImportDTO = {
  limit: number;
  offset: number;
  orderBy: string;
  orderDir: "ASC" | "DESC";
  total: number;
  rows: CustomerImport[];
};

export type CustomerImportFilter = {
  import_id?: string | number;
  imported_by?: string;
  kunde?: string;
  strasse?: string;
  ort?: string;
  plz?: number | string; // Input kommt als string
  from?: string; // ISO-UTC
  to?: string; // ISO-UTC
};

/**
 * Listet Metadaten von jeden Import auf
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
 * Listet Tabelle kunden_import auf
 * ggf. für eine ImoprtID (TODO)
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
  console.log("Customer API rows", rows);

  return {
    total: Number(payload.total ?? rows.length),
    limit: Number(payload.limit ?? limit),
    offset: Number(payload.offset ?? offset),
    orderBy: String(payload.orderBy ?? orderBy),
    orderDir: (payload.orderDir ?? orderDir) as "ASC" | "DESC",
    rows,
  };
}
