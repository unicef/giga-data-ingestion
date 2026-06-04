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

export interface PDFReportData extends DataQualityReportEmailProps {
  generatedDate: string;
  uploadedFileName: string;
  entity?: { plural: string; lowerPlural: string; lowerSingular: string };
  fieldMapping?: Array<{ from: string; to: string }>;
}

type Check = {
  assertion?: string;
  column?: string;
  count_failed?: number;
  count_overall?: number;
  count_passed?: number;
};

type Tone = "critical" | "warning" | "none";

// ── Inline SVG icons used in the template ────────────────────────────────
const CRITICAL_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="12" height="12" fill="white" style="mix-blend-mode:multiply"/><path d="M6 0.75C3.1125 0.75 0.75 3.1125 0.75 6C0.75 8.8875 3.1125 11.25 6 11.25C8.8875 11.25 11.25 8.8875 11.25 6C11.25 3.1125 8.8875 0.75 6 0.75ZM5.5875 3H6.4125V7.125H5.5875V3ZM6 9.375C5.7 9.375 5.4375 9.1125 5.4375 8.8125C5.4375 8.5125 5.7 8.25 6 8.25C6.3 8.25 6.5625 8.5125 6.5625 8.8125C6.5625 9.1125 6.3 9.375 6 9.375Z" fill="#ff0000"/></svg>`;
const WARNING_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="12" height="12" fill="white" style="mix-blend-mode:multiply"/><path d="M6.00075 2.31428H5.99925L1.74327 10.4987L1.74398 10.5H10.256L10.2567 10.4987L6.00075 2.31428ZM5.57813 4.50001H6.42188V7.87501H5.57813V4.50001ZM6 9.75001C5.88875 9.75001 5.78 9.71702 5.68749 9.65521C5.59499 9.5934 5.5229 9.50555 5.48032 9.40277C5.43775 9.29998 5.42661 9.18688 5.44831 9.07777C5.47002 8.96865 5.52359 8.86843 5.60226 8.78976C5.68092 8.71109 5.78115 8.65752 5.89026 8.63581C5.99938 8.61411 6.11248 8.62525 6.21526 8.66782C6.31805 8.7104 6.4059 8.7825 6.4677 8.875C6.52951 8.9675 6.5625 9.07625 6.5625 9.18751C6.5625 9.33669 6.50324 9.47976 6.39775 9.58525C6.29226 9.69074 6.14919 9.75001 6 9.75001Z" fill="#f9a825"/><path d="M10.875 11.25H1.125C1.06058 11.25 0.997235 11.2334 0.941088 11.2018C0.884941 11.1702 0.837881 11.1247 0.804447 11.0696C0.771013 11.0145 0.752332 10.9518 0.750204 10.8874C0.748077 10.823 0.762576 10.7591 0.792303 10.702L5.6673 1.32698C5.69897 1.26609 5.74673 1.21506 5.8054 1.17945C5.86406 1.14383 5.93137 1.125 6 1.125C6.06863 1.125 6.13594 1.14383 6.19461 1.17945C6.25327 1.21506 6.30104 1.26609 6.3327 1.32698L11.2077 10.702C11.2374 10.7591 11.2519 10.823 11.2498 10.8874C11.2477 10.9518 11.229 11.0145 11.1956 11.0696C11.1621 11.1247 11.1151 11.1702 11.0589 11.2018C11.0028 11.2334 10.9394 11.25 10.875 11.25ZM1.74398 10.5H10.256L10.2567 10.4987L6.00075 2.31428H5.99925L1.74327 10.4987L1.74398 10.5Z" fill="#f9a825"/></svg>`;

// ── Handlebars setup ─────────────────────────────────────────────────────
Handlebars.registerHelper("tone", function (this: unknown, tone: unknown) {
  if (tone === "critical") return new Handlebars.SafeString(CRITICAL_SVG);
  if (tone === "warning") return new Handlebars.SafeString(WARNING_SVG);
  return new Handlebars.SafeString("");
});

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

// ── DQ JSON helpers ───────────────────────────────────────────────────────

// The on-disk JSON uses keys with spaces ("duplicate checks") while the
// Pydantic-typed API uses underscores ("duplicate_rows_checks"). Accept both.
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

// "Schools with missing coords" can come from either latitude OR longitude
// failing — pick the larger of the two so the report doesn't underreport.
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

function toneFor(value: number, tone: Tone): Tone {
  return value > 0 ? tone : "none";
}

// ── Main payload assembly ────────────────────────────────────────────────

async function buildContext(data: PDFReportData) {
  const dq = (data.dataQualityCheck ?? {}) as Record<string, unknown>;
  const summary =
    (dq["summary"] as { rows?: number; rows_passed?: number; rows_failed?: number } | undefined) ?? {};

  const crit = getSection(dq, "critical");
  const dupChecks = getSection(dq, "duplicates");
  const locChecks = getSection(dq, "location");
  const missChecks = getSection(dq, "missing");
  const precChecks = getSection(dq, "precision");

  const uploaded = Number(summary.rows ?? 0) || 0;
  const passed = Number(summary.rows_passed ?? Math.max(uploaded - Number(summary.rows_failed ?? 0), 0));
  const rejected = Number(summary.rows_failed ?? Math.max(uploaded - passed, 0));

  // ── Basic Checks (Page 1) ─────────────────────────────────────────────
  const missingCoords = failedAcrossColumns(crit, "is_null_optional", ["latitude", "longitude"]);
  const missingName = failedCount(findCheck(crit, "is_null_optional", "school_name"));
  const missingEduLevel = failedCount(findCheck(crit, "is_null_optional", "education_level_govt"));
  const outsideCountry = failedCount(findCheck(crit, "is_not_within_country"));
  const missingSchoolIds = failedCount(findCheck(crit, "is_null_mandatory", "school_id_govt"));
  const lowPrecision = failedAcrossColumns(precChecks, "precision", ["latitude", "longitude"]);
  const highDensity = failedCount(findCheck(locChecks, "is_school_density_greater_than_5"));

  const basicChecks = [
    { label: `${data.entity?.plural ?? "Schools"} with missing coordinates`, value: fmt(missingCoords), toneName: toneFor(missingCoords, "critical") },
    { label: `${data.entity?.plural ?? "Schools"} with missing name`, value: fmt(missingName), toneName: toneFor(missingName, "critical") },
    { label: `${data.entity?.plural ?? "Schools"} with missing education level`, value: fmt(missingEduLevel), toneName: toneFor(missingEduLevel, "critical") },
    { label: `${data.entity?.plural ?? "Schools"} outside country boundary`, value: fmt(outsideCountry), toneName: toneFor(outsideCountry, "critical") },
    { label: `${data.entity?.plural ?? "Schools"} IDs Missing`, value: fmt(missingSchoolIds), toneName: toneFor(missingSchoolIds, "critical") },
    { label: "Low Precision Coordinates (less than 5 digits)", value: fmt(lowPrecision), toneName: toneFor(lowPrecision, "warning") },
    { label: `High Density (more than 5 ${data.entity?.lowerPlural ?? "schools"} within 500m)`, value: fmt(highDensity), toneName: toneFor(highDensity, "warning") },
  ];

  // ── Duplicate Groups (Page 1) ─────────────────────────────────────────
  const dupSchoolIds = failedCount(findCheck(dupChecks, "duplicate", "school_id_govt"));
  const sameLocation = failedCount(findCheck(locChecks, "duplicate_set", "location_id"));
  const allExceptCode = failedCount(findCheck(dupChecks, "duplicate_all_except_school_code"));

  const page1Rows = [
    { label: `Duplicate ${data.entity?.lowerSingular ?? "school"} IDs`, value: fmt(dupSchoolIds), toneName: toneFor(dupSchoolIds, "critical") },
    { label: `${data.entity?.plural ?? "Schools"} with the same location`, value: fmt(sameLocation), toneName: toneFor(sameLocation, "critical") },
    { label: `${data.entity?.plural ?? "Schools"} with everything same except ${data.entity?.lowerSingular ?? "school"} code`, value: fmt(allExceptCode), toneName: toneFor(allExceptCode, "warning") },
  ];

  // ── Duplicate Groups (Page 2) ─────────────────────────────────────────
  const allMatch = failedCount(findCheck(locChecks, "duplicate_set", "school_id_govt_school_name_education_level_location_id"));
  const nameEduLoc = failedCount(findCheck(locChecks, "duplicate_set", "school_name_education_level_location_id"));
  const eduLoc = failedCount(findCheck(locChecks, "duplicate_set", "education_level_location_id"));
  const nameLevel110 = failedCount(findCheck(locChecks, "duplicate_name_level_within_110m_radius"));
  const similarNameLevel110 = failedCount(findCheck(locChecks, "duplicate_similar_name_same_level_within_110m_radius"));

  const page2Rows = [
    { label: `${data.entity?.plural ?? "Schools"} with same ${data.entity?.lowerSingular ?? "school"} id, education level, ${data.entity?.lowerSingular ?? "school"} name, location`, value: fmt(allMatch), toneName: toneFor(allMatch, "critical") },
    { label: `${data.entity?.plural ?? "Schools"} with same ${data.entity?.lowerSingular ?? "school"} name, education level, location`, value: fmt(nameEduLoc), toneName: toneFor(nameEduLoc, "warning") },
    { label: `${data.entity?.plural ?? "Schools"} with same education level, location`, value: fmt(eduLoc), toneName: toneFor(eduLoc, "warning") },
    { label: `${data.entity?.plural ?? "Schools"} with same ${data.entity?.lowerSingular ?? "school"} name and education level within 110m radius`, value: fmt(nameLevel110), toneName: toneFor(nameLevel110, "warning") },
    { label: `${data.entity?.plural ?? "Schools"} with similar ${data.entity?.lowerSingular ?? "school"} name and same education level within 110m radius`, value: fmt(similarNameLevel110), toneName: toneFor(similarNameLevel110, "warning") },
  ];

  // ── "Possible Duplicates" big number ─────────────────────────────────
  // Best-effort: the union of duplicate-flavor failures. Without row-level
  // identifiers in the summary we can't compute a true union, so we take the
  // max across all duplicate-style checks as a defensible "at least N" total.
  const dupTotal = Math.max(
    dupSchoolIds, sameLocation, allExceptCode,
    allMatch, nameEduLoc, eduLoc, nameLevel110, similarNameLevel110
  );

  // ── Warnings count (subset of passed) ────────────────────────────────
  // Max across warning-tier checks: low precision, high density, the
  // *non-critical* duplicate variants. Same caveat: union > max in reality.
  const warnings = Math.max(
    lowPrecision, highDensity, allExceptCode,
    nameEduLoc, eduLoc, nameLevel110, similarNameLevel110
  );

  // ── Donut percentages ────────────────────────────────────────────────
  const safeDenom = uploaded > 0 ? uploaded : 1;
  const rejPct = (rejected / safeDenom) * 100;
  const passPct = (passed / safeDenom) * 100;
  const warnPct = (warnings / safeDenom) * 100;

  const pctParen = (n: number) => `(${n.toFixed(1)}%)`;

  // ── Connectivity / Electricity / Education / Mapping ─────────────────
  const missConnectivity = failedCount(findCheck(missChecks, "is_null_optional", "connectivity_govt"));
  const missConnectivityType = failedCount(findCheck(missChecks, "is_null_optional", "connectivity_type"));
  const missComputer = failedCount(findCheck(missChecks, "is_null_optional", "computer_lab"));

  const connectivity = [
    { label: "Missing connectivity values", value: fmt(missConnectivity) },
    { label: "Connectivity type missing", value: fmt(missConnectivityType) },
  ];

  const electricity = [
    { label: "Missing computer availability data", value: missComputer > 0 ? fmt(missComputer) : "not in data" },
  ];

  // Education-level breakdown is not in the DQ summary; show n.d. unless
  // a caller passes explicit values in the future.
  const educationLevels = [
    { label: "Primary School", value: "n.d." },
    { label: "Secondary School", value: "n.d." },
    { label: "Combined School", value: "n.d." },
    { label: "Intermediate School", value: "n.d." },
    { label: "Early Childhood Development (ECD)", value: "n.d." },
    { label: "Special Needs", value: "n.d." },
  ];

  const fieldMapping = Array.isArray(data.fieldMapping) ? data.fieldMapping : [];

  const entity = data.entity ?? {
    plural: "Schools",
    lowerPlural: "schools",
    lowerSingular: "school",
  };

  return {
    country: data.country,
    uploadedFileName: data.uploadedFileName,
    uploadDate: data.uploadDate,
    uploadId: data.uploadId,
    entity,
    logoDataUri: await loadPdfLogoDataUri(),
    totals: {
      uploaded: fmt(uploaded),
      passed: fmt(passed),
      rejected: fmt(rejected),
      warnings: fmt(warnings),
      passedPctParen: pctParen(passPct),
      rejectedPctParen: pctParen(rejPct),
      warningsPctParen: pctParen(warnPct),
    },
    donut: {
      rejectedPct: rejPct.toFixed(4),
      passedPct: passPct.toFixed(4),
      warningsPct: warnPct.toFixed(4),
      rejectedComplementPct: (100 - rejPct).toFixed(4),
      warningsComplementPct: (100 - warnPct).toFixed(4),
      centerPct: passPct.toFixed(1),
    },
    basicChecks,
    duplicates: {
      totalLabel: fmt(dupTotal),
      page1Rows,
      page2Rows,
    },
    connectivity,
    electricity,
    educationLevels,
    fieldMapping,
    // Keep mapping on page 2 when it fits; move whole card (+ comment) to page 3 when long.
    fieldMappingOnPage3: fieldMapping.length > 4,
    fieldMappingCompact: fieldMapping.length > 6,
  };
}

export async function renderHtml(data: PDFReportData): Promise<string> {
  const template = loadTemplate();
  return template(await buildContext(data));
}

// Layout-pixel height of one ".page" wrapper inside the rendered HTML; used
// to split rects across PDF pages. Coordinate mapping rationale: Chrome's
// `format: "A4"` produces a 595x842-pt PDF page, the print viewport is laid
// out at 794x1123 CSS px (8.27x11.69 in × 96 px/in), so 1 CSS px = 0.75 pt.
// We then apply `scale: 4/3`, so 1 *layout* CSS px ≈ 1 PDF pt within a tenth
// of a percent — i.e. element rects collected via getBoundingClientRect can
// be reused as-is for AcroForm widget placement.
const LAYOUT_PAGE_HEIGHT_PX = 842;

type FieldRect = {
  name: string;
  pageIndex: number;
  x: number;
  y: number; // distance from top of its PDF page, in points
  width: number;
  height: number;
};

// Distance in points reserved for the footer at the bottom of each PDF page;
// rects that would land inside this band get clamped upward so the field
// never sits on top of (or below) the footer text.
const PAGE_FOOTER_RESERVE_PT = 36;

async function collectEditableFieldRects(
  page: import("puppeteer-core").Page
): Promise<FieldRect[]> {
  const raw = await page.evaluate((layoutPageH: number) => {
    const nodes = document.querySelectorAll<HTMLElement>(
      "[data-action-field]"
    );
    return Array.from(nodes).map((el) => {
      const r = el.getBoundingClientRect();
      const pageIndex = Math.floor(r.top / layoutPageH);
      return {
        name: el.dataset.actionField ?? "",
        pageIndex,
        x: r.left,
        y: r.top - pageIndex * layoutPageH,
        width: r.width,
        height: r.height,
      };
    });
  }, LAYOUT_PAGE_HEIGHT_PX);

  // Some "Recommended action" boxes live inside a `.grow-card` and Chrome
  // happily lets them overflow past the 842 px page wrapper (the wrapper
  // clips with overflow:hidden so the user never sees this). For the form
  // field overlay we need on-page rects, so we clamp every rect to stay
  // within the page minus a footer reserve, and we GUARANTEE a minimum
  // usable height so even a stuffed page still ships an editable field.
  const MIN_HEIGHT_PT = 18;
  return raw.map((r) => {
    const safeBottom = LAYOUT_PAGE_HEIGHT_PX - PAGE_FOOTER_RESERVE_PT;
    let y = r.y;
    let height = r.height;
    if (y + height > safeBottom) {
      // Box extends below the footer line: shrink height first.
      height = Math.max(0, safeBottom - y);
    }
    if (height < MIN_HEIGHT_PT) {
      // Still too small (or rect collapsed) — push the top upward so we
      // can fit MIN_HEIGHT_PT of clickable area within the safe area.
      height = MIN_HEIGHT_PT;
      y = Math.max(0, safeBottom - height);
    }
    return { ...r, y, height };
  });
}

async function overlayFormFields(
  pdfBytes: Uint8Array,
  rects: FieldRect[]
): Promise<Uint8Array> {
  if (rects.length === 0) return pdfBytes;

  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);

  const pages = doc.getPages();

  // Match the static HTML's #eaf2ff blue and a soft slate edge so the field
  // looks identical to the surrounding card styling.
  const FILL = rgb(0.918, 0.949, 1); // #eaf2ff
  const STROKE = rgb(0.847, 0.890, 0.961); // #d8e3f5

  for (const r of rects) {
    if (r.pageIndex < 0 || r.pageIndex >= pages.length) continue;
    // collectEditableFieldRects guarantees a positive minimum height, but
    // skip degenerate rects just in case the source HTML drops a node.
    if (r.height < 4 || r.width < 4) continue;

    const pdfPage = pages[r.pageIndex];
    const pageH = pdfPage.getHeight();

    // PDF y-axis is bottom-up; r.y is the distance from the top of the page
    // in CSS px ≈ points (see scale rationale above). Flip it for pdf-lib.
    const pdfY = pageH - r.y - r.height;

    // Ensure each field name is unique in the document (pdf-lib would
    // otherwise treat repeated names as one field, syncing values).
    const fieldName = `${r.name}_p${r.pageIndex + 1}`;

    const field = form.createTextField(fieldName);
    field.enableMultiline();
    field.addToPage(pdfPage, {
      x: r.x,
      y: pdfY,
      width: r.width,
      height: r.height,
      // Bake the appearance into the widget so viewers that don't render
      // AcroForms (or rasterizers like pdftoppm in tests) still draw the
      // same light-blue rectangle the static mockup expected, and viewers
      // that DO render AcroForms hit click and start typing.
      backgroundColor: FILL,
      borderColor: STROKE,
      borderWidth: 0.5,
      font: helvetica,
    });
    // Pin the typed-text size at 8 pt. We write /DA directly because
    // PDFTextField.setFontSize requires a pre-existing /DA on the field
    // object (not just on its widget) and pdf-lib doesn't reliably wire one
    // up via addToPage. The DA string is `/<font> <size> Tf <gray> g` —
    // 0 g = black ink. The font name "Helv" matches the resource we add
    // via the embedFont call above (pdf-lib aliases Helvetica to /Helv).
    field.acroField.dict.set(
      PDFName.of("DA"),
      PDFString.of("/Helv 8 Tf 0 g")
    );
    field.setText("");
    // Regenerate the /AP stream so the widget's stored appearance reflects
    // our colour choices + the 8-pt font size in viewers that prefer cached
    // appearances over dynamic NeedAppearances re-rendering.
    field.updateAppearances(helvetica);
  }

  // Marking NeedAppearances tells well-behaved viewers (Adobe, Chrome's PDF
  // viewer) to repaint the field on open if our appearance ever drifts from
  // the field's actual value (e.g. after a fill-and-save round trip).
  form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.True);

  return doc.save({ useObjectStreams: false });
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
    // The template designs each page at 595x842 CSS px (the dimensions used
    // by the source mockup). Chrome maps 1 CSS px = 1/96 in, so 595 px only
    // fills 158 mm — 75% of A4. Scale 4/3 makes 595 px == 210 mm == A4 width
    // (and 842 px == 297 mm == A4 height) so the layout fills the page edge
    // to edge with no whitespace bias to one side.
    //
    // We grab the rect of every "Recommended action" box in CSS px BEFORE
    // printing so we can overlay real AcroForm text fields on top of those
    // boxes — Chrome's page.pdf() flattens HTML <input>/<textarea> to glyphs
    // so the only way to ship truly editable PDF fields is to post-process.
    const fieldRects = await collectEditableFieldRects(page);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale: 4 / 3,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    const withForms = await overlayFormFields(pdf, fieldRects);
    return Buffer.from(withForms);
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
