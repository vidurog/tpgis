import { http } from "../shared/lib/http";

/** Sortkeys gemäß SORT_MAP im Backend */
export type ErrorOrderKey =
  | "kundennummer"
  | "nachname"
  | "vorname"
  | "strasse"
  | "plz"
  | "ort"
  | "datenfehler"
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

export type ErrorClass =
  | "NO_ADDRESS_ISSUE"
  | "ADDRESS_GEOCODABLE"
  | "ADDRESS_NOT_GEOCODABLE";

/** Zeilenform gemäß mapRow() im Backend */
export type ErrorRow = {
  kundennummer: string | null;
  nachname: string | null;
  vorname: string | null;
  strasse: string | null;
  hnr: string | null;
  adz: string | null;
  plz: number | null;
  ort: string | null;
  telefon: string | null;
  mobil: string | null;
  kennung: string | null;
  besuchrhythmus: string | null;
  qs_besuch_historik: string | null;
  datenfehler: boolean | null;
  begruendung_datenfehler: string | null;
  aktiv: boolean;

  geocodable: boolean;
  error_class: ErrorClass;
  error_count: number;

  err_missing_rhythmus: boolean;
  err_missing_kennung: boolean;
  err_inconsistent_kennung_rhythmus: boolean;
  err_missing_history: boolean;
  err_missing_contact: boolean;
  err_no_geocoding: boolean;
  err_address_changed: boolean;
};

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
};

export type ErrorsDto = {
  total: number;
  limit: number;
  offset: number;
  orderBy: ErrorOrderKey;
  orderDir: "ASC" | "DESC";
  rows: ErrorRow[];
};

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

  return {
    total: Number(payload.total ?? rows.length),
    limit: Number(payload.limit ?? limit),
    offset: Number(payload.offset ?? offset),
    orderBy: (payload.orderBy ?? orderBy) as ErrorsDto["orderBy"],
    orderDir: (payload.orderDir ?? payload.oderDir ?? orderDir) as
      | "ASC"
      | "DESC",
    rows,
  };
}

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
