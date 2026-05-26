import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BLOB_ASSET_FILES,
  blobAssetUrls,
} from "../constants/blob-assets";

const dataUriCache = new Map<string, string>();

const HERE = path.dirname(
  typeof __filename !== "undefined"
    ? __filename
    : fileURLToPath(import.meta.url)
);

const LOCAL_PDF_LOGO_PATH = path.resolve(
  HERE,
  "..",
  "assets",
  BLOB_ASSET_FILES.pdfHorizontalLogo
);

function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function bufferToDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function fetchBlobAssetAsDataUri(url: string): Promise<string> {
  const cached = dataUriCache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch blob asset ${url}: ${res.status} ${res.statusText}`
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim();
  const mime =
    contentType && contentType.startsWith("image/")
      ? contentType
      : mimeFromFilename(new URL(url).pathname);

  const dataUri = bufferToDataUri(buf, mime);
  dataUriCache.set(url, dataUri);
  return dataUri;
}

let cachedPdfLogoDataUri: string | null = null;

/** PDF footer lockup: fetch from blob, inline as data URI for reliable Puppeteer render. */
export async function loadPdfLogoDataUri(): Promise<string> {
  if (cachedPdfLogoDataUri !== null) return cachedPdfLogoDataUri;

  const url = blobAssetUrls.pdfHorizontalLogo();
  try {
    cachedPdfLogoDataUri = await fetchBlobAssetAsDataUri(url);
    return cachedPdfLogoDataUri;
  } catch (err) {
    // Local dev fallback when the SVG is not yet in blob (prod must have it uploaded).
    if (fs.existsSync(LOCAL_PDF_LOGO_PATH)) {
      const buf = fs.readFileSync(LOCAL_PDF_LOGO_PATH);
      cachedPdfLogoDataUri = bufferToDataUri(
        buf,
        mimeFromFilename(LOCAL_PDF_LOGO_PATH)
      );
      return cachedPdfLogoDataUri;
    }
    throw err;
  }
}
