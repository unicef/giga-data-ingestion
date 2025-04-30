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

  const {
    summary: _summaryStats,
    critical_error_check: _critical_error_check = [],
    ...checks
  } = dqResultData.dq_summary;

  const {
    handleDownloadFailedRows,
    handleDownloadPassedRows,
    handleDownloadDqSummary,
  } = useDownloadHelpers(uploadData);

  return (
    <>
      <div
        style={{ background: "#f4f4f4", padding: "2rem", minHeight: "100vh" }}
      >
        <div>
          <div
            style={{
              marginBottom: "2rem",
              background: "#fff",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              File: <a className="bx--link">{uploadData.original_filename}</a>
            </p>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#6f6f6f",
                marginBottom: "2rem",
              }}
            >
              Uploaded: {uploadData.uploader_email}
              <br />
              {new Date(uploadData.created).toLocaleTimeString()} GMT
              <br />
              {new Date(uploadData.created).toDateString()}
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <div
              style={{
                flex: 1,
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                padding: "1rem",
                display: "flex",
                background: "#fff",
                flexDirection: "column",
              }}
            >
              <h5 style={{ marginBottom: "0.5rem" }}>Total Schools Uploaded</h5>
              <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>100</p>
              <Button
                kind="primary"
                size="sm"
                renderIcon={Download}
                onClick={handleDownloadDqSummary}
              >
                Download Summary
              </Button>
            </div>

            <div
              style={{
                flex: 1,
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                padding: "1rem",
                display: "flex",
                background: "#fff",
                flexDirection: "column",
              }}
            >
              <h5 style={{ marginBottom: "0.5rem" }}>Total Schools Passed</h5>
              <div style={{ marginBottom: "0.5rem" }}>
                <p>
                  With Success: <strong>100</strong>
                </p>
              </div>
              <Button
                kind="primary"
                size="sm"
                renderIcon={Download}
                onClick={handleDownloadPassedRows}
              >
                Download Passed Schools
              </Button>
            </div>

            <div
              style={{
                flex: 1,
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                padding: "1rem",
                display: "flex",
                background: "#fff",
                flexDirection: "column",
              }}
            >
              <h5 style={{ marginBottom: "0.5rem" }}>Total Schools Rejected</h5>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                1
              </p>
              <Button
                kind="primary"
                size="sm"
                renderIcon={Download}
                onClick={handleDownloadFailedRows}
              >
                Download Rejected Schools
              </Button>
            </div>
          </div>
        </div>
        <div
          style={{ background: "#fff", padding: "1rem", borderRadius: "4px" }}
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
    </>
  );
}

export default Index;
