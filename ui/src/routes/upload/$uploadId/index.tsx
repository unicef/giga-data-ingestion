import { useMemo } from "react";

import { Download } from "@carbon/icons-react";
import { Button, Tab, TabList, TabPanel, TabPanels, Tabs } from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import DataQualityChecks from "@/components/check-file-uploads/ColumnChecks";
import { useDownloadHelpers } from "@/components/check-file-uploads/Downloadlogic";
import { ErrorComponent } from "@/components/common/ErrorComponent";
import { PendingComponent } from "@/components/common/PendingComponent";
import { Check } from "@/types/upload";
import {
  DataQualityCheck,
  UploadResponse,
  initialDataQualityCheck,
  initialUploadResponse,
} from "@/types/upload";
import { commaNumber } from "@/utils/number";

export const Route = createFileRoute("/upload/$uploadId/")({
  component: Index,
  loader: ({ context: { queryClient }, params: { uploadId } }) =>
    Promise.all([
      queryClient.ensureQueryData({
        queryKey: ["dq_check", uploadId],
        queryFn: () => api.uploads.get_data_quality_check(uploadId),
      }),
      queryClient.ensureQueryData({
        queryKey: ["upload", uploadId],
        queryFn: () => api.uploads.get_upload(uploadId),
      }),
    ]),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function Index() {
  const { uploadId } = Route.useParams();

  const { data: dqResultQuery } = useSuspenseQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => api.uploads.get_data_quality_check(uploadId),
  });

  const dqResultData = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const { data: uploadQuery } = useSuspenseQuery({
    queryKey: ["upload", uploadId],
    queryFn: () => api.uploads.get_upload(uploadId),
  });

  const uploadData = useMemo<UploadResponse>(
    () => uploadQuery?.data ?? initialUploadResponse,
    [uploadQuery],
  );

  const summaryStats = dqResultData.dq_summary.summary || {};
  const {
    rows = 0,
    rows_passed: rowsPassed = 0,
    rows_failed: rowsFailed = 0,
  } = summaryStats;

  const {
    handleDownloadFailedRows,
    handleDownloadPassedRows,
    handleDownloadDqSummary,
    handleDownloadRawFile,
  } = useDownloadHelpers(uploadData);

  // Extract checks from dqResultData
  const {
    summary: _summaryStats,
    critical_error_check: _critical_error_check = [],
    ...checks
  } = dqResultData.dq_summary;

  // Common card styles
  const cardStyle = {
    flex: 1,
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    padding: "1.5rem",
    background: "#fff",
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
  };

  const cardHeaderStyle = {
    fontSize: "0.875rem",
    fontWeight: 600,
    marginBottom: "1rem",
  };

  const cardValueStyle = {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "1rem",
  };

  const cardButtonContainerStyle = {
    marginTop: "auto",
  };

  return (
    <div style={{ background: "#f4f4f4", padding: "2rem", minHeight: "100vh" }}>
      <div>
        <div
          style={{
            marginBottom: "2rem",
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              File: <a className="bx--link">{uploadData.original_filename}</a>
            </p>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#6f6f6f",
                marginBottom: "1rem",
              }}
            >
              {uploadData.mode && <>Upload type: {uploadData.mode}</>}
              <br />
              Uploaded: {uploadData.uploader_email}
              <br />
              UploadID: {uploadId}
              <br />
              {new Date(uploadData.created).toLocaleTimeString()} GMT
              <br />
              {new Date(uploadData.created).toDateString()}
            </p>
          </div>

          <div>
            <Button
              kind="primary"
              size="md"
              renderIcon={Download}
              onClick={handleDownloadDqSummary}
            >
              Download data quality report
            </Button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            alignItems: "stretch", // Ensures all cards have the same height
          }}
        >
          <div style={cardStyle}>
            <h5 style={cardHeaderStyle}>Total Schools Uploaded</h5>
            <p style={cardValueStyle}>{commaNumber(rows)}</p>
            <div style={cardButtonContainerStyle}>
              <Button
                kind="primary"
                size="sm"
                renderIcon={Download}
                disabled={rows === 0}
                onClick={handleDownloadRawFile}
              >
                Download uploaded dataset
              </Button>
            </div>
          </div>

          <div style={cardStyle}>
            <h5 style={cardHeaderStyle}>Total Schools Passed</h5>
            <p style={cardValueStyle}>{commaNumber(rowsPassed)}</p>
            <div style={cardButtonContainerStyle}>
              <Button
                kind="primary"
                size="sm"
                renderIcon={Download}
                disabled={rowsPassed === 0}
                onClick={handleDownloadPassedRows}
              >
                Download Passed Schools
              </Button>
            </div>
          </div>

          <div style={cardStyle}>
            <h5 style={cardHeaderStyle}>Total Schools Rejected</h5>
            <p style={cardValueStyle}>{commaNumber(rowsFailed)}</p>
            <div style={cardButtonContainerStyle}>
              <Button
                kind="primary"
                size="sm"
                renderIcon={Download}
                disabled={rowsFailed === 0}
                onClick={handleDownloadFailedRows}
              >
                Download Rejected Schools
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{ background: "#fff", padding: "1.5rem", borderRadius: "4px" }}
      >
        <Tabs>
          <TabList
            aria-label="Check Types"
            className="mb-4"
            style={{ overflowX: "auto" }}
          >
            {Object.keys(checks).map(key => (
              <Tab key={key}>{key.replace(/_/g, " ")}</Tab>
            ))}
          </TabList>

          <TabPanels>
            {Object.keys(checks).map(key => (
              <TabPanel key={key}>
                <DataQualityChecks
                  data={checks[key] as Check[]}
                  previewData={dqResultData.dq_failed_rows_first_five_rows}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}

export default Index;
