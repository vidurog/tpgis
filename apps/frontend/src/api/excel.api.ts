import { http } from "../shared/lib/http";

/**
 * Antwortstruktur des Upload-Endpunkts.
 * `import_id` kann je nach Backend `string` oder `number` sein.
 */
export type UploadResponse = {
  /** ID des erzeugten Imports (vom Backend vergeben) */
  import_id?: string | number;
  /** Optionale Hinweis-/Fehlermeldung */
  message?: string;
};

/**
 * Lädt eine Excel-Datei (Kundenstammdaten) als Multipart-FormData hoch.
 *
 * @param file Die zu übertragende XLSX-Datei.
 * @returns {@link UploadResponse} des Backends.
 *
 * @example
 * ```ts
 * const resp = await uploadImportExcel(fileInput.files![0]);
 * console.log(resp.import_id);
 * ```
 */
export async function uploadImportExcel(file: File): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file, file.name);

  const res = await http.post<UploadResponse>("/customer-imports/xlsx", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data ?? {};
}
