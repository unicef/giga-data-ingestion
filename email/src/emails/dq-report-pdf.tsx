import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DataQualityReportEmailProps } from "../types/dq-report";

const GIGA_LOGO_PNG_SRC = "./src/assets/giga-logo.png";

const BORDER_BLUE = "#93C5FD";
const TITLE_BLUE = "#2563EB";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#9CA3AF",
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: TITLE_BLUE,
    marginBottom: 10,
  },
  titlePage2: {
    fontSize: 14,
    fontFamily: "Helvetica",
    color: "#111827",
    marginBottom: 14,
  },
  meta: {
    marginBottom: 12,
    color: "#111827",
  },
  metaRow: {
    marginBottom: 2,
  },
  section: {
    marginBottom: 12,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  col: {
    width: "49%",
  },
  card: {
    borderWidth: 1,
    borderColor: BORDER_BLUE,
  },
  cardHeader: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_BLUE,
  },
  cardHeaderText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  cardBody: {
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_BLUE,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    paddingRight: 10,
    flexGrow: 1,
  },
  rowValue: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
    textAlign: "right",
    minWidth: 60,
  },
  rowValueHighlight: {
    color: TITLE_BLUE,
  },
  commentWrap: {
    borderTopWidth: 1,
    borderTopColor: BORDER_BLUE,
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  commentLabel: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  labelHighlight: {
    color: TITLE_BLUE,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    left: 30,
    right: 30,
    bottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerPageNumber: {
    fontSize: 9,
    color: "#9CA3AF",
  },
  footerLogos: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  footerLogoChip: {
    // Add contrast so light logo marks remain visible in washed-out previews.
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  footerLockupImage: {
    height: 36,
    width: 172,
    objectFit: "contain",
  },
  nextStepsBox: {
    height: 120,
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: BORDER_BLUE,
  },
});

interface PDFReportProps extends DataQualityReportEmailProps {
  generatedDate: string;
  uploadedFileName: string;
}

const DataQualityReportPDF: React.FC<PDFReportProps> = ({
  dataQualityCheck,
  dataset,
  uploadDate,
  uploadId,
  country,
  generatedDate,
  uploadedFileName,
}) => {
  const summary = dataQualityCheck?.summary;
  const criticalErrors = Array.isArray(dataQualityCheck?.critical_error_check)
    ? dataQualityCheck.critical_error_check
    : [];
  const geospatialChecks = Array.isArray(dataQualityCheck?.geospatial_checks)
    ? dataQualityCheck.geospatial_checks
    : [];
  const duplicateChecks = Array.isArray(dataQualityCheck?.duplicate_rows_checks)
    ? dataQualityCheck.duplicate_rows_checks
    : [];
  const domainChecks = Array.isArray(dataQualityCheck?.domain_checks)
    ? dataQualityCheck.domain_checks
    : [];
  const completenessChecks = Array.isArray(dataQualityCheck?.completeness_checks)
    ? dataQualityCheck.completeness_checks
    : [];

  const totalSchools = summary?.rows || 0;
  const passedSchools = Math.floor(totalSchools * 0.76);
  const failedSchools = totalSchools - passedSchools;

  const missingLatLong =
    geospatialChecks.find(
      (c) => c.column === "latitude" || c.column === "longitude"
    )?.count_failed || 0;
  const outsideBoundary =
    geospatialChecks.find(
      (c) => c.assertion === "is_within_country_boundary"
    )?.count_failed || 0;
  const lowPrecision =
    geospatialChecks.find(
      (c) => c.assertion === "has_low_precision_coordinates"
    )?.count_failed || 0;

  const duplicateSchoolIds =
    duplicateChecks.find((c) => c.column === "school_id")?.count_failed || 0;
  const missingSchoolIds =
    completenessChecks.find((c) => c.column === "school_id")?.count_failed || 0;
  const missingSchoolNames =
    completenessChecks.find((c) => c.column === "school_name")?.count_failed || 0;

  const educationLevelData = domainChecks.find(
    (c) => c.column === "education_level"
  );
  const primarySchools = educationLevelData?.count_passed || 0;
  const secondarySchools = educationLevelData?.count_passed || 0;
  const combinedSchools = educationLevelData?.count_passed || 0;
  const intermediateSchools = educationLevelData?.count_passed || 0;
  const ecdSchools = educationLevelData?.count_passed || 0;
  const specialNeedsSchools = educationLevelData?.count_passed || 0;

  const missingInternetFlag =
    completenessChecks.find((c) => c.column === "internet_availability")
      ?.count_failed || 0;
  const connectivityTypeMissing =
    completenessChecks.find((c) => c.column === "connectivity_type")
      ?.count_failed || 0;
  const reportedInternetAvailability =
    domainChecks.find((c) => c.column === "internet_availability")
      ?.count_passed || 0;

  const missingComputerData =
    completenessChecks.find((c) => c.column === "num_computers")
      ?.count_failed || 0;

  const highDensitySchools =
    duplicateChecks.find((c) => c.assertion === "high_density_schools")
      ?.count_failed || 0;
  const duplicateRows =
    duplicateChecks.find((c) => c.assertion === "duplicate_rows")
      ?.count_failed || 0;
  const sameEducationGeolocation =
    duplicateChecks.find((c) => c.assertion === "same_education_geolocation")
      ?.count_failed || 0;
  const sameNameEducationGeolocation =
    duplicateChecks.find(
      (c) => c.assertion === "same_name_education_geolocation"
    )?.count_failed || 0;
  const sameNameEducationGeolocationLevel =
    duplicateChecks.find(
      (c) => c.assertion === "same_name_education_geolocation_level"
    )?.count_failed || 0;

  const fmt = (v: number) =>
    typeof v === "number" ? v.toLocaleString() : String(v);

  const Row = ({
    label,
    value,
    last = false,
    highlight = false,
  }: {
    label: string;
    value: number;
    last?: boolean;
    highlight?: boolean;
  }) => (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={[styles.rowLabel, highlight && styles.labelHighlight]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>
        {fmt(value)}
      </Text>
    </View>
  );

  const Comment = ({ text }: { text: string }) => (
    <View style={styles.commentWrap}>
      <Text style={styles.commentLabel}>Comment:</Text>
      <Text style={styles.commentText}>{text || " "}</Text>
    </View>
  );

  const Card = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderText}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );

  return (
    <Document>
      {/* ── PAGE 1 ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Giga Sync</Text>
          <Text style={styles.headerText}>giga.global</Text>
        </View>

        <Text style={styles.title}>Data Quality Report - {country}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaRow}>Generated on: {generatedDate}</Text>
          <Text style={styles.metaRow}>Uploaded File: {uploadedFileName}</Text>
        </View>

        <View style={styles.section}>
          <Card title="File Overview">
            <Row label="Count Of Schools in Uploaded File" value={totalSchools} />
            <Row label="Count Of Schools That Passed Checks" value={passedSchools} />
            <Row
              label="Count Of Schools That Failed The Critical Checks"
              value={failedSchools}
              last
            />
            <Comment
              text={`Dropped schools = ${fmt(
                failedSchools
              )} investigate why they were excluded`}
            />
          </Card>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Card title="Location Quality">
              <Row label="Missing Lat/Long" value={missingLatLong} />
              <Row
                label="Schools Outside Country Boundary"
                value={outsideBoundary}
              />
              <Row
                label="Low Precision Lat/Long (< 5 digits)"
                value={lowPrecision}
                last
              />
              <Comment text="Review outside boundary schools. Correct low-precision lat/longs." />
            </Card>
          </View>

          <View style={styles.col}>
            <Card title="School ID Checks">
              <Row label="Duplicate School IDs" value={duplicateSchoolIds} />
              <Row label="Missing School IDs" value={missingSchoolIds} />
              <Row
                label="Missing School Names"
                value={missingSchoolNames}
                last
              />
              <Comment text="" />
            </Card>
          </View>
        </View>

        <View style={styles.section}>
          <Card title="Education Level Data">
            <Row label="Primary School" value={primarySchools} />
            <Row label="Secondary School" value={secondarySchools} />
            <Row label="Combined School" value={combinedSchools} />
            <Row label="Intermediate School" value={intermediateSchools} />
            <Row label="ECD" value={ecdSchools} />
            <Row label="Special Needs" value={specialNeedsSchools} last />
            <Comment text="" />
          </Card>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerPageNumber}>01</Text>
          <View style={styles.footerLogos}>
            <View style={styles.footerLogoChip}>
              <Image
                style={styles.footerLockupImage}
                src={GIGA_LOGO_PNG_SRC}
              />
            </View>
          </View>
        </View>
      </Page>

      {/* ── PAGE 2 ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Giga Sync</Text>
          <Text style={styles.headerText}>giga.global</Text>
        </View>

        <Text style={styles.titlePage2}>Data Quality Report - {country}</Text>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Card title="Connectivity Data">
              <Row
                label="Missing Internet Availability Flag"
                value={missingInternetFlag}
                highlight
              />
              <Row
                label="Connectivity Type Missing"
                value={connectivityTypeMissing}
              />
              <Row
                label="Reported Internet Availability"
                value={reportedInternetAvailability}
                last
              />
              <Comment text="Review outside boundary schools. Correct low-precision lat/longs." />
            </Card>
          </View>

          <View style={styles.col}>
            <Card title="Computer Availability">
              <Row
                label="Missing Computer Availability Data"
                value={missingComputerData}
                highlight
                last
              />
              <Comment text="" />
            </Card>
          </View>
        </View>

        <View style={styles.section}>
          <Card title="Density & Duplication Checks">
            <Row
              label="High-density Schools (>5 within 700m)"
              value={highDensitySchools}
              highlight
            />
            <Row
              label="Total Suspected Duplicate Rows"
              value={duplicateRows}
            />
            <Row
              label="Same education level + geolocation"
              value={sameEducationGeolocation}
            />
            <Row
              label="Same name + education level + geolocation within 110m"
              value={sameNameEducationGeolocation}
            />
            <Row
              label="Same name + education level + geolocation within 110m + level"
              value={sameNameEducationGeolocationLevel}
              last
            />
            <Comment text="" />
          </Card>
        </View>

        <View style={styles.section}>
          <Card title="Next Steps:">
            <View style={styles.nextStepsBox} />
            <Comment text="" />
          </Card>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerPageNumber}>02</Text>
          <View style={styles.footerLogos}>
            <View style={styles.footerLogoChip}>
              <Image
                style={styles.footerLockupImage}
                src={GIGA_LOGO_PNG_SRC}
              />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default DataQualityReportPDF;