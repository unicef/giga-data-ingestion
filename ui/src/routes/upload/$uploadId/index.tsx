import { useEffect, useMemo, useState } from "react";

import { Download, Send } from "@carbon/icons-react";
import {
  Button,
  Link,
  Loading,
  MenuButton,
  MenuItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
} from "@carbon/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { api, axi } from "@/api";
import { DQ_REPORT_LANGUAGES } from "@/api/routers/email";
import { useDownloadHelpers } from "@/components/check-file-uploads/Downloadlogic";
import DqSectionTable from "@/components/check-file-uploads/DqSectionTable";
import InternalChecksTable from "@/components/check-file-uploads/InternalChecksTable";
import MappingsTable from "@/components/check-file-uploads/MappingsTable";
import MetadataTable from "@/components/check-file-uploads/MetadataTable";
import SummaryKpiCards from "@/components/check-file-uploads/SummaryKpiCards";
import { ErrorComponent } from "@/components/common/ErrorComponent";
import { PendingComponent } from "@/components/common/PendingComponent";
import useCountryName from "@/hooks/useCountryName";
import {
  DQStatus,
  DQStatusTagMapping,
  DataQualityCheck,
  UploadResponse,
  initialDataQualityCheck,
  initialUploadResponse,
} from "@/types/upload";
import {
  buildDqReport,
  getDqEntity,
  getValueMapSections,
  pivotChecksByColumn,
} from "@/utils/dq-summary";
import { getUploadMetadataRows } from "@/utils/upload-metadata";

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
  const [mapUrl, setMapUrl] = useState<string>("");
  const [dqKitAvailable, setDqKitAvailable] = useState<boolean>(false);
  const router = useRouter();

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

  const countryName = useCountryName(uploadData.country);

  const metadataRows = useMemo(
    () => getUploadMetadataRows(uploadData.upload_metadata, uploadData.dataset),
    [uploadData.upload_metadata, uploadData.dataset],
  );

  const runMasterCheckMutation = useMutation({
    mutationFn: () => api.uploads.dq_run(uploadId, "master"),
    onSuccess: () => {
      router.invalidate();
    },
  });

  const handleSubmitMasterCheck = () => {
    runMasterCheckMutation.mutate();
  };

  const {
    handleDownloadFailedRows,
    handleDownloadPassedRows,
    handleDownloadDqSummary,
    handleDownloadRawFile,
    handleDownloadDqKit,
    handleDownloadMap,
  } = useDownloadHelpers(uploadData, dqResultData);

  // Check if DQ Kit is available
  useEffect(() => {
    let isCurrent = true;
    setDqKitAvailable(false);

    if (uploadData.dq_status !== "COMPLETED") {
      return () => {
        isCurrent = false;
      };
    }

    axi
      .head(`upload/dq_kit/${uploadData.id}/download`)
      .then(() => {
        if (isCurrent) {
          setDqKitAvailable(true);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setDqKitAvailable(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [uploadData.id, uploadData.dq_status]);

  // Fetch map HTML and create a blob URL for iframe preview
  useEffect(() => {
    if (
      uploadData.dq_status !== "COMPLETED" ||
      uploadData.dataset !== "geolocation" ||
      !dqKitAvailable
    ) {
      setMapUrl("");
      return;
    }

    let isCurrent = true;
    let createdUrl: string | null = null;
    setMapUrl("");

    api.uploads
      .download_map({ upload_id: uploadId })
      .then(response => {
        if (!isCurrent) {
          return;
        }
        createdUrl = window.URL.createObjectURL(response.data);
        setMapUrl(createdUrl);
      })
      .catch(error => {
        if (!isCurrent) {
          return;
        }
        console.error("Error loading map:", error);
      });

    return () => {
      isCurrent = false;
      if (createdUrl) {
        window.URL.revokeObjectURL(createdUrl);
      }
    };
  }, [dqKitAvailable, uploadId, uploadData.dq_status, uploadData.dataset]);

  const dqSummary = dqResultData.dq_summary;
  const entity = getDqEntity(uploadData.dataset);
  const report = useMemo(
    () => buildDqReport(dqSummary, uploadData.dataset),
    [dqSummary, uploadData.dataset],
  );
  const valueMapSections = useMemo(
    () => getValueMapSections(dqSummary),
    [dqSummary],
  );
  const internalCheckCategories = useMemo(
    () => pivotChecksByColumn(dqSummary, uploadData.dataset),
    [dqSummary, uploadData.dataset],
  );

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
            {countryName && (
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                Country: {countryName}
              </p>
            )}

            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              File:{" "}
              <Link
                href="#"
                onClick={(event: React.MouseEvent) => {
                  event.preventDefault();
                  handleDownloadRawFile();
                }}
              >
                {uploadData.original_filename}
              </Link>
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
              {uploadData.mode && (
                <>
                  <br />
                  Type: {uploadData.mode}
                </>
              )}
              {uploadData.approval_status && (
                <>
                  <br />
                  Approval status: {uploadData.approval_status}
                </>
              )}
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
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <MenuButton
              kind="primary"
              size="md"
              menuAlignment="bottom-end"
              label="Download data quality report (PDF)"
            >
              {DQ_REPORT_LANGUAGES.map(({ code, label }) => (
                <MenuItem
                  key={code}
                  label={label}
                  onClick={() => handleDownloadDqSummary(code)}
                />
              ))}
            </MenuButton>
            {dqKitAvailable && (
              <Button
                kind="secondary"
                size="md"
                renderIcon={Download}
                onClick={handleDownloadDqKit}
              >
                Download DQ Kit
              </Button>
            )}
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
                  : "Submit for Approval"}
              </Button>
            )}
          </div>
        </div>

        <SummaryKpiCards
          report={report}
          entity={entity}
          onDownloadApproved={handleDownloadPassedRows}
          onDownloadRejected={handleDownloadFailedRows}
        />
      </div>
      <div
        style={{ background: "#fff", padding: "1.5rem", borderRadius: "4px" }}
      >
        <Tabs>
          <TabList aria-label="Data quality summary" className="mb-4">
            <Tab>Rejected</Tab>
            <Tab>Warnings</Tab>
            <Tab>Mappings</Tab>
            <Tab>Internal checks</Tab>
            <Tab>Metadata</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <DqSectionTable
                title="Rejected"
                sections={report.rejectedSections}
              />
            </TabPanel>
            <TabPanel>
              <DqSectionTable
                title="Warnings"
                sections={report.warningSections}
              />
            </TabPanel>
            <TabPanel>
              <MappingsTable sections={valueMapSections} />
            </TabPanel>
            <TabPanel>
              <InternalChecksTable categories={internalCheckCategories} />
            </TabPanel>
            <TabPanel>
              <MetadataTable rows={metadataRows} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      {uploadData.dq_status === "COMPLETED" &&
        uploadData.dataset === "geolocation" &&
        dqKitAvailable &&
        mapUrl && (
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
              <iframe
                src={mapUrl}
                sandbox="allow-scripts"
                style={{
                  width: "100%",
                  height: "600px",
                  border: "none",
                  display: "block",
                }}
                title="School Data Quality Map"
              />
            </div>
          </div>
        )}
    </div>
  );
}

export default Index;
