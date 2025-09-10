import { ComponentProps, memo, useMemo } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Download,
  InProgress,
  Restart,
} from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Loading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";

import { api } from "@/api";
import BasicDataQualityCheck from "@/components/check-file-uploads/BasicDataQualityCheck";
import DataCheckItem from "@/components/check-file-uploads/DataCheckItem";
import { useDownloadHelpers } from "@/components/check-file-uploads/Downloadlogic";
import { useStore } from "@/context/store";
import { cn } from "@/lib/utils";
import {
  Check,
  DQStatus,
  DataQualityCheck,
  UploadResponse,
  initialDataQualityCheck,
  initialUploadResponse,
} from "@/types/upload";
import { basicCheckSchema } from "@/types/upload";
import { commaNumber } from "@/utils/number";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/success",
)({
  component: Success,
  loader: ({ context: { getState }, params: { uploadGroup, uploadType } }) => {
    const {
      uploadSlice: { file, columnMapping },
      uploadSliceActions: { setStepIndex },
    } = getState();

    const isUnstructured =
      uploadGroup === "other" && uploadType === "unstructured";
    const isStructured = uploadGroup === "other" && uploadType === "structured";

    if (isUnstructured) {
      return;
    } else if (isStructured) {
      // For structured datasets, allow access even without file since upload is already complete
      return;
    } else if (
      !file ||
      Object.values(columnMapping).filter(Boolean).length === 0
    ) {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }
  },
});

const SuccessDataQualityChecks = memo(
  ({
    dqResult,
    status,
    uploadId,
  }: {
    dqResult: DataQualityCheck;
    status: DQStatus;
    uploadData: UploadResponse;
    uploadId: string;
  }) => {
    if (status !== DQStatus.COMPLETED) return null;
    const {
      summary: _summary,
      critical_error_check: _critical_error_check = [],
      ...checks
    } = dqResult.dq_summary ?? {};

    return (
      <Tabs>
        <TabList aria-label="Data Quality Tabs">
          {Object.keys(checks).map(key => (
            <Tab key={key}>{key.replace(/_/g, " ")}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {Object.keys(checks).map(key => (
            <TabPanel key={key}>
              <DataCheckItem
                data={checks[key] as Check[]}
                hasDownloadButton={false}
                previewData={dqResult.dq_failed_rows_first_five_rows}
                uploadId={uploadId}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    );
  },
);

function Success() {
  const { uploadGroup, uploadType } = Route.useParams();
  const {
    uploadSliceActions: { resetUploadSliceState },
    uploadSlice: { uploadId, source },
  } = useStore();

  const navigate = useNavigate({ from: Route.fullPath });

  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";
  const isStructured = uploadGroup === "other" && uploadType === "structured";

  const { data: basicCheckQuery, isFetching: isBasicCheckFetching } = useQuery({
    queryFn: () => api.uploads.list_basic_checks(uploadType, source),
    queryKey: ["basic_checks", uploadType, source],
    enabled: !isStructured, // Don't query for structured datasets
  });
  const basicCheck = basicCheckQuery?.data ?? [];

  const { data: uploadQuery } = useQuery({
    queryKey: ["upload", uploadId],
    queryFn: () => api.uploads.get_upload(uploadId),
    enabled: !isStructured && !!uploadId, // Don't query for structured datasets
  });
  const uploadData = useMemo<UploadResponse>(
    () => uploadQuery?.data ?? initialUploadResponse,
    [uploadQuery],
  );
  const {
    handleDownloadFailedRows,
    handleDownloadPassedRows,
    handleDownloadDqSummary,
  } = useDownloadHelpers(uploadData);

  const {
    data: dqResultQuery,
    isRefetching: isRefetchingDqResultQuery,
    refetch: refetchDqResultQuery,
  } = useQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => api.uploads.get_data_quality_check(uploadId),
    refetchInterval: 7000,
    enabled: !isUnstructured && !isStructured, // Don't query for structured datasets
  });

  const dqResult = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const status = dqResult?.status;

  const isError =
    status === DQStatus.ERROR ||
    status === DQStatus.SKIPPED ||
    status === DQStatus.TIMEOUT;

  const basicCheckItems = Object.entries(basicCheck)
    .map(([key, value]) => {
      const basicCheckArraySchema = z.array(basicCheckSchema);
      const check = basicCheckArraySchema.safeParse(value);
      if (check.success) {
        return {
          key,
          content: <BasicDataQualityCheck data={check.data} />,
        };
      }
      return null;
    })
    .filter(Boolean) as { key: string; content: JSX.Element }[];

  const summaryStats = dqResult?.dq_summary?.summary ?? {};
  const rows = summaryStats.rows ?? 0;
  const rowsPassed = summaryStats.rows_passed ?? 0;
  const rowsFailed = summaryStats.rows_failed ?? 0;

  const handleSubmit = () => {
    navigate({
      to: status === DQStatus.COMPLETED ? "/upload/$uploadId" : "..",
      params: { uploadId },
    });
  };

  const unstructuredMessage =
    "Your file has been uploaded! Note that no checks will be performed on this file.";

  const structuredMessage =
    "Your file has been uploaded and will be made available for query on Superset within 5 minutes.";

  type TagColors = ComponentProps<typeof Tag>["type"];

  const statusTagMap: Record<DQStatus, { color: TagColors; text: string }> = {
    [DQStatus.IN_PROGRESS]: { color: "blue", text: "In Progress" },
    [DQStatus.COMPLETED]: { color: "green", text: "Success" },
    [DQStatus.ERROR]: { color: "red", text: "Failed" },
    [DQStatus.SKIPPED]: { color: "red", text: "Failed" },
    [DQStatus.TIMEOUT]: { color: "red", text: "Failed" },
  };

  const tagProps = status ? statusTagMap[status] : null;
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
    <>
      {isUnstructured ? (
        <>
          {unstructuredMessage}
          <Button as={Link} to="/" onClick={resetUploadSliceState} isExpressive>
            Back to Home
          </Button>
        </>
      ) : isStructured ? (
        <>
          {structuredMessage}
          <Button as={Link} to="/" onClick={resetUploadSliceState} isExpressive>
            Back to Home
          </Button>
        </>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex gap-6">
            <div className="flex border-b-2 border-gray-300">
              <div className="bg-gray-100 py-4 pl-4 pr-28 text-base font-semibold">
                Data Quality Review
              </div>
              <Button
                className="bg-gray-100"
                disabled={isRefetchingDqResultQuery}
                renderIcon={Restart}
                kind="ghost"
                onClick={async () => await refetchDqResultQuery()}
              />
              <div className="flex items-center">
                {tagProps && (
                  <Tag renderIcon={InProgress} type={tagProps.color}>
                    {tagProps.text}
                  </Tag>
                )}
              </div>
            </div>
            {status === DQStatus.IN_PROGRESS && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <Loading small withOverlay={false} />
                  Refreshing Automatically
                </div>
                <div className="flex items-center text-xs text-slate-600">
                  Estimated running time: 10–15 mins
                </div>
              </>
            )}
          </div>

          <div className="py-6 text-blue-400">
            {status === DQStatus.IN_PROGRESS && (
              <>
                Congratulations! Your data file has been uploaded and data
                quality checks are <b>in progress.</b>
              </>
            )}
            {status === DQStatus.COMPLETED && (
              <>
                Congratulations! Your data file has been uploaded and data
                quality checks are{" "}
                <span className="text-green-600">successful.</span>
              </>
            )}
            {isError && (
              <>
                Your data file has been uploaded and data quality checks{" "}
                <span className="text-orange-400">have failed.</span>
              </>
            )}
          </div>

          <div>
            <div
              style={{
                marginBottom: "2rem",
                background: "#fff",
                padding: "1.5rem",
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
            </div>
            {status === DQStatus.COMPLETED && (
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
                        disabled={rows == 0}
                        onClick={handleDownloadDqSummary}
                      >
                        Download Summary
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
                        disabled={rowsPassed == 0}
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
                        disabled={rowsFailed == 0}
                        onClick={handleDownloadFailedRows}
                      >
                        Download Rejected Schools
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {status === DQStatus.COMPLETED ? (
            <SuccessDataQualityChecks
              dqResult={dqResult}
              status={status}
              uploadData={uploadData}
              uploadId={uploadId}
            />
          ) : isBasicCheckFetching ? (
            <p>Loading basic checks...</p>
          ) : (
            <Tabs>
              <TabList aria-label="Basic Checks">
                {basicCheckItems.map(({ key }) => (
                  <Tab key={key}>{key.replace(/_/g, " ")}</Tab>
                ))}
              </TabList>
              <TabPanels>
                {basicCheckItems.map(({ key, content }) => (
                  <TabPanel key={key}>{content}</TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          )}

          <ButtonSet className="w-full">
            {status !== DQStatus.COMPLETED && (
              <Button
                as={Link}
                isExpressive
                kind="secondary"
                renderIcon={ArrowLeft}
                to=".."
              >
                Back
              </Button>
            )}
            <Button
              className={cn({
                "bg-green-600 hover:bg-green-800":
                  status === DQStatus.COMPLETED,
                "bg-orange-400 hover:bg-orange-600": isError,
              })}
              disabled={status === DQStatus.IN_PROGRESS}
              isExpressive
              onClick={handleSubmit}
              renderIcon={ArrowRight}
            >
              {status === DQStatus.IN_PROGRESS || status === DQStatus.COMPLETED
                ? "Submit"
                : "Reupload"}
            </Button>
          </ButtonSet>
        </section>
      )}
    </>
  );
}

export default Success;
