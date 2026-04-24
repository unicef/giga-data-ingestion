import { ComponentProps, memo, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Download,
  InProgress,
  Restart,
} from "@carbon/icons-react";
import {
  Button,
  Loading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
} from "@carbon/react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  UploadParams,
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
          {Object.keys(checks).map(key => {
            const formattedKey = key
              .replace(/_/g, " ")
              .replace("Crictical", "Critical");
            const capitalizedKey =
              formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
            return <Tab key={key}>{capitalizedKey}</Tab>;
          })}
        </TabList>
        <TabPanels>
          {Object.keys(checks).map(key => (
            <TabPanel key={key} className="pt-4">
              <DataCheckItem
                data={checks[key] as Check[]}
                hasDownloadButton={false}
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
    uploadSliceActions: {
      resetUploadSliceState,
      setPendingSchoolDataPayload,
      setUploadDate,
      setUploadId,
      decrementStepIndex,
    },
    uploadSlice: { uploadId, source, pendingSchoolDataPayload },
  } = useStore();

  const navigate = useNavigate({ from: Route.fullPath });
  const [reviewUploadId, setReviewUploadId] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [showModeSelection, setShowModeSelection] = useState<boolean>(false);

  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";
  const isStructured = uploadGroup === "other" && uploadType === "structured";
  const isSchoolData = uploadGroup === "school-data";
  const isPreSubmitMode =
    isSchoolData && !!pendingSchoolDataPayload && uploadId === "";
  const activeUploadId = uploadId || reviewUploadId;
  const isReviewMode = isPreSubmitMode || (!!reviewUploadId && !uploadId);

  const reviewFile = useMutation({
    mutationFn: ({
      params,
      dq_mode,
    }: {
      params: UploadParams;
      dq_mode: "uploaded" | "master";
    }) => api.uploads.review(params, dq_mode),
  });
  const uploadFile = useMutation({
    mutationFn: api.uploads.upload,
  });
  const isActionPending = reviewFile.isPending || uploadFile.isPending;

  const { data: basicCheckQuery, isFetching: isBasicCheckFetching } = useQuery({
    queryFn: () => api.uploads.list_basic_checks(uploadType, source),
    queryKey: ["basic_checks", uploadType, source],
    enabled: !isStructured && !!activeUploadId,
  });
  const basicCheck = basicCheckQuery?.data ?? [];

  const { data: uploadQuery } = useQuery({
    queryKey: ["upload", activeUploadId],
    queryFn: () => api.uploads.get_upload(activeUploadId),
    enabled: !isStructured && !!activeUploadId,
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
    queryKey: ["dq_check", activeUploadId],
    queryFn: () => api.uploads.get_data_quality_check(activeUploadId),
    refetchInterval: query => {
      const current_status =
        query.state.data?.data?.status ?? query.state.data?.status;
      if (current_status && current_status !== DQStatus.IN_PROGRESS) {
        return false;
      }
      return 7000;
    },
    enabled: !isUnstructured && !isStructured && !!activeUploadId,
  });

  const dqResult = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const status = dqResult?.status;

  useEffect(() => {
    if (!isReviewMode && status === DQStatus.COMPLETED) {
      navigate({
        to: "/upload/$uploadId",
        params: { uploadId },
      });
    }
  }, [status]);

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
  const effectiveStatus: DQStatus | null = status ?? null;
  const isError =
    effectiveStatus === DQStatus.ERROR ||
    effectiveStatus === DQStatus.SKIPPED ||
    effectiveStatus === DQStatus.TIMEOUT;

  const handleSubmit = () => {
    if (status === DQStatus.COMPLETED) {
      navigate({
        to: "/upload/$uploadId",
        params: { uploadId },
      });
    } else {
      resetUploadSliceState();
      navigate({ to: "/upload" });
    }
  };

  const handleReview = async (dq_mode: "uploaded" | "master") => {
    if (!pendingSchoolDataPayload) return;

    setActionError("");
    try {
      const {
        data: { id },
      } = await reviewFile.mutateAsync({
        params: pendingSchoolDataPayload,
        dq_mode,
      });
      setReviewUploadId(id);
      setShowModeSelection(false);
    } catch {
      setActionError("Review failed. Please try again.");
    }
  };

  const handleReviewClick = () => {
    setShowModeSelection(true);
  };

  const handleInitialSubmit = async () => {
    if (!pendingSchoolDataPayload) return;

    setActionError("");
    try {
      const {
        data: { id, created },
      } = await uploadFile.mutateAsync(pendingSchoolDataPayload);

      setUploadId(id);
      setUploadDate(new Date(created));
      setPendingSchoolDataPayload(null);
      setReviewUploadId("");
    } catch {
      setActionError("Submit failed. Please try again.");
    }
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

  const tagProps = effectiveStatus ? statusTagMap[effectiveStatus] : null;
  const qualityHeader = "Data Review & Submit";
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

  const displayUploadId = activeUploadId || "-";
  const displayFileName =
    uploadData.original_filename || pendingSchoolDataPayload?.file?.name || "-";
  const createdDate = uploadData.created ? new Date(uploadData.created) : null;
  const inProgress = effectiveStatus === DQStatus.IN_PROGRESS;

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
        <section className="flex flex-col gap-6 pb-20">
          <div>
            <div className="mb-10 flex items-center gap-6">
              <div className="flex items-stretch border-b border-gray-300">
                <div className="flex items-center bg-gray-100 py-3 pl-4 pr-16 text-sm font-medium text-gray-800">
                  {qualityHeader}
                </div>
                <div className="flex items-center bg-gray-100 pr-2">
                  <Button
                    className="min-h-0 min-w-0 p-2"
                    disabled={isRefetchingDqResultQuery || !activeUploadId}
                    renderIcon={Restart}
                    kind="ghost"
                    hasIconOnly
                    iconDescription="Refresh"
                    size="sm"
                    onClick={async () => await refetchDqResultQuery()}
                  />
                </div>
              </div>

              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-6">
                  {(activeUploadId || isActionPending) && tagProps && (
                    <Tag
                      renderIcon={InProgress}
                      type={tagProps.color}
                      className="m-0 rounded-full px-3 py-1"
                    >
                      {tagProps.text}
                    </Tag>
                  )}
                  {(activeUploadId || isActionPending) &&
                    effectiveStatus === DQStatus.IN_PROGRESS && (
                      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-gray-800">
                        <Loading
                          small
                          withOverlay={false}
                          className="h-4 w-4"
                        />
                        Refreshing Automatically
                      </div>
                    )}
                  {(activeUploadId || isActionPending) &&
                    effectiveStatus === DQStatus.IN_PROGRESS && (
                      <div className="text-xs font-medium text-gray-500">
                        Estimated running time: 10–15 mins
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="mb-12 pl-4 text-[1.35rem] font-normal leading-snug text-gray-800">
              {isPreSubmitMode &&
                !activeUploadId &&
                !isActionPending &&
                !showModeSelection && (
                  <p>
                    We are currently waiting for your review or submission...
                  </p>
                )}
              {isPreSubmitMode && showModeSelection && !isActionPending && (
                <div className="flex flex-col gap-4">
                  <p>
                    Please select how you want to run the Data Quality
                    assessment:
                  </p>
                  <div className="mt-2 flex gap-4">
                    <Button
                      kind="tertiary"
                      onClick={() => handleReview("uploaded")}
                      disabled={reviewFile.isPending}
                    >
                      Run on Uploaded File Only
                    </Button>
                    <Button
                      kind="tertiary"
                      onClick={() => handleReview("master")}
                      disabled={reviewFile.isPending}
                    >
                      Run with Master Comparison
                    </Button>
                  </div>
                  {reviewFile.isPending && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <Loading small withOverlay={false} className="h-4 w-4" />
                      Uploading file for review...
                    </div>
                  )}
                </div>
              )}
              {((isActionPending && reviewFile.isPending) ||
                (!!reviewUploadId &&
                  !uploadId &&
                  (effectiveStatus === DQStatus.IN_PROGRESS ||
                    isRefetchingDqResultQuery))) && (
                <p>We are currently reviewing your uploaded file...</p>
              )}
              {((isActionPending && uploadFile.isPending) ||
                (!!uploadId &&
                  (effectiveStatus === DQStatus.IN_PROGRESS ||
                    isRefetchingDqResultQuery))) && (
                <p>We are currently submitting your uploaded file...</p>
              )}
              {!!reviewUploadId &&
                !uploadId &&
                effectiveStatus === DQStatus.COMPLETED &&
                !isRefetchingDqResultQuery && (
                  <p>
                    Review completed successfully. Preview checks are visible
                    below. Click Submit when you are ready.
                  </p>
                )}
              {activeUploadId &&
                effectiveStatus === DQStatus.COMPLETED &&
                !isActionPending &&
                !isRefetchingDqResultQuery && (
                  <p>
                    {uploadId
                      ? "We have successfully submitted your uploaded file."
                      : "We have successfully reviewed your uploaded file."}
                  </p>
                )}
              {activeUploadId && isError && !isRefetchingDqResultQuery && (
                <p className="text-orange-600">
                  {uploadId
                    ? "Submission checks have failed."
                    : "Review checks have failed."}
                </p>
              )}
              {actionError && (
                <p className="mt-2 text-sm font-normal text-red-600">
                  {actionError}
                </p>
              )}

              {!isReviewMode && (
                <Button
                  className={cn("w-full", {
                    "bg-green-600 hover:bg-green-800":
                      status === DQStatus.COMPLETED,
                  })}
                  isExpressive
                  onClick={handleSubmit}
                  renderIcon={ArrowRight}
                >
                  {status === DQStatus.COMPLETED
                    ? "Review Submission"
                    : "Close and run in background"}
                </Button>
              )}
            </div>

            <div className="pl-4 text-sm">
              <div className="mb-2">
                <span className="font-semibold text-gray-900">File: </span>
                {displayFileName === "-" ? (
                  <span className="text-gray-500">Not available</span>
                ) : (
                  <a className="cursor-pointer text-blue-500 hover:text-blue-700 hover:underline">
                    {displayFileName}
                  </a>
                )}
              </div>
              <div className="flex flex-col space-y-0.5 text-xs font-normal text-gray-400">
                <div className="m-0 p-0 leading-tight">
                  Uploaded: {uploadData.uploader_email || "Not available"}
                </div>
                <div className="m-0 p-0 leading-tight">
                  UploadID:{" "}
                  {displayUploadId === "-" ? "Not available" : displayUploadId}
                </div>
                <div className="m-0 p-0 leading-tight">
                  {createdDate
                    ? `${createdDate.toLocaleTimeString()} GMT`
                    : "Not available"}
                </div>
                <div className="m-0 p-0 leading-tight">
                  {createdDate ? createdDate.toDateString() : "Not available"}
                </div>
              </div>
            </div>
          </div>

          {activeUploadId && effectiveStatus === DQStatus.COMPLETED && (
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
          {status === DQStatus.COMPLETED ? (
            <SuccessDataQualityChecks
              dqResult={dqResult}
              status={effectiveStatus}
              uploadData={uploadData}
              uploadId={activeUploadId}
            />
          ) : isBasicCheckFetching ? (
            <p>Loading basic checks...</p>
          ) : (
            <div className="mt-4">
              <Tabs>
                <TabList aria-label="Basic Checks">
                  {basicCheckItems.map(({ key }) => {
                    const formattedKey = key
                      .replace(/_/g, " ")
                      .replace("Crictical", "Critical");
                    const capitalizedKey =
                      formattedKey.charAt(0).toUpperCase() +
                      formattedKey.slice(1);
                    return <Tab key={key}>{capitalizedKey}</Tab>;
                  })}
                </TabList>
                <TabPanels>
                  {basicCheckItems.map(({ key, content }) => (
                    <TabPanel key={key} className="pt-4">
                      {content}
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </div>
          )}

          {/* Action buttons matching screenshot */}
          <div className="mt-8 flex justify-end gap-[2px]">
            <Button
              kind="secondary"
              className="w-40"
              as={Link}
              to={isUnstructured || isStructured ? ".." : "../metadata"}
              renderIcon={ArrowLeft}
              disabled={(inProgress && !!activeUploadId) || isActionPending}
              onClick={() => decrementStepIndex()}
            >
              Back
            </Button>
            <Button
              kind="tertiary"
              className="w-40"
              disabled={(inProgress && !!activeUploadId) || isActionPending}
              onClick={isReviewMode ? handleReviewClick : undefined}
            >
              Review
            </Button>
            <Button
              kind="primary"
              className="w-40"
              renderIcon={ArrowRight}
              disabled={(inProgress && !!activeUploadId) || isActionPending}
              onClick={isReviewMode ? handleInitialSubmit : handleSubmit}
            >
              Submit
            </Button>
          </div>
        </section>
      )}
    </>
  );
}

export default Success;
