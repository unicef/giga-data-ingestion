import { AxiosResponse } from "axios";
import { saveAs } from "file-saver";

import { api } from "@/api";

/** Decode a base64 PDF string and trigger download with the given filename. */
export function savePdfFromBase64(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  saveAs(blob, filename);
}

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
