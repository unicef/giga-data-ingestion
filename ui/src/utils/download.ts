import { AxiosResponse } from "axios";
import { saveAs } from "file-saver";

import { api } from "@/api";

export function saveFile(blob: AxiosResponse<Blob>) {
  const contentDisposition = blob.headers["content-disposition"];
  const filenameMatch = contentDisposition.match(
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
  );
  let filename = "file.csv"; // Default filename
  if (filenameMatch != null && filenameMatch[1]) {
    filename = filenameMatch[1].replace(/['"]/g, "");
  }

  const file = new File([blob.data], filename, {
    type: blob.data.type,
  });
  saveAs(file);
}

export async function getDataPrivacyDocument() {
  const blob = await api.utils.getDataPrivacyDocument();

  if (blob) {
    saveFile(blob);
  }
}
