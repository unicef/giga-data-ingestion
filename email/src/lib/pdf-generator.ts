import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Handlebars from "handlebars";
import {
  PDFBool,
  PDFDocument,
  PDFName,
  PDFString,
  rgb,
  StandardFonts,
} from "pdf-lib";
import puppeteer, { type Browser } from "puppeteer-core";

import { loadPdfLogoDataUri } from "./blob-assets";
import type { DataQualityReportEmailProps } from "../types/dq-report";

export interface ValueMapRow {
  src: string;
  dst: string;
  count: string;
  pct: string;
}

export interface PDFReportData extends DataQualityReportEmailProps {
  generatedDate: string;
  uploadedFileName: string;
  entity?: { plural: string; lowerPlural: string; lowerSingular: string };
  uploadMetadata?: Record<string, string | number | null | undefined>;
  valueMaps?: {
    education?: ValueMapRow[];
    electricity?: ValueMapRow[];
    connectivity?: ValueMapRow[];
  };
  schoolsCreated?: number | string | null;
  schoolsUpdated?: number | string | null;
}

type Check = {
  assertion?: string;
  column?: string;
  count_failed?: number;
  count_overall?: number;
  count_passed?: number;
};

type TableRow = { label: string; alerts: string; priority: string };
type TableSection = { title: string; rows: TableRow[] };

const SECTION_ALIASES: Record<string, string[]> = {
  critical: ["critical_checks", "critical_error_check"],
  duplicates: ["duplicate_checks", "duplicate checks", "duplicate_rows_checks"],
  location: ["location_checks", "location checks", "geospatial_checks"],
  domain: ["domain_checks", "domain checks"],
  missing: ["missing_value_checks", "missing value checks", "completeness_checks"],
  precision: ["precision_checks", "precision checks"],
};

function getSection(dq: Record<string, unknown>, key: keyof typeof SECTION_ALIASES): Check[] {
  for (const candidate of SECTION_ALIASES[key]) {
    const v = dq[candidate];
    if (Array.isArray(v)) return v as Check[];
  }
  return [];
}

function findCheck(
  checks: Check[],
  assertion: string,
  column?: string
): Check | undefined {
  return checks.find(
    (c) =>
      c.assertion === assertion &&
      (column === undefined || c.column === column)
  );
}

function failedCount(check: Check | undefined): number {
  return Number(check?.count_failed ?? 0) || 0;
}

function failedAcrossColumns(
  checks: Check[],
  assertion: string,
  columns: string[]
): number {
  return Math.max(
    ...columns.map((col) => failedCount(findCheck(checks, assertion, col))),
    0
  );
}

const fmt = (n: number): string =>
  Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "0";

const pctOf = (part: number, total: number): string => {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
};

const pctParen = (part: number, total: number): string =>
  `(${pctOf(part, total)})`;

const emDash = "—";

function strMeta(
  meta: Record<string, string | number | null | undefined> | undefined,
  key: string
): string {
  const v = meta?.[key];
  if (v === null || v === undefined || String(v).trim() === "") return emDash;
  return String(v);
}

function buildMetadataRows(
  meta: Record<string, string | number | null | undefined> | undefined,
  entityPlural: string
) {
  const idLabel =
    entityPlural === "Health Centers"
      ? "Primary record / facility ID type"
      : "School ID Type";

  return [
    { label: "Description", value: strMeta(meta, "description") },
    { label: "Data Focal Point Name", value: strMeta(meta, "focal_point_name") },
    { label: "Data Focal Point Email", value: strMeta(meta, "focal_point_contact") },
    { label: "Data Owner", value: strMeta(meta, "data_owner") },
    { label: "Year of Data Collection", value: strMeta(meta, "year_of_data_collection") },
    {
      label: "Data Collection Modality",
      value: strMeta(meta, "modality_of_data_collection"),
    },
    { label: idLabel, value: strMeta(meta, "school_ids_type") },
    {
      label: "Name of the EMIS System",
      value: strMeta(meta, "emis_system_name") || strMeta(meta, "emis_system"),
    },
    {
      label: "Frequency of School Data Collection",
      value: strMeta(meta, "frequency_of_school_data_collection"),
    },
    { label: "Next Collection", value: strMeta(meta, "next_school_data_collection") },
  ];
}

const PAGE_CONTENT_TOP = 69;
const PAGE_CONTENT_BOTTOM = 790;
/** Keep tables clear of the page footer band. */
const PAGE_CONTENT_SAFE_BOTTOM = PAGE_CONTENT_BOTTOM - 12;
const PAGE2_MAPS_TABLE_START = 258;
const SECTION_GAP = 16;
const MAP_TABLE_HEAD = 28;
const MAP_ROW_HEIGHT = 24;
const META_TABLE_HEAD = 36;
const META_ROW_HEIGHT = 24;

/** Map rows with long source labels wrap to two lines in the 160pt column. */
function estimateMapRowHeight(row: ValueMapRow): number {
  const len = row.src?.length ?? 0;
  if (len > 35) return 40;
  if (len > 20) return 32;
  return MAP_ROW_HEIGHT;
}

function mapTableHeight(rowCount: number, rows?: ValueMapRow[]): number {
  if (rowCount <= 0) return 0;
  if (rows && rows.length > 0) {
    const body = rows
      .slice(0, rowCount)
      .reduce((sum, row) => sum + estimateMapRowHeight(row), 0);
    return MAP_TABLE_HEAD + body;
  }
  return MAP_TABLE_HEAD + rowCount * MAP_ROW_HEIGHT;
}

function maxMapRowsThatFit(rows: ValueMapRow[], maxHeight: number): number {
  if (maxHeight < MAP_TABLE_HEAD || rows.length === 0) return 0;
  let used = MAP_TABLE_HEAD;
  let count = 0;
  for (const row of rows) {
    const rowH = estimateMapRowHeight(row);
    if (used + rowH > maxHeight) break;
    used += rowH;
    count++;
  }
  return count;
}

function splitConnectivityForPage2(
  rows: ValueMapRow[],
  connectivityTop: number
): { page2: ValueMapRow[]; overflow: ValueMapRow[] } {
  const avail = PAGE_CONTENT_SAFE_BOTTOM - connectivityTop;
  const maxRows = maxMapRowsThatFit(rows, avail);
  if (maxRows <= 0) return { page2: [], overflow: rows };
  if (rows.length <= maxRows) return { page2: rows, overflow: [] };
  return { page2: rows.slice(0, maxRows), overflow: rows.slice(maxRows) };
}

function metadataTableHeight(
  rows: Array<{ label: string; value: string }>
): number {
  const body = rows.reduce((sum, row) => {
    const len = row.value.length;
    if (len > 120) return sum + 48;
    if (len > 60) return sum + 36;
    return sum + META_ROW_HEIGHT;
  }, 0);
  return META_TABLE_HEAD + body;
}

type TailPageLayout = {
  connectivity: ValueMapRow[];
  includeMetadata: boolean;
};

/** Paginate connectivity overflow + metadata across pages 3+ without splitting tables mid-page. */
function layoutTailPages(
  connectivityOverflow: ValueMapRow[],
  metadataRows: Array<{ label: string; value: string }>
): TailPageLayout[] {
  const metaH = metadataTableHeight(metadataRows);
  const needMeta = metadataRows.length > 0;
  const pages: TailPageLayout[] = [];
  let connIdx = 0;

  const pageAvail = () => PAGE_CONTENT_SAFE_BOTTOM - PAGE_CONTENT_TOP;
  const metaPlaced = () => pages.some((p) => p.includeMetadata);

  while (
    connIdx < connectivityOverflow.length ||
    (needMeta && !metaPlaced())
  ) {
    const remaining = connectivityOverflow.length - connIdx;
    const metaStillNeeded = needMeta && !metaPlaced();

    const remainingSlice = connectivityOverflow.slice(connIdx);

    if (metaStillNeeded && remaining > 0) {
      const connBudget = pageAvail() - SECTION_GAP - metaH;
      const take = maxMapRowsThatFit(remainingSlice, connBudget);
      if (take > 0) {
        pages.push({
          connectivity: connectivityOverflow.slice(connIdx, connIdx + take),
          includeMetadata: true,
        });
        connIdx += take;
        continue;
      }
    }

    if (remaining > 0) {
      const take = maxMapRowsThatFit(remainingSlice, pageAvail());
      if (take <= 0) break;
      pages.push({
        connectivity: connectivityOverflow.slice(connIdx, connIdx + take),
        includeMetadata: false,
      });
      connIdx += take;
      continue;
    }

    if (metaStillNeeded) {
      pages.push({ connectivity: [], includeMetadata: true });
      continue;
    }

    break;
  }

  return pages;
}

function buildPostPage2Sections(
  tailLayouts: TailPageLayout[]
): Array<{
  connectivity: ValueMapRow[];
  includeMetadata: boolean;
  connectivityTop: number;
  metadataTop: number;
  pageNum: string;
}> {
  let pageNum = 3;
  return tailLayouts.map((layout) => {
    const connectivityTop = PAGE_CONTENT_TOP;
    const metadataTop = layout.includeMetadata
      ? layout.connectivity.length > 0
        ? connectivityTop +
          mapTableHeight(layout.connectivity.length, layout.connectivity) +
          SECTION_GAP
        : PAGE_CONTENT_TOP
      : 0;
    return {
      ...layout,
      connectivityTop,
      metadataTop,
      pageNum: String(pageNum++).padStart(2, "0"),
    };
  });
}

// Dev: src/lib/.. → src/templates. Prod bundle: dist/index.mjs → dist/templates.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = [
  path.resolve(HERE, "templates", "dq-report.html"),
  path.resolve(HERE, "..", "templates", "dq-report.html"),
].find((p) => fs.existsSync(p))!;

let cachedTemplate: HandlebarsTemplateDelegate | null = null;
let cachedTemplateMtimeMs = 0;
let cachedBrowser: Browser | null = null;

function loadTemplate(): HandlebarsTemplateDelegate {
  const stat = fs.statSync(TEMPLATE_PATH);
  if (!cachedTemplate || stat.mtimeMs !== cachedTemplateMtimeMs) {
    const raw = fs.readFileSync(TEMPLATE_PATH, "utf-8");
    cachedTemplate = Handlebars.compile(raw, { noEscape: false });
    cachedTemplateMtimeMs = stat.mtimeMs;
  }
  return cachedTemplate;
}

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) return cachedBrowser;
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser";
  cachedBrowser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });
  return cachedBrowser;
}

async function buildContext(data: PDFReportData) {
  const dq = (data.dataQualityCheck ?? {}) as Record<string, unknown>;
  const summary =
    (dq["summary"] as { rows?: number; rows_passed?: number; rows_failed?: number } | undefined) ??
    {};

  const crit = getSection(dq, "critical");
  const dupChecks = getSection(dq, "duplicates");
  const locChecks = getSection(dq, "location");
  const precChecks = getSection(dq, "precision");

  const entity = data.entity ?? {
    plural: "Schools",
    lowerPlural: "schools",
    lowerSingular: "school",
  };
  const ep = entity.plural;
  const es = entity.lowerSingular;

  const uploaded = Number(summary.rows ?? 0) || 0;
  const approved = Number(
    summary.rows_passed ?? Math.max(uploaded - Number(summary.rows_failed ?? 0), 0)
  );
  const rejected = Number(summary.rows_failed ?? Math.max(uploaded - approved, 0));

  const missingCoords = failedAcrossColumns(crit, "is_null_optional", [
    "latitude",
    "longitude",
  ]);
  const missingName = failedCount(findCheck(crit, "is_null_optional", "school_name"));
  const missingEduLevel = failedCount(
    findCheck(crit, "is_null_optional", "education_level_govt")
  );
  const outsideCountry = failedCount(findCheck(crit, "is_not_within_country"));
  const missingSchoolIds = failedCount(
    findCheck(crit, "is_null_mandatory", "school_id_govt")
  );
  const dupSchoolIds = failedCount(findCheck(dupChecks, "duplicate", "school_id_govt"));
  const lowPrecision = failedAcrossColumns(precChecks, "precision", [
    "latitude",
    "longitude",
  ]);
  const highDensity = failedCount(findCheck(locChecks, "is_school_density_greater_than_5"));
  const sameLocation = failedCount(findCheck(locChecks, "duplicate_set", "location_id"));
  const nameEduLoc = failedCount(
    findCheck(locChecks, "duplicate_set", "school_name_education_level_location_id")
  );
  const allExceptCode = failedCount(findCheck(dupChecks, "duplicate_all_except_school_code"));
  const nameLevel110 = failedCount(
    findCheck(locChecks, "duplicate_name_level_within_110m_radius")
  );
  const similarNameLevel110 = failedCount(
    findCheck(locChecks, "duplicate_similar_name_same_level_within_110m_radius")
  );

  // Approximate: max across warning-tier checks (not a true row-level union).
  const approvedWithWarnings = Math.max(
    lowPrecision,
    highDensity,
    allExceptCode,
    nameEduLoc,
    sameLocation,
    nameLevel110,
    similarNameLevel110
  );

  // Warnings apply only to approved (passed) rows — never to rejected.
  const warningsForDonut = Math.min(approvedWithWarnings, approved);

  const safeDenom = uploaded > 0 ? uploaded : 1;
  const circumference = 383.27;
  const rejArc = (rejected / safeDenom) * circumference;
  const warnArc = (warningsForDonut / safeDenom) * circumference;

  // Red tick at top-left (Figma). Amber follows clockwise after the rejected
  // slice so mustard never overlaps the red rejected band.
  const rejRotate = -96;
  const warnRotate =
    rejArc > 0.01 ? rejRotate + (rejArc / circumference) * 360 : -90;

  const idSectionTitle =
    ep === "Health Centers" ? "Record IDs" : "School IDs";

  const rejectedSections: TableSection[] = [
    {
      title: "Coordinates",
      rows: [
        {
          label: `${ep} with missing coordinates`,
          alerts: fmt(missingCoords),
          priority: "High",
        },
        {
          label: `${ep} with coordinates outside the country's limits`,
          alerts: fmt(outsideCountry),
          priority: "High",
        },
      ],
    },
    {
      title: idSectionTitle,
      rows: [
        {
          label: `${ep} with missing ID`,
          alerts: fmt(missingSchoolIds),
          priority: "High",
        },
        {
          label: `${ep} with duplicate ${es} IDs`,
          alerts: fmt(dupSchoolIds),
          priority: "High",
        },
      ],
    },
    {
      title: "Other",
      rows: [
        {
          label: `${ep} with missing names`,
          alerts: fmt(missingName),
          priority: "High",
        },
        {
          label: `${ep} with missing educational level`,
          alerts: fmt(missingEduLevel),
          priority: "High",
        },
      ],
    },
  ];

  const warningsPage1Sections: TableSection[] = [
    {
      title: "Duplicates",
      rows: [
        {
          label: `${ep} with the same location`,
          alerts: fmt(sameLocation),
          priority: "Medium",
        },
        {
          label: `${ep} with the same name, educational level, and location`,
          alerts: fmt(nameEduLoc),
          priority: "Medium",
        },
        {
          label: `${ep} identical except for ${es} ID`,
          alerts: fmt(allExceptCode),
          priority: "Medium",
        },
      ],
    },
    {
      title: "Accuracy",
      rows: [
        {
          label: "Low precision coordinates (less than 5 digits)",
          alerts: fmt(lowPrecision),
          priority: "Medium",
        },
      ],
    },
    {
      title: "Other",
      rows: [
        {
          label: `High Density (more than 5 ${entity.lowerPlural} within 500m)`,
          alerts: fmt(highDensity),
          priority: "Low",
        },
      ],
    },
  ];

  const warningsPage2Rows: TableRow[] = [
    {
      label: `${ep} with similar names, educational level, and location within a radius of 110m`,
      alerts: fmt(nameLevel110),
      priority: "Low",
    },
    {
      label: `${ep} with similar names and the same educational level within a radius of 110m`,
      alerts: fmt(similarNameLevel110),
      priority: "Low",
    },
  ];

  const valueMaps = data.valueMaps ?? {};
  const educationMaps = valueMaps.education ?? [];
  const electricityMaps = valueMaps.electricity ?? [];
  const connectivityAll = valueMaps.connectivity ?? [];

  const hasEducationMaps = educationMaps.length > 0;
  const hasElectricityMaps = electricityMaps.length > 0;
  const hasConnectivityMaps = connectivityAll.length > 0;
  const hasMapsSection =
    hasEducationMaps || hasElectricityMaps || hasConnectivityMaps;

  const metaRaw = data.uploadMetadata ?? {};
  const metadataRows = buildMetadataRows(metaRaw, ep);

  const hasCreated =
    data.schoolsCreated !== null &&
    data.schoolsCreated !== undefined &&
    String(data.schoolsCreated).trim() !== "";
  const hasUpdated =
    data.schoolsUpdated !== null &&
    data.schoolsUpdated !== undefined &&
    String(data.schoolsUpdated).trim() !== "";

  let page2NextTop = PAGE2_MAPS_TABLE_START;
  const mapsSectionTop = 193;
  const mapsNoteTop = 213;
  let educationMapsTop = 0;
  let electricityMapsTop = 0;
  let connectivityMapsTop = 0;
  let connectivityPage2: ValueMapRow[] = [];
  let connectivityOverflow: ValueMapRow[] = connectivityAll;

  if (hasMapsSection) {
    if (educationMaps.length > 0) {
      educationMapsTop = page2NextTop;
      page2NextTop += mapTableHeight(educationMaps.length, educationMaps);
    }
    if (electricityMaps.length > 0) {
      electricityMapsTop = page2NextTop;
      page2NextTop += mapTableHeight(electricityMaps.length, electricityMaps);
    }
    if (connectivityAll.length > 0) {
      connectivityMapsTop = page2NextTop;
      const split = splitConnectivityForPage2(
        connectivityAll,
        connectivityMapsTop
      );
      connectivityPage2 = split.page2;
      connectivityOverflow = split.overflow;
      if (connectivityPage2.length > 0) {
        page2NextTop += mapTableHeight(
          connectivityPage2.length,
          connectivityPage2
        );
      }
    }
  }
  const tailLayouts = layoutTailPages(connectivityOverflow, metadataRows);
  const postPage2Pages = buildPostPage2Sections(tailLayouts);

  const pageCount = 2 + postPage2Pages.length;

  return {
    country: data.country,
    uploadedFileName: data.uploadedFileName,
    uploadDate: data.uploadDate,
    uploadId: data.uploadId,
    entity,
    logoDataUri: await loadPdfLogoDataUri(),
    totals: {
      uploaded: fmt(uploaded),
      approved: fmt(approved),
      approvedWithWarnings: fmt(approvedWithWarnings),
      rejected: fmt(rejected),
      approvedPctParen: pctParen(approved, uploaded),
      warningsPctParen: pctParen(approvedWithWarnings, uploaded),
      rejectedPctParen: pctParen(rejected, uploaded),
    },
    donut: {
      centerTotal: fmt(uploaded),
      centerLabel: `${ep} uploaded`,
      rejArc: rejArc.toFixed(2),
      warnArc: warnArc.toFixed(2),
      circumference: circumference.toFixed(2),
      rejRotate: rejRotate.toFixed(2),
      warnRotate: warnRotate.toFixed(2),
    },
    schoolsCreated: hasCreated ? fmt(Number(data.schoolsCreated)) : emDash,
    schoolsUpdated: hasUpdated ? fmt(Number(data.schoolsUpdated)) : emDash,
    schoolsCreatedIsPlaceholder: !hasCreated,
    schoolsUpdatedIsPlaceholder: !hasUpdated,
    approvedWithWarningsIsApproximate: true,
    rejectedSections,
    warningsPage1Sections,
    warningsPage2Rows,
    educationMaps,
    electricityMaps,
    connectivityPage2,
    postPage2Pages,
    hasEducationMaps,
    hasElectricityMaps,
    hasConnectivityMaps,
    hasMapsSection,
    mapsSectionTop,
    mapsNoteTop,
    educationMapsTop,
    electricityMapsTop,
    connectivityMapsTop,
    metadataRows,
    hasMetadata: metadataRows.some((r) => r.value !== emDash),
    pageCount,
    pageNum: {
      p1: "01",
      p2: "02",
    },
  };
}

export async function renderHtml(data: PDFReportData): Promise<string> {
  const template = loadTemplate();
  return template(await buildContext(data));
}


export async function generateDataQualityReportPDF(
  data: PDFReportData
): Promise<Buffer> {
  const html = await renderHtml(data);

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export function formatDateForPDF(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
