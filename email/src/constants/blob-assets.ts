/** Public Azure Blob container used for email/PDF branding assets in prod. */
const DEFAULT_ASSETS_BLOB_BASE_URL =
  "https://saunigigashare.blob.core.windows.net/assets";

export function getAssetsBlobBaseUrl(): string {
  const base =
    process.env.ASSETS_BLOB_BASE_URL?.trim() || DEFAULT_ASSETS_BLOB_BASE_URL;
  return base.replace(/\/$/, "");
}

export function blobAssetUrl(filename: string): string {
  return `${getAssetsBlobBaseUrl()}/${filename}`;
}

/** Filenames under the `assets` blob prefix (must exist in the storage account). */
export const BLOB_ASSET_FILES = {
  gigaLogo: "GIGA_logo.png",
  pdfHorizontalLogo: "giga_horizontal_unicef-itu_bicolor.svg",
  checkmarkGreen: "CheckmarkOutlineGreen.png",
  misuseRed: "MisuseOutlineRed.png",
  misuseYellow: "MisuseOutlineYellow.png",
} as const;

export const blobAssetUrls = {
  gigaLogo: () => blobAssetUrl(BLOB_ASSET_FILES.gigaLogo),
  pdfHorizontalLogo: () => blobAssetUrl(BLOB_ASSET_FILES.pdfHorizontalLogo),
  checkmarkGreen: () => blobAssetUrl(BLOB_ASSET_FILES.checkmarkGreen),
  misuseRed: () => blobAssetUrl(BLOB_ASSET_FILES.misuseRed),
  misuseYellow: () => blobAssetUrl(BLOB_ASSET_FILES.misuseYellow),
} as const;
