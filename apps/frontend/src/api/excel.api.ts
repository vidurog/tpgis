import { http } from "../shared/lib/http";

export type UploadResponse = {
  import_id?: string | number; // an dein Backend anpassen
  message?: string;
};

export async function uploadImportExcel(file: File): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file, file.name);

  const res = await http.post<UploadResponse>("/customer-imports/xlsx", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data ?? {};
}

export async function mergeExcelFile(import_id: string | number | undefined) {
  const res = await http.post(`customer-imports/${import_id}/merge`);
  console.log("merge api", res);
  return res.data ?? {};
}
