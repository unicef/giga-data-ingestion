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
import {
  entityText,
  isSupportedLanguage,
  LOCALE_TAG,
  t,
  type EntityKey,
  type Language,
} from "../i18n";
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
  language?: Language;
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

/** Warning-tier checks: count_failed is scoped to approved rows in dq-summary. */
function warningCount(check: Check | undefined): number {
  return failedCount(check);
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

function warningAcrossColumns(
  checks: Check[],
  assertion: string,
  columns: string[]
): number {
  return Math.max(
    ...columns.map((col) => warningCount(findCheck(checks, assertion, col))),
    0
  );
}

/** `useGrouping: false` keeps percentages identical to the previous toFixed(1). */
function makeNumberFormatters(tag: string) {
  const percent = new Intl.NumberFormat(tag, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false,
  });

  const fmt = (n: number): string =>
    Number.isFinite(n) ? Math.round(n).toLocaleString(tag) : "0";

  const pctOf = (part: number, total: number): string => {
    if (total <= 0) return "0%";
    return `${percent.format((part / total) * 100)}%`;
  };

  const pctParen = (part: number, total: number): string =>
    `(${pctOf(part, total)})`;

  return { fmt, pctOf, pctParen };
}

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
  language: Language,
  entity: EntityKey
) {
  return [
    { label: t(language, "metaDescription"), value: strMeta(meta, "description") },
    { label: t(language, "metaFocalPointName"), value: strMeta(meta, "focal_point_name") },
    { label: t(language, "metaFocalPointEmail"), value: strMeta(meta, "focal_point_contact") },
    { label: t(language, "metaDataOwner"), value: strMeta(meta, "data_owner") },
    {
      label: t(language, "metaYearOfCollection"),
      value: strMeta(meta, "year_of_data_collection"),
    },
    {
      label: t(language, "metaModality"),
      value: strMeta(meta, "modality_of_data_collection"),
    },
    {
      label: entityText(language, entity, "metaIdType"),
      value: strMeta(meta, "school_ids_type"),
    },
    {
      label: t(language, "metaEmisSystemName"),
      value: strMeta(meta, "emis_system_name") || strMeta(meta, "emis_system"),
    },
    {
      label: t(language, "metaFrequency"),
      value: strMeta(meta, "frequency_of_school_data_collection"),
    },
    {
      label: t(language, "metaNextCollection"),
      value: strMeta(meta, "next_school_data_collection"),
    },
  ];
}

const PAGE_CONTENT_TOP = 69;
const PAGE_CONTENT_BOTTOM = 790;
/** Keep tables clear of the page footer band. */
const PAGE_CONTENT_SAFE_BOTTOM = PAGE_CONTENT_BOTTOM - 12;
const PAGE2_MAPS_TABLE_START = 258;
const PAGE2_WARNINGS_TOP = 69;
const SECTION_GAP = 16;

// Mirrors the .tbl / .thead / .trow box model in dq-report.html. 1px = 0.75pt.
const ROW_LINE = 16;
const ROW_PAD_Y = 3;
const ROW_BORDER = 0.375;
const TBL_BORDERS = 1.5;
const HEAD_COMPACT = 22.375;
const HEAD_FULL = 24;
const MAP_SRC_COL = 160;
const MAP_DST_COL = 174;
const META_VALUE_COL = 265;
const TABLE_LABEL_COL = 362;
const CHAR_WIDTH = 5;

function rowHeight(lines: number): number {
  return ROW_PAD_Y * 2 + lines * ROW_LINE + ROW_BORDER;
}

function lineCount(text: string | undefined, columnWidth: number): number {
  const perLine = Math.max(1, Math.floor(columnWidth / CHAR_WIDTH));
  return Math.max(1, Math.ceil((text?.length ?? 0) / perLine));
}

/**
 * Row heights measured in the browser on a first render pass, keyed by `mk`.
 * Absent on the first pass, where the char-width estimate stands in.
 */
export type RowHeights = Record<string, number>;

type KeyedMapRow = ValueMapRow & { mk: string };
type KeyedMetaRow = { label: string; value: string; mk: string };

function mapRowHeight(row: KeyedMapRow, measured?: RowHeights): number {
  const m = measured?.[row.mk];
  if (m !== undefined) return m;
  return rowHeight(
    Math.max(lineCount(row.src, MAP_SRC_COL), lineCount(row.dst, MAP_DST_COL))
  );
}

function metaRowHeight(row: KeyedMetaRow, measured?: RowHeights): number {
  const m = measured?.[row.mk];
  if (m !== undefined) return m;
  return rowHeight(lineCount(row.value, META_VALUE_COL));
}

type MapGroup = { title: string; rows: KeyedMapRow[] };

function mapsTableHeight(groups: MapGroup[], measured?: RowHeights): number {
  if (groups.length === 0) return 0;
  return (
    TBL_BORDERS +
    groups.reduce(
      (sum, group) =>
        sum +
        HEAD_COMPACT +
        group.rows.reduce((rows, row) => rows + mapRowHeight(row, measured), 0),
      0
    )
  );
}

/** `maxHeight` budgets one group: its sub-header plus rows, table borders excluded. */
function maxMapRowsThatFit(
  rows: KeyedMapRow[],
  maxHeight: number,
  measured?: RowHeights
): number {
  let used = HEAD_COMPACT;
  if (maxHeight < used || rows.length === 0) return 0;
  let count = 0;
  for (const row of rows) {
    const rowH = mapRowHeight(row, measured);
    if (used + rowH > maxHeight) break;
    used += rowH;
    count++;
  }
  return count;
}

function splitConnectivityForPage2(
  rows: KeyedMapRow[],
  connectivityTop: number,
  measured?: RowHeights
): { page2: KeyedMapRow[]; overflow: KeyedMapRow[] } {
  const avail = PAGE_CONTENT_SAFE_BOTTOM - connectivityTop - TBL_BORDERS;
  const maxRows = maxMapRowsThatFit(rows, avail, measured);
  if (maxRows <= 0) return { page2: [], overflow: rows };
  if (rows.length <= maxRows) return { page2: rows, overflow: [] };
  return { page2: rows.slice(0, maxRows), overflow: rows.slice(maxRows) };
}

function metadataTableHeight(
  rows: KeyedMetaRow[],
  measured?: RowHeights
): number {
  const body = rows.reduce(
    (sum, row) => sum + metaRowHeight(row, measured),
    0
  );
  return TBL_BORDERS + HEAD_FULL + body;
}

type TailPageLayout = {
  connectivity: KeyedMapRow[];
  includeMetadata: boolean;
};

/** Paginate connectivity overflow + metadata across pages 3+ without splitting tables mid-page. */
function layoutTailPages(
  connectivityOverflow: KeyedMapRow[],
  metadataRows: KeyedMetaRow[],
  metadataOnPage2: boolean,
  measured?: RowHeights
): TailPageLayout[] {
  const metaH = metadataTableHeight(metadataRows, measured);
  const needMeta = !metadataOnPage2 && metadataRows.length > 0;
  const pages: TailPageLayout[] = [];
  let connIdx = 0;

  const pageAvail = () =>
    PAGE_CONTENT_SAFE_BOTTOM - PAGE_CONTENT_TOP - TBL_BORDERS;
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
      const take = maxMapRowsThatFit(remainingSlice, connBudget, measured);
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
      const take = maxMapRowsThatFit(remainingSlice, pageAvail(), measured);
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
  tailLayouts: TailPageLayout[],
  connectivityTitle: string,
  measured?: RowHeights
): Array<{
  mapsGroups: MapGroup[];
  includeMetadata: boolean;
  mapsTableTop: number;
  metadataTop: number;
  pageNum: string;
}> {
  let pageNum = 3;
  return tailLayouts.map((layout) => {
    const mapsGroups: MapGroup[] =
      layout.connectivity.length > 0
        ? [{ title: connectivityTitle, rows: layout.connectivity }]
        : [];
    const metadataTop = layout.includeMetadata
      ? mapsGroups.length > 0
        ? PAGE_CONTENT_TOP + mapsTableHeight(mapsGroups, measured) + SECTION_GAP
        : PAGE_CONTENT_TOP
      : 0;
    return {
      mapsGroups,
      includeMetadata: layout.includeMetadata,
      mapsTableTop: PAGE_CONTENT_TOP,
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

async function buildContext(data: PDFReportData, measured?: RowHeights) {
  const dq = (data.dataQualityCheck ?? {}) as Record<string, unknown>;
  const summary =
    (dq["summary"] as {
      rows?: number;
      rows_passed?: number | null;
      rows_failed?: number | null;
      rows_passed_with_warnings?: number | null;
      count_schools_low_precision_coordinates?: number | null;
      count_duplicate_school_id?: number | null;
      schools_created?: number | null;
      schools_updated?: number | null;
    } | undefined) ?? {};

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

  const language: Language = isSupportedLanguage(data.language)
    ? data.language
    : "en";
  // The API sends English entity nouns; they only select a catalogue here.
  const entityKey: EntityKey =
    ep === "Health Centers" ? "healthCenters" : "schools";
  const tr = (key: string) => t(language, key);
  const te = (key: string) => entityText(language, entityKey, key);
  const { fmt, pctParen } = makeNumberFormatters(LOCALE_TAG[language]);

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
  // Schools with a duplicate government ID. Prefer the deduped school count
  // from dq-summary; fall back to the per-check count for pre-change reports.
  const dupSchoolIds =
    typeof summary.count_duplicate_school_id === "number"
      ? summary.count_duplicate_school_id
      : failedCount(findCheck(dupChecks, "duplicate", "school_id_govt"));
  // Unique schools with low precision in lat and/or long (deduped upstream).
  // Falls back to max across the per-column checks for pre-change reports.
  const lowPrecision =
    typeof summary.count_schools_low_precision_coordinates === "number"
      ? summary.count_schools_low_precision_coordinates
      : warningAcrossColumns(precChecks, "precision", ["latitude", "longitude"]);
  const highDensity = warningCount(findCheck(locChecks, "is_school_density_greater_than_5"));
  // Dagster names the location-only duplicate check specially: its assertion is
  // "duplicate_location_rows" (not "duplicate_set-location_id").
  const sameLocation = warningCount(
    findCheck(locChecks, "duplicate_location_rows", "location_id")
  );
  const nameEduLoc = warningCount(
    findCheck(locChecks, "duplicate_set", "school_name_education_level_location_id")
  );
  const allExceptCode = warningCount(findCheck(dupChecks, "duplicate_all_except_school_code"));
  const nameLevel110 = warningCount(
    findCheck(locChecks, "duplicate_name_level_within_110m_radius")
  );
  const similarNameLevel110 = warningCount(
    findCheck(locChecks, "duplicate_similar_name_same_level_within_110m_radius")
  );

  // null/absent means "not computed upstream" — only a real number is exact.
  const rowsPassedWithWarnings =
    typeof summary.rows_passed_with_warnings === "number"
      ? summary.rows_passed_with_warnings
      : undefined;
  const hasExactApprovedWithWarnings = rowsPassedWithWarnings !== undefined;

  // KPI: unique approved rows with at least one warning (from dq-summary when available).
  const approvedWithWarnings =
    rowsPassedWithWarnings ??
    Math.max(
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

  const priorityHigh = tr("priorityHigh");
  const priorityMedium = tr("priorityMedium");
  const priorityLow = tr("priorityLow");

  const rejectedSections: TableSection[] = [
    {
      title: tr("sectionCoordinates"),
      rows: [
        {
          label: te("missingCoordinates"),
          alerts: fmt(missingCoords),
          priority: priorityHigh,
        },
        {
          label: te("outsideCountry"),
          alerts: fmt(outsideCountry),
          priority: priorityHigh,
        },
      ],
    },
    {
      title: te("sectionIds"),
      rows: [
        {
          label: te("missingId"),
          alerts: fmt(missingSchoolIds),
          priority: priorityHigh,
        },
        {
          label: te("duplicateIds"),
          alerts: fmt(dupSchoolIds),
          priority: priorityHigh,
        },
      ],
    },
    {
      title: tr("sectionOther"),
      rows: [
        {
          label: te("missingNames"),
          alerts: fmt(missingName),
          priority: priorityHigh,
        },
        {
          label: te("missingEducationLevel"),
          alerts: fmt(missingEduLevel),
          priority: priorityHigh,
        },
      ],
    },
  ];

  const warningsPage1Sections: TableSection[] = [
    {
      title: tr("sectionDuplicates"),
      rows: [
        {
          label: te("sameLocation"),
          alerts: fmt(sameLocation),
          priority: priorityMedium,
        },
        {
          label: te("sameNameLevelLocation"),
          alerts: fmt(nameEduLoc),
          priority: priorityMedium,
        },
        {
          label: te("identicalExceptId"),
          alerts: fmt(allExceptCode),
          priority: priorityMedium,
        },
      ],
    },
    {
      title: tr("sectionAccuracy"),
      rows: [
        {
          label: tr("lowPrecision"),
          alerts: fmt(lowPrecision),
          priority: priorityMedium,
        },
      ],
    },
    {
      title: tr("sectionOther"),
      rows: [
        {
          label: te("highDensity"),
          alerts: fmt(highDensity),
          priority: priorityLow,
        },
      ],
    },
  ];

  const warningsPage2Rows: TableRow[] = [
    {
      label: te("similarNameLevelLocation110"),
      alerts: fmt(nameLevel110),
      priority: priorityLow,
    },
    {
      label: te("similarNameSameLevel110"),
      alerts: fmt(similarNameLevel110),
      priority: priorityLow,
    },
  ];

  const valueMaps = data.valueMaps ?? {};
  // `mk` keys survive into the markup so a render pass can report real heights.
  let mapKey = 0;
  const keyMaps = (rows: ValueMapRow[]): KeyedMapRow[] =>
    rows.map((row) => ({ ...row, mk: `m${mapKey++}` }));
  const educationMaps = keyMaps(valueMaps.education ?? []);
  const electricityMaps = keyMaps(valueMaps.electricity ?? []);
  const connectivityAll = keyMaps(valueMaps.connectivity ?? []);

  const hasEducationMaps = educationMaps.length > 0;
  const hasElectricityMaps = electricityMaps.length > 0;
  const hasConnectivityMaps = connectivityAll.length > 0;
  const hasMapsSection =
    hasEducationMaps || hasElectricityMaps || hasConnectivityMaps;

  const metaRaw = data.uploadMetadata ?? {};
  const metadataRows: KeyedMetaRow[] = buildMetadataRows(
    metaRaw,
    language,
    entityKey
  ).map((row, i) => ({ ...row, mk: `d${i}` }));

  // Dagster reports these inside dq-summary (snake_case); top-level props win.
  const schoolsCreatedRaw = data.schoolsCreated ?? summary.schools_created;
  const schoolsUpdatedRaw = data.schoolsUpdated ?? summary.schools_updated;
  const hasCreated =
    schoolsCreatedRaw !== null &&
    schoolsCreatedRaw !== undefined &&
    String(schoolsCreatedRaw).trim() !== "";
  const hasUpdated =
    schoolsUpdatedRaw !== null &&
    schoolsUpdatedRaw !== undefined &&
    String(schoolsUpdatedRaw).trim() !== "";

  const mapsSectionTop = 193;
  const mapsNoteTop = 213;
  const mapsTableTop = PAGE2_MAPS_TABLE_START;
  const mapsGroups: MapGroup[] = [];
  let connectivityOverflow: KeyedMapRow[] = connectivityAll;

  if (hasMapsSection) {
    if (educationMaps.length > 0) {
      mapsGroups.push({ title: tr("educationLevel"), rows: educationMaps });
    }
    if (electricityMaps.length > 0) {
      mapsGroups.push({ title: tr("electricity"), rows: electricityMaps });
    }
    if (connectivityAll.length > 0) {
      const connectivityTop =
        mapsTableTop + mapsTableHeight(mapsGroups, measured);
      const split = splitConnectivityForPage2(
        connectivityAll,
        connectivityTop,
        measured
      );
      connectivityOverflow = split.overflow;
      if (split.page2.length > 0) {
        mapsGroups.push({ title: tr("connectivity"), rows: split.page2 });
      }
    }
  }

  const page2WarningsBottom =
    PAGE2_WARNINGS_TOP +
    TBL_BORDERS +
    HEAD_FULL +
    warningsPage2Rows.reduce(
      (sum, row) => sum + rowHeight(lineCount(row.label, TABLE_LABEL_COL)),
      0
    );

  // Page 2 keeps Metadata only when the whole table fits below the mappings.
  const page2ContentBottom =
    mapsGroups.length > 0
      ? mapsTableTop + mapsTableHeight(mapsGroups, measured)
      : page2WarningsBottom;
  const metadataPage2Top = page2ContentBottom + SECTION_GAP;
  const includeMetadataPage2 =
    connectivityOverflow.length === 0 &&
    metadataRows.length > 0 &&
    metadataPage2Top + metadataTableHeight(metadataRows, measured) <=
      PAGE_CONTENT_SAFE_BOTTOM;
  const parsedUploadDate = new Date(data.uploadDate);
  const localizedUploadDate = Number.isNaN(parsedUploadDate.getTime())
    ? data.uploadDate
    : formatDateForPDF(parsedUploadDate, language);

  const tailLayouts = layoutTailPages(
    connectivityOverflow,
    metadataRows,
    includeMetadataPage2,
    measured
  );
  const postPage2Pages = buildPostPage2Sections(
    tailLayouts,
    tr("connectivity"),
    measured
  );

  const pageCount = 2 + postPage2Pages.length;

  return {
    country: data.country,
    uploadedFileName: data.uploadedFileName,
    // English keeps the raw ISO timestamp it has always rendered.
    uploadDate: language === "en" ? data.uploadDate : localizedUploadDate,
    uploadId: data.uploadId,
    entity,
    lang: language,
    t: {
      reportTitle: tr("reportTitle"),
      uploadedOn: tr("uploadedOn"),
      ingestionId: tr("ingestionId"),
      alerts: tr("alerts"),
      priority: tr("priority"),
      rejected: tr("rejected"),
      warnings: tr("warnings"),
      excelSheet: tr("excelSheet"),
      approvedWithWarnings: tr("approvedWithWarnings"),
      mappings: tr("mappings"),
      mappingsNote: tr("mappingsNote"),
      educationLevel: tr("educationLevel"),
      electricity: tr("electricity"),
      connectivity: tr("connectivity"),
      metadata: tr("metadata"),
      entityPlural: te("plural"),
      entityCreated: te("created"),
      entityUpdated: te("updated"),
      entityApproved: te("approved"),
      entityRejected: te("rejected"),
    },
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
      centerLabel: te("uploaded"),
      rejArc: rejArc.toFixed(2),
      warnArc: warnArc.toFixed(2),
      circumference: circumference.toFixed(2),
      rejRotate: rejRotate.toFixed(2),
      warnRotate: warnRotate.toFixed(2),
    },
    schoolsCreated: hasCreated ? fmt(Number(schoolsCreatedRaw)) : emDash,
    schoolsUpdated: hasUpdated ? fmt(Number(schoolsUpdatedRaw)) : emDash,
    schoolsCreatedIsPlaceholder: !hasCreated,
    schoolsUpdatedIsPlaceholder: !hasUpdated,
    approvedWithWarningsIsApproximate: !hasExactApprovedWithWarnings,
    rejectedSections,
    warningsPage1Sections,
    warningsPage2Rows,
    mapsGroups,
    postPage2Pages,
    hasMapsSection,
    mapsSectionTop,
    mapsNoteTop,
    mapsTableTop,
    includeMetadataPage2,
    metadataPage2Top,
    metadataRows,
    hasMetadata: metadataRows.some((r) => r.value !== emDash),
    pageCount,
    pageNum: {
      p1: "01",
      p2: "02",
    },
  };
}

export async function renderHtml(
  data: PDFReportData,
  measured?: RowHeights
): Promise<string> {
  const template = loadTemplate();
  return template(await buildContext(data, measured));
}

/** Real rendered heights of every keyed table row, in points. */
const COLLECT_ROW_HEIGHTS = `(function () {
  var out = {};
  var nodes = document.querySelectorAll("[data-mk]");
  for (var i = 0; i < nodes.length; i++) {
    out[nodes[i].getAttribute("data-mk")] =
      nodes[i].getBoundingClientRect().height * 72 / 96;
  }
  return out;
})()`;


export async function generateDataQualityReportPDF(
  data: PDFReportData
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.emulateMediaType("print");

    // Pass 1 lays out with estimated row heights; pass 2 repaginates with the
    // heights the browser actually produced, so wrapped labels never overflow.
    await page.setContent(await renderHtml(data), { waitUntil: "networkidle0" });
    await page.evaluate("document.fonts.ready");
    const measured = (await page.evaluate(COLLECT_ROW_HEIGHTS)) as RowHeights;

    await page.setContent(await renderHtml(data, measured), {
      waitUntil: "networkidle0",
    });

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

export function formatDateForPDF(
  date: Date | string,
  language: Language = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(LOCALE_TAG[language], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
