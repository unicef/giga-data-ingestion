import { useEffect, useMemo, useState } from "react";

import { Download, Send } from "@carbon/icons-react";
import {
  Button,
  InlineLoading,
  Loading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
} from "@carbon/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { api } from "@/api";
import DataQualityChecks from "@/components/check-file-uploads/ColumnChecks";
import { useDownloadHelpers } from "@/components/check-file-uploads/Downloadlogic";
import { ErrorComponent } from "@/components/common/ErrorComponent";
import { PendingComponent } from "@/components/common/PendingComponent";
import { Check } from "@/types/upload";
import {
  DQStatus,
  DQStatusTagMapping,
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mapUrl, setMapUrl] = useState<string>("");
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string>("");

  const { data: dqResultQuery } = useSuspenseQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => api.uploads.get_data_quality_check(uploadId),
    refetchInterval: query => {
      const current_status = query.state.data?.data?.status;
      if (current_status && current_status !== DQStatus.IN_PROGRESS) {
        return false;
      }
      return 5000;
    },
  });

  const dqResultData = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const { data: uploadQuery } = useSuspenseQuery({
    queryKey: ["upload", uploadId],
    queryFn: () => api.uploads.get_upload(uploadId),
    refetchInterval: query => {
      const current_status = query.state.data?.data?.dq_status;
      if (current_status && current_status !== DQStatus.IN_PROGRESS) {
        return false;
      }
      return 5000;
    },
  });

  const uploadData = useMemo<UploadResponse>(
    () => uploadQuery?.data ?? initialUploadResponse,
    [uploadQuery],
  );

  const dqStatus = uploadData.dq_status;
  const isCompleted = dqStatus === DQStatus.COMPLETED;

  const checkTypeLabel =
    uploadData.dq_mode === "uploaded" ? "FILE_CHECKED" : "MASTER";

  const runMasterCheckMutation = useMutation({
    mutationFn: () => api.uploads.dq_run(uploadId, "master"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload", uploadId] });
      queryClient.invalidateQueries({ queryKey: ["dq_check", uploadId] });
      router.invalidate();
    },
  });

  const handleSubmitMasterCheck = () => {
    runMasterCheckMutation.mutate();
  };

  const summaryStats = dqResultData.dq_summary?.summary || {};
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
    handleDownloadDqKit,
    handleDownloadMap,
  } = useDownloadHelpers(uploadData);

  // Fetch map HTML and create a blob URL for iframe preview
  useEffect(() => {
    if (uploadData.dq_status !== "COMPLETED") {
      return;
    }

    let createdUrl: string | null = null;
    setMapLoading(true);
    setMapError("");

    api.uploads
      .download_map({ upload_id: uploadId })
      .then(response => {
        createdUrl = window.URL.createObjectURL(response.data);
        setMapUrl(createdUrl);
        setMapLoading(false);
      })
      .catch(error => {
        console.error("Error loading map:", error);
        setMapError("Map not available or not yet generated");
        setMapLoading(false);
      });

    return () => {
      if (createdUrl) {
        window.URL.revokeObjectURL(createdUrl);
      }
    };
  }, [uploadId, uploadData.dq_status]);

  // Extract checks from dqResultData
  const {
    summary: _summaryStats,
    critical_error_check: _critical_error_check = [],
    ...checks
  } = dqResultData.dq_summary || {};

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
              <span style={{ fontSize: "0.875rem", color: "#6f6f6f" }}>
                Check type:
              </span>
              <Tag type={DQStatusTagMapping[dqStatus]} size="md">
                {checkTypeLabel}
              </Tag>
              {dqStatus === DQStatus.IN_PROGRESS && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.875rem",
                    color: "#393939",
                  }}
                >
                  <Loading
                    small
                    withOverlay={false}
                    style={{ width: "1rem", height: "1rem" }}
                  />
                  <span>Checking... Refreshing automatically</span>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                kind="primary"
                size="md"
                renderIcon={Download}
                onClick={handleDownloadDqSummary}
              >
                Download data quality report
              </Button>

              {uploadData.dq_mode === "uploaded" && isCompleted && (
                <Button
                  kind="primary"
                  size="md"
                  renderIcon={Send}
                  onClick={handleSubmitMasterCheck}
                  disabled={runMasterCheckMutation.isPending}
                >
                  {runMasterCheckMutation.isPending
                    ? "Submitting..."
                    : "Submit for master check"}
                </Button>
              )}
              <Button
                kind="secondary"
                size="md"
                renderIcon={Download}
                onClick={handleDownloadDqKit}
              >
                Download DQ Kit
              </Button>
            </div>
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
                <DataQualityChecks data={checks[key] as Check[]} />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>

      {uploadData.dq_status === "COMPLETED" && (
        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "4px",
            marginTop: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ margin: 0 }}>School Location Map</h3>
            <Button
              kind="primary"
              size="sm"
              renderIcon={Download}
              onClick={handleDownloadMap}
              disabled={mapLoading || !!mapError}
            >
              Download map
            </Button>
          </div>

          <div
            style={{
              position: "relative",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
              minHeight: "600px",
            }}
          >
            {mapLoading && (
              <div
                style={{
                  height: "600px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#525252",
                }}
              >
                <InlineLoading description="Loading map..." />
              </div>
            )}

            {mapError && !mapLoading && (
              <div
                style={{
                  height: "600px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  color: "#da1e28",
                }}
              >
                <p>{mapError}</p>
                <p style={{ fontSize: "0.875rem", color: "#525252" }}>
                  The map may not have been generated yet.
                </p>
              </div>
            )}

            {mapUrl && !mapLoading && !mapError && (
              <iframe
                src={mapUrl}
                style={{
                  width: "100%",
                  height: "600px",
                  border: "none",
                  display: "block",
                }}
                title="School Data Quality Map"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Index;
