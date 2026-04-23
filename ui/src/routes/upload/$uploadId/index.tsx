import { useMemo } from "react";

import { Download, Renew } from "@carbon/icons-react";
import {
  Button,
  InlineLoading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
} from "@carbon/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import DataQualityChecks from "@/components/check-file-uploads/ColumnChecks";
import { useDownloadHelpers } from "@/components/check-file-uploads/Downloadlogic";
import { ErrorComponent } from "@/components/common/ErrorComponent";
import { PendingComponent } from "@/components/common/PendingComponent";
import {
  DQStatus,
  DQStatusTagMapping,
  DataQualityCheck,
  UploadResponse,
  initialDataQualityCheck,
  initialUploadResponse,
} from "@/types/upload";
import { Check } from "@/types/upload";
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

  const { data: dqResultQuery, refetch: refetchDQ } = useSuspenseQuery({
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

  const { mutateAsync: runDQ, isPending: isDQRunning } = useMutation({
    mutationFn: ({
      uploadId: id,
      mode,
    }: {
      uploadId: string;
      mode: "uploaded" | "master";
    }) => api.uploads.dq_run(id, mode),
    onSuccess: () => {
      void refetchDQ();
    },
  });

  const handleRunDQ = async (mode: "uploaded" | "master") => {
    try {
      await runDQ({ uploadId, mode });
    } catch (e) {
      console.error("Failed to run DQ", e);
    }
  };

  // Check if DQ results are available (dq_summary can be null when DQ is in progress)
  const isDQReady =
    dqResultData.status === DQStatus.COMPLETED &&
    dqResultData.dq_summary != null;

  const summaryStats = isDQReady ? dqResultData.dq_summary.summary || {} : {};
  const {
    rows = 0,
    rows_passed: rowsPassed = 0,
    rows_failed: rowsFailed = 0,
  } = summaryStats as {
    rows?: number;
    rows_passed?: number;
    rows_failed?: number;
  };

  const {
    handleDownloadFailedRows,
    handleDownloadPassedRows,
    handleDownloadDqSummary,
    handleDownloadRawFile,
  } = useDownloadHelpers(uploadData);

  // Extract checks from dqResultData only when ready
  const checks = useMemo(() => {
    if (!isDQReady) return {};
    const {
      summary: _summaryStats,
      critical_error_check: _critical_error_check = [],
      ...rest
    } = dqResultData.dq_summary;
    return rest;
  }, [isDQReady, dqResultData]);

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

  const statusTagType = DQStatusTagMapping[dqResultData.status] ?? "gray";

  return (
    <div style={{ background: "#f4f4f4", padding: "2rem", minHeight: "100vh" }}>
      <div>
        {/* Upload info header */}
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
              Uploaded: {uploadData.uploader_email}
              <br />
              UploadID: {uploadId}
              <br />
              {new Date(uploadData.created).toLocaleTimeString()} GMT
              <br />
              {new Date(uploadData.created).toDateString()}
            </p>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                DQ Status:
              </span>
              <Tag type={statusTagType} size="sm">
                {dqResultData.status}
              </Tag>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {isDQReady && (
              <Button
                kind="primary"
                size="md"
                renderIcon={Download}
                onClick={handleDownloadDqSummary}
              >
                Download data quality report
              </Button>
            )}
          </div>
        </div>

        {/* DQ Run buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "4px",
            alignItems: "center",
          }}
        >
          <p style={{ fontWeight: 600, marginRight: "1rem" }}>
            Run Data Quality Assessment:
          </p>
          <Button
            kind="tertiary"
            size="md"
            onClick={() => handleRunDQ("uploaded")}
            disabled={isDQRunning}
          >
            Run on Uploaded File Only
          </Button>
          <Button
            kind="tertiary"
            size="md"
            onClick={() => handleRunDQ("master")}
            disabled={isDQRunning}
          >
            Run with Master Comparison
          </Button>
          {isDQRunning && (
            <InlineLoading
              description="Triggering DQ run..."
              status="active"
              style={{ marginLeft: "1rem" }}
            />
          )}
          {!isDQReady && !isDQRunning && (
            <Button
              kind="ghost"
              size="md"
              renderIcon={Renew}
              onClick={() => void refetchDQ()}
            >
              Refresh status
            </Button>
          )}
        </div>

        {/* Status banner when DQ is not ready */}
        {!isDQReady && (
          <div
            style={{
              marginBottom: "2rem",
              background: "#fff",
              padding: "2rem",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            {dqResultData.status === DQStatus.IN_PROGRESS ? (
              <>
                <InlineLoading
                  description="Data Quality assessment is in progress..."
                  status="active"
                  style={{ justifyContent: "center", marginBottom: "1rem" }}
                />
                <p style={{ color: "#6f6f6f", fontSize: "0.875rem" }}>
                  The DQ pipeline is processing your file. Click{" "}
                  <strong>Refresh status</strong> to check for results.
                </p>
              </>
            ) : dqResultData.status === DQStatus.ERROR ? (
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "#da1e28",
                    marginBottom: "0.5rem",
                  }}
                >
                  Data Quality assessment encountered an error.
                </p>
                <p style={{ color: "#6f6f6f", fontSize: "0.875rem" }}>
                  You can re-run the assessment using the buttons above.
                </p>
              </div>
            ) : (
              <p style={{ color: "#6f6f6f" }}>
                No Data Quality results available yet. Use the buttons above to
                trigger an assessment.
              </p>
            )}
          </div>
        )}

        {/* Results section - only show when DQ is complete */}
        {isDQReady && (
          <>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "2rem",
                alignItems: "stretch",
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

            <div
              style={{
                background: "#fff",
                padding: "1.5rem",
                borderRadius: "4px",
              }}
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
                      <DataQualityChecks data={checks[key] as Check[]} />
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Index;
