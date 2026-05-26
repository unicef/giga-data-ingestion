const PDF_HORIZONTAL_LOGO_URL =
  "https://saunigigashare.blob.core.windows.net/assets/giga_horizontal_unicef-itu_bicolor.svg";

const dataUriCache = new Map<string, string>();

function bufferToDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function fetchBlobAssetAsDataUri(url: string): Promise<string> {
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
      : "image/svg+xml";

  const dataUri = bufferToDataUri(buf, mime);
  dataUriCache.set(url, dataUri);
  return dataUri;
}

let cachedPdfLogoDataUri: string | null = null;

/** PDF footer lockup: fetch from blob and inline as data URI for Puppeteer. */
export async function loadPdfLogoDataUri(): Promise<string> {
  if (cachedPdfLogoDataUri !== null) return cachedPdfLogoDataUri;
  cachedPdfLogoDataUri = await fetchBlobAssetAsDataUri(PDF_HORIZONTAL_LOGO_URL);
  return cachedPdfLogoDataUri;
}
