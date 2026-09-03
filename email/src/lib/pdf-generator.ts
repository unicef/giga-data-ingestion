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
import puppeteer, { type Browser, type Page } from "puppeteer-core";

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

/** `mk` survives into the markup so the measurement pass can report real heights. */
type TableRow = { label: string; alerts: string; priority: string; mk: string };
/** A null title is a section continued from the previous page: no sub-header. */
type TableSection = { title: string | null; rows: TableRow[] };

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

/** Falls back whenever the value is absent or not a finite number. */
function numberOr(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
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

  // "always" keeps the separator on 4-digit numbers, which es-ES drops by
  // default — otherwise 1127 and 95.488 sit in the same column. The option is
  // ES2023; TypeScript 5.3 still types it as boolean, hence the cast.
  const integer = new Intl.NumberFormat(tag, {
    useGrouping: "always",
    maximumFractionDigits: 0,
  } as unknown as Intl.NumberFormatOptions);

  const fmt = (n: number): string =>
    Number.isFinite(n) ? integer.format(Math.round(n)) : "0";

  const pctOf = (part: number, total: number): string => {
    if (total <= 0) return "0%";
    return `${percent.format((part / total) * 100)}%`;
  };

  const pctParen = (part: number, total: number): string =>
    `(${pctOf(part, total)})`;

  const pctValue = (n: number): string => `${percent.format(n)}%`;

  return { fmt, pctOf, pctParen, pctValue };
}

/**
 * valueMaps reach us pre-formatted in en-US ("95,488", "39.0%"). Re-format them
 * so separators match the rest of the report; leave anything unparseable alone.
 */
function reformatNumeric(
  raw: string | undefined,
  format: (n: number) => string
): string {
  const text = String(raw ?? "").trim();
  const bare = text.replace(/%/g, "").replace(/,/g, "").trim();
  if (bare === "") return text;
  const n = Number(bare);
  return Number.isFinite(n) ? format(n) : text;
}

const emDash = "—";

function strMeta(
  meta: Record<string, string | number | null | undefined> | undefined,
  key: string
): string {
  const v = meta?.[key];
  if (v === null || v === undefined) return emDash;
  // The API stringifies values with `str()`, so blanks arrive as "None".
  const text = String(v).trim();
  if (text === "" || text === "None") return emDash;
  return text;
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
const PAGE2_WARNINGS_TOP = 69;
const SECTION_GAP = 16;
/** Top of the page 1 warnings table; the rejected table above it is fixed height. */
const PAGE1_WARNINGS_TOP = 568;
/** Gaps that reproduce the previously fixed Mappings block (193 / 213 / 258pt). */
const MAPS_TITLE_GAP = 22;
const MAPS_NOTE_OFFSET = 20;
const MAPS_TABLE_GAP = 13;
// Mirror src/data_quality_checks/utils.py in giga-dagster: used only for reports
// generated before Dagster started reporting the thresholds it counted with.
const DEFAULT_DUPLICATE_LOCATION_GROUP_MIN = 4;
const DEFAULT_PROXIMITY_50M_GROUP_MIN = 3;

// Mirrors the .tbl / .thead / .trow box model in dq-report.html. 1px = 0.75pt.
const ROW_LINE = 16;
const ROW_PAD_Y = 3;
const ROW_BORDER = 0.375;
const TBL_BORDERS = 1.5;
const HEAD_COMPACT = 22.375;
const HEAD_FULL = 24;
const SUBHEAD = 22;
const NOTE_LINE = 16;
const NOTE_COL = 556;
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

function warningRowHeight(row: TableRow, measured?: RowHeights): number {
  const m = measured?.[row.mk];
  if (m !== undefined) return m;
  return rowHeight(lineCount(row.label, TABLE_LABEL_COL));
}

function warningsTableHeight(
  sections: TableSection[],
  measured?: RowHeights
): number {
  if (sections.length === 0) return 0;
  return (
    TBL_BORDERS +
    HEAD_FULL +
    sections.reduce(
      (sum, section) =>
        sum +
        (section.title === null ? 0 : SUBHEAD) +
        section.rows.reduce(
          (rows, row) => rows + warningRowHeight(row, measured),
          0
        ),
      0
    )
  );
}

/**
 * Split the warnings table across page 1 and page 2 by real row height.
 *
 * `availableHeight` budgets the section rows only: table borders and the
 * "Warnings" header are already accounted for by the caller. A section never
 * leaves its sub-header orphaned at the bottom of page 1, and the remainder of a
 * section that had to be cut carries `title: null` so page 2 does not repeat it.
 */
function splitWarningSections(
  sections: TableSection[],
  availableHeight: number,
  measured?: RowHeights
): { page1: TableSection[]; page2: TableSection[] } {
  const page1: TableSection[] = [];
  const page2: TableSection[] = [];
  let used = 0;
  let overflowing = false;

  for (const section of sections) {
    if (section.rows.length === 0) continue;
    if (overflowing) {
      page2.push(section);
      continue;
    }

    const firstRow = warningRowHeight(section.rows[0], measured);
    if (used + SUBHEAD + firstRow > availableHeight) {
      overflowing = true;
      page2.push(section);
      continue;
    }

    used += SUBHEAD;
    const taken: TableRow[] = [];
    for (const row of section.rows) {
      const h = warningRowHeight(row, measured);
      if (used + h > availableHeight) {
        overflowing = true;
        break;
      }
      used += h;
      taken.push(row);
    }

    page1.push({ title: section.title, rows: taken });
    const rest = section.rows.slice(taken.length);
    if (rest.length > 0) page2.push({ title: null, rows: rest });
  }

  return { page1, page2 };
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
      count_duplicate_location_groups?: number | null;
      duplicate_location_group_min_size?: number | null;
      count_proximity_50m_groups?: number | null;
      proximity_50m_group_min_size?: number | null;
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
  const { fmt, pctParen, pctValue } = makeNumberFormatters(
    LOCALE_TAG[language]
  );

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
  const similarNameLevel110 = warningCount(
    findCheck(locChecks, "duplicate_similar_name_same_level_within_110m_radius")
  );
  // Geospatial checks land in the "location" section via SECTION_ALIASES; their
  // column is "latitude,longitude", so match on the assertion alone.
  const uninhabitedArea = warningCount(
    findCheck(locChecks, "is_in_uninhabited_area")
  );
  const suspectLocation = warningCount(
    findCheck(locChecks, "is_suspect_location")
  );
  const within50m = warningCount(
    findCheck(locChecks, "duplicate_group_flag_50m")
  );

  // Group tallies are not 0/1 checks, so Dagster reports them in dq-summary.
  // The thresholds travel with them so a label can never contradict its number.
  const duplicateLocationGroups = numberOr(
    summary.count_duplicate_location_groups,
    0
  );
  const duplicateLocationGroupMin = numberOr(
    summary.duplicate_location_group_min_size,
    DEFAULT_DUPLICATE_LOCATION_GROUP_MIN
  );
  const proximity50mGroups = numberOr(summary.count_proximity_50m_groups, 0);
  const proximity50mGroupMin = numberOr(
    summary.proximity_50m_group_min_size,
    DEFAULT_PROXIMITY_50M_GROUP_MIN
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
      similarNameLevel110,
      uninhabitedArea,
      suspectLocation,
      within50m
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

  // `mk` keys survive into the markup so the measurement pass can report real
  // heights; a blank priority renders as an empty cell.
  let rowKey = 0;
  const row = (label: string, alerts: number, priority = ""): TableRow => ({
    label,
    alerts: fmt(alerts),
    priority,
    mk: `w${rowKey++}`,
  });
  const withCount = (label: string, count: number) =>
    label.replace("{count}", fmt(count));

  const rejectedSections: TableSection[] = [
    {
      title: tr("sectionCoordinates"),
      rows: [
        row(te("missingCoordinates"), missingCoords, priorityHigh),
        row(te("outsideCountry"), outsideCountry, priorityHigh),
      ],
    },
    {
      title: te("sectionIds"),
      rows: [
        row(te("missingId"), missingSchoolIds, priorityHigh),
        row(te("duplicateIds"), dupSchoolIds, priorityHigh),
      ],
    },
    {
      title: tr("sectionOther"),
      rows: [
        row(te("missingNames"), missingName, priorityHigh),
        row(te("missingEducationLevel"), missingEduLevel, priorityHigh),
      ],
    },
  ];

  // One ordered list; splitWarningSections decides where page 1 ends.
  const warningSections: TableSection[] = [
    {
      title: tr("sectionDuplicates"),
      rows: [
        row(te("sameLocation"), sameLocation, priorityMedium),
        row(
          withCount(te("duplicateLocationGroups"), duplicateLocationGroupMin),
          duplicateLocationGroups
        ),
        row(te("sameNameLevelLocation"), nameEduLoc, priorityMedium),
        row(te("identicalExceptId"), allExceptCode, priorityMedium),
      ],
    },
    {
      title: tr("sectionAccuracy"),
      rows: [
        row(te("lowPrecision"), lowPrecision, priorityMedium),
        row(te("notInhabitedArea"), uninhabitedArea, priorityMedium),
        row(te("notNearBuiltEnvironment"), suspectLocation, priorityLow),
      ],
    },
    {
      title: tr("sectionOther"),
      rows: [
        row(te("within50m"), within50m, priorityLow),
        row(
          withCount(te("proximity50mGroups"), proximity50mGroupMin),
          proximity50mGroups
        ),
        row(te("similarNameSameLevel110"), similarNameLevel110, priorityLow),
        row(te("highDensity"), highDensity, priorityLow),
      ],
    },
  ];

  const { page1: warningsPage1Sections, page2: warningsPage2Sections } =
    splitWarningSections(
      warningSections,
      PAGE_CONTENT_SAFE_BOTTOM - PAGE1_WARNINGS_TOP - TBL_BORDERS - HEAD_FULL,
      measured
    );

  const valueMaps = data.valueMaps ?? {};
  // `mk` keys survive into the markup so a render pass can report real heights.
  let mapKey = 0;
  const keyMaps = (rows: ValueMapRow[]): KeyedMapRow[] =>
    rows.map((mapRow) => ({
      ...mapRow,
      count: reformatNumeric(mapRow.count, fmt),
      pct: reformatNumeric(mapRow.pct, pctValue),
      mk: `m${mapKey++}`,
    }));
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

  // No overflow rows means no warnings table on page 2, so nothing to clear.
  const page2WarningsBottom =
    warningsPage2Sections.length > 0
      ? PAGE2_WARNINGS_TOP + warningsTableHeight(warningsPage2Sections, measured)
      : PAGE_CONTENT_TOP - MAPS_TITLE_GAP;

  // The Mappings block follows the warnings table instead of sitting at fixed
  // tops: the warnings table now grows and shrinks with the check set.
  const mapsNote = tr("mappingsNote");
  const mapsNoteHeight =
    measured?.["note"] ?? lineCount(mapsNote, NOTE_COL) * NOTE_LINE;
  const mapsSectionTop = page2WarningsBottom + MAPS_TITLE_GAP;
  const mapsNoteTop = mapsSectionTop + MAPS_NOTE_OFFSET;
  const mapsTableTop = mapsNoteTop + mapsNoteHeight + MAPS_TABLE_GAP;
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
      excelSheetWarning: tr("excelSheetWarning"),
      excelSheetRejected: tr("excelSheetRejected"),
      approvedWithWarnings: tr("approvedWithWarnings"),
      mappings: tr("mappings"),
      mappingsNote: mapsNote,
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
    warningsPage2Sections,
    warningsTableTop: PAGE1_WARNINGS_TOP,
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


async function loadForPrint(page: Page, html: string): Promise<void> {
  await page.emulateMediaType("print");
  await page.setContent(html, { waitUntil: "networkidle0" });
  // Resolve to a primitive: FontFaceSet itself is not serialisable.
  await page.evaluate("document.fonts.ready.then(function () { return true; })");
}

/**
 * Real row heights, measured by rendering once. A second `setContent` on a page
 * that already has content never reaches `networkidle0`, so this uses its own.
 */
async function measureRowHeights(
  browser: Browser,
  html: string
): Promise<RowHeights> {
  const page = await browser.newPage();
  try {
    await loadForPrint(page, html);
    return (await page.evaluate(COLLECT_ROW_HEIGHTS)) as RowHeights;
  } finally {
    await page.close();
  }
}

export async function generateDataQualityReportPDF(
  data: PDFReportData
): Promise<Buffer> {
  const browser = await getBrowser();

  // Pass 1 lays out with estimated row heights; pass 2 repaginates with the
  // heights the browser actually produced, so wrapped labels never overflow.
  const measured = await measureRowHeights(browser, await renderHtml(data));

  const page = await browser.newPage();
  try {
    await loadForPrint(page, await renderHtml(data, measured));

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
