import { Html, Head, Body, Container, Section, Text, Img, Hr } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityReportEmailProps } from "../types/dq-report";

const DqReportPDF = ({
  dataQualityCheck,
  dataset,
  uploadDate,
  uploadId,
  country,
}: DataQualityReportEmailProps) => {
  const summary = dataQualityCheck?.["summary"];
  const checks = Object.keys(dataQualityCheck || {}).filter(
    (key) => key !== "summary" && key !== "critical_error_check"
  );

  const formatNumber = (num: number) => {
    return num?.toLocaleString() || "0";
  };

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  const getStatusColor = (percentFailed: number) => {
    if (percentFailed === 0) return "#10b981"; // green
    if (percentFailed < 0.1) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head>
          <style>{`
            @page {
              margin: 40px;
              size: A4;
            }
            body {
              font-family: 'Open Sans', Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 600;
            }
            .page-break {
              page-break-after: always;
            }
          `}</style>
        </Head>
        <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
          <Container style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            {/* Header */}
            <Section style={{ marginBottom: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
                <tr>
                  <td style={{ textAlign: "left", fontSize: "14px", color: "#666", border: "none" }}>
                    Data Sync
                  </td>
                  <td style={{ textAlign: "right", fontSize: "14px", color: "#666", border: "none" }}>
                    giga.global
                  </td>
                </tr>
              </table>
            </Section>

            {/* Title */}
            <Section style={{ marginBottom: "24px" }}>
              <Text style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0" }}>
                Data Quality Report - {country}
              </Text>
              <Text style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}>
                Generated on: {new Date().toLocaleString()}
              </Text>
              <Text style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}>
                Uploaded file: {dataset}, upload_id: {uploadId}
              </Text>
            </Section>

            {/* File Overview */}
            <Section style={{ marginBottom: "24px" }}>
              <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                File Overview
              </Text>
              <table>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: "500" }}>Count Of Schools In Uploaded File</td>
                    <td style={{ textAlign: "right" }}>{formatNumber(summary?.rows || 0)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "500" }}>Count Of Schools That Passed Checks</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>
                      {formatNumber((summary?.rows || 0) - (dataQualityCheck?.["critical_error_check"]?.[0]?.count_failed || 0))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "500" }}>Count Of Schools That Failed The Critical Checks</td>
                    <td style={{ textAlign: "right", color: "#ef4444" }}>
                      {formatNumber(dataQualityCheck?.["critical_error_check"]?.[0]?.count_failed || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
              {(dataQualityCheck?.["critical_error_check"]?.[0]?.count_failed || 0) > 0 && (
                <Text style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px", fontStyle: "italic" }}>
                  Comment: Dropped schools = {formatNumber(dataQualityCheck?.["critical_error_check"]?.[0]?.count_failed || 0)} schools did not pass validation
                </Text>
              )}
            </Section>

            {/* View Report Section */}
            <Section style={{ marginBottom: "24px" }}>
              <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                View Complete Report
              </Text>
              <Text style={{ fontSize: "14px", marginBottom: "8px" }}>
                For detailed analysis of all data quality checks, visit the Giga Sync portal:
              </Text>
              <Text style={{ fontSize: "14px", color: "#2563eb", textDecoration: "underline" }}>
                {process.env.WEB_APP_REDIRECT_URI || "https://gigasync.org"}/upload/{uploadId}
              </Text>
            </Section>

            <Hr style={{ margin: "32px 0", borderColor: "#e5e7eb" }} />

            {/* Footer */}
            <Section>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
                <tr>
                  <td style={{ textAlign: "center", padding: "0 10px", border: "none" }}>
                    <Img
                      src="https://saunigigashare.blob.core.windows.net/assets/GIGA_logo_blue.png"
                      alt="Giga"
                      width="80"
                      height="auto"
                    />
                  </td>
                  <td style={{ textAlign: "center", padding: "0 10px", border: "none" }}>
                    <Img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/UNICEF_Logo.svg/200px-UNICEF_Logo.svg.png"
                      alt="UNICEF"
                      width="80"
                      height="auto"
                    />
                  </td>
                  <td style={{ textAlign: "center", padding: "0 10px", border: "none" }}>
                    <Img
                      src="https://www.itu.int/en/ITU-D/Regional-Presence/AsiaPacific/PublishingImages/ITU%20Logo.png"
                      alt="ITU"
                      width="80"
                      height="auto"
                    />
                  </td>
                </tr>
              </table>
              <Text style={{ textAlign: "center", fontSize: "10px", color: "#999", marginTop: "16px" }}>
                This report was generated automatically by the Giga Data Ingestion Portal
              </Text>
              <Text style={{ textAlign: "center", fontSize: "10px", color: "#999", margin: "4px 0" }}>
                Page 1 of 2
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DqReportPDF;
