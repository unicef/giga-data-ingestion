import { Html, Head, Body, Container, Section, Text, Img, Hr } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityReportEmailProps } from "../types/dq-report";

const DqReportDetailedPDF = ({
  dataQualityCheck,
  dataset,
  uploadDate,
  uploadId,
  country,
}: DataQualityReportEmailProps) => {
  const summary = dataQualityCheck?.["summary"];
  const allCheckKeys = Object.keys(dataQualityCheck || {}).filter(
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

  const beautifyTitle = (key: string) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const renderCheckTable = (checkKey: string) => {
    const checkData = (dataQualityCheck as any)?.[checkKey];
    if (!checkData || !Array.isArray(checkData) || checkData.length === 0) return null;

    return (
      <Section key={checkKey} style={{ marginBottom: "24px" }}>
        <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
          {beautifyTitle(checkKey)}
        </Text>
        <table>
          <tbody>
            {checkData.map((check: any, idx: number) => (
              <tr key={idx}>
                <td style={{ fontWeight: "500" }}>{check.description || check.assertion || "Unknown Check"}</td>
                <td style={{ textAlign: "right" }}>{formatNumber(check.count_failed || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {checkData.some((c: any) => (c.percent_failed || 0) > 0) && (
          <Text style={{ fontSize: "12px", color: "#666", marginTop: "8px", fontStyle: "italic" }}>
            Comment: Review the schools that did not pass these checks. Correct them before uploading.
          </Text>
        )}
      </Section>
    );
  };

  // Helper function to get check data by description pattern
  const getCheckDataByDescription = (pattern: RegExp) => {
    const results: any[] = [];
    allCheckKeys.forEach(key => {
      const checkData = (dataQualityCheck as any)?.[key];
      if (Array.isArray(checkData)) {
        checkData.forEach((check: any) => {
          if (pattern.test(check.description || check.assertion || '')) {
            results.push({
              ...check,
              sectionKey: key
            });
          }
        });
      }
    });
    return results;
  };

  // Get real data from actual checks
  const locationQualityChecks = getCheckDataByDescription(/lat|long|boundary|precision|location/i);
  const educationLevelChecks = getCheckDataByDescription(/primary|secondary|combined|intermediate|ecd|special|education/i);
  const schoolIdChecks = getCheckDataByDescription(/duplicate.*id|missing.*id|school.*name/i);
  const connectivityChecks = getCheckDataByDescription(/internet|connectivity|availability/i);
  const computerChecks = getCheckDataByDescription(/computer|availability/i);
  const densityChecks = getCheckDataByDescription(/density|duplicate|duplication|same.*name|same.*education/i);

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
                    Giga Sync
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

            {/* Page 1 additional sections (two-column layout) */}
            <Section>
              <table style={{ width: "100%", border: "none", borderCollapse: "collapse" }}>
                <tr>
                  <td style={{ width: "50%", verticalAlign: "top", border: "none", paddingRight: "12px" }}>
                    {/* Location Quality Section */}
                    {locationQualityChecks.length > 0 && (
                      <Section style={{ marginBottom: "24px" }}>
                  <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                          Location Quality
                  </Text>
                  <table>
                    <tbody>
                            {locationQualityChecks.map((check, idx) => (
                        <tr key={idx}>
                                <td style={{ fontWeight: "500" }}>{check.description || check.assertion}</td>
                          <td style={{ textAlign: "right" }}>{formatNumber(check.count_failed || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    <Text style={{ fontSize: "12px", color: "#666", marginTop: "8px", fontStyle: "italic" }}>
                          Comment: Review outside boundary schools. Correct low-precision lat/longs.
                    </Text>
                      </Section>
                    )}

                    {/* Education Level Data Section */}
                    {educationLevelChecks.length > 0 && (
                      <Section style={{ marginBottom: "24px" }}>
                        <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                          Education Level Data
                        </Text>
                        <table>
                          <tbody>
                            {educationLevelChecks.map((check, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: "500" }}>{check.description || check.assertion}</td>
                                <td style={{ textAlign: "right" }}>{formatNumber(check.count_failed || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <Text style={{ fontSize: "12px", color: "#999", marginTop: "8px", fontStyle: "italic" }}>
                          Comment:
                        </Text>
                      </Section>
                    )}
                  </td>
                  <td style={{ width: "50%", verticalAlign: "top", border: "none", paddingLeft: "12px" }}>
                    {/* School ID Checks Section */}
                    {schoolIdChecks.length > 0 && (
                      <Section style={{ marginBottom: "24px" }}>
                        <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                          School ID Checks
                        </Text>
                        <table>
                          <tbody>
                            {schoolIdChecks.map((check, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: "500" }}>{check.description || check.assertion}</td>
                                <td style={{ textAlign: "right" }}>{formatNumber(check.count_failed || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <Text style={{ fontSize: "12px", color: "#999", marginTop: "8px", fontStyle: "italic" }}>
                          Comment:
                        </Text>
                      </Section>
                    )}
                  </td>
                </tr>
              </table>
            </Section>

            <Hr style={{ margin: "32px 0", borderColor: "#e5e7eb" }} />

            {/* Footer with page number */}
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
                01
              </Text>
            </Section>

            {/* Page break to second page */}
            <div className="page-break" />

            {/* Page 2 */}
            {/* Connectivity and Computer Availability side-by-side */}
            <Section>
              <table style={{ width: "100%", border: "none", borderCollapse: "collapse", marginTop: "8px" }}>
                <tr>
                  <td style={{ width: "50%", verticalAlign: "top", border: "none", paddingRight: "12px" }}>
                    {/* Connectivity Data Section */}
                    {connectivityChecks.length > 0 && (
                      <Section style={{ marginBottom: "24px" }}>
                        <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                          Connectivity Data
                        </Text>
                        <table>
                          <tbody>
                            {connectivityChecks.map((check, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: "500" }}>{check.description || check.assertion}</td>
                                <td style={{ textAlign: "right" }}>{formatNumber(check.count_failed || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <Text style={{ fontSize: "12px", color: "#666", marginTop: "8px", fontStyle: "italic" }}>
                          Comment: Review outside boundary schools, Correct low-precision lat/longs.
                        </Text>
                      </Section>
                    )}
                  </td>
                  <td style={{ width: "50%", verticalAlign: "top", border: "none", paddingLeft: "12px" }}>
                    {/* Computer Availability Section */}
                    {computerChecks.length > 0 && (
                      <Section style={{ marginBottom: "24px" }}>
                        <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                          Computer Availability
                        </Text>
                        <table>
                          <tbody>
                            {computerChecks.map((check, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: "500" }}>{check.description || check.assertion}</td>
                                <td style={{ textAlign: "right" }}>{formatNumber(check.count_failed || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <Text style={{ fontSize: "12px", color: "#999", marginTop: "8px", fontStyle: "italic" }}>
                          Comment:
                        </Text>
                      </Section>
                    )}
                  </td>
                </tr>
              </table>
            </Section>

            {/* Density & Duplication Checks */}
            {densityChecks.length > 0 && (
              <Section>
                <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                  Density & Duplication Checks
                </Text>
                <table>
                  <tbody>
                    {densityChecks.map((check, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: "500" }}>{check.description || check.assertion}</td>
                        <td style={{ textAlign: "right" }}>{formatNumber(check.count_failed || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Text style={{ fontSize: "12px", color: "#999", marginTop: "8px", fontStyle: "italic" }}>
                  Comment:
                </Text>
              </Section>
            )}

            {/* Next Steps */}
            <Section style={{ marginTop: "24px" }}>
              <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>Next Steps:</Text>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", height: "96px" }} />
              <Text style={{ fontSize: "12px", color: "#999", marginTop: "6px" }}>Comment:</Text>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", height: "64px" }} />
                </Section>

            <Hr style={{ margin: "32px 0", borderColor: "#e5e7eb" }} />

            {/* Footer page 2 */}
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
                02
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DqReportDetailedPDF;
