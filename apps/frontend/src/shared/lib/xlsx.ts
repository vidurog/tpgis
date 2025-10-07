import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Exportiert eine Array-of-Objects als .xlsx
 * @param rows   Datensätze (Array von Plain Objects)
 * @param sheet  Tabellenblatt-Name
 * @param file   Dateiname (mit .xlsx)
 */
export function exportXlsx(
  rows: Record<string, unknown>[],
  sheet = "Daten",
  file = "export.xlsx"
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, file);
}
