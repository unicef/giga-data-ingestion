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
      uploadSlice: { file, columnMapping, pendingSchoolDataPayload },
      uploadSliceActions: { setStepIndex },
    } = getState();

    const isUnstructured =
      uploadGroup === "other" && uploadType === "unstructured";
    const isStructured = uploadGroup === "other" && uploadType === "structured";
    const isHealth = uploadGroup === "other" && uploadType === "health";

    if (isUnstructured) {
      return;
    } else if (isStructured || isHealth) {
      // Structured / health CSV: upload already finished before this screen
      return;
    } else if (pendingSchoolDataPayload) {
      // For school-data coming from assessment with pending payload, allow access
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
      setUploadDate,
      setUploadId,
      setPendingSchoolDataPayload,
      decrementStepIndex,
    },
    uploadSlice: { uploadId, source, pendingSchoolDataPayload },
  } = useStore();

  const navigate = useNavigate({ from: Route.fullPath });
  const [actionError, setActionError] = useState<string>("");

  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";
  const isStructured = uploadGroup === "other" && uploadType === "structured";
  const isHealth = uploadGroup === "other" && uploadType === "health";
  const isSchoolData = uploadGroup === "school-data";
  const hasPendingPayload =
    isSchoolData && !!pendingSchoolDataPayload && !uploadId;
  const activeUploadId = uploadId;
  const isSubmitMode = hasPendingPayload;

  const uploadFile = useMutation({
    mutationFn: api.uploads.upload,
  });
  const isActionPending = uploadFile.isPending;

  const { data: basicCheckQuery, isFetching: isBasicCheckFetching } = useQuery({
    queryFn: () => api.uploads.list_basic_checks(uploadType, source),
    queryKey: ["basic_checks", uploadType, source],
    enabled: !isStructured && !isHealth && !!activeUploadId,
  });
  const basicCheck = basicCheckQuery?.data ?? [];

  const { data: uploadQuery } = useQuery({
    queryKey: ["upload", activeUploadId],
    queryFn: () => api.uploads.get_upload(activeUploadId),
    enabled: !isStructured && !isHealth && !!activeUploadId,
  });
  const uploadData = useMemo<UploadResponse>(
    () => uploadQuery?.data ?? initialUploadResponse,
    [uploadQuery],
  );

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
    enabled: !isUnstructured && !isStructured && !isHealth && !!activeUploadId,
  });

  const dqResult = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const {
    handleDownloadFailedRows,
    handleDownloadPassedRows,
    handleDownloadDqSummary,
  } = useDownloadHelpers(uploadData, dqResult);

  const status = dqResult?.status;

  useEffect(() => {
    if (status === DQStatus.COMPLETED) {
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
    } catch {
      setActionError("Submit failed. Please try again.");
    }
  };

  const unstructuredMessage =
    "Your file has been uploaded! Note that no checks will be performed on this file.";

  const structuredMessage =
    "Your file has been uploaded and will be made available for query on Superset within 5 minutes.";

  const healthMessage =
    "Your health dataset file and metadata have been uploaded. Downstream staging in Azure Data Lake and Dagster will pick this up in a later step.";

  type TagColors = ComponentProps<typeof Tag>["type"];

  const statusTagMap: Record<DQStatus, { color: TagColors; text: string }> = {
    [DQStatus.IN_PROGRESS]: { color: "blue", text: "In Progress" },
    [DQStatus.COMPLETED]: { color: "green", text: "Success" },
    [DQStatus.ERROR]: { color: "red", text: "Failed" },
    [DQStatus.SKIPPED]: { color: "red", text: "Failed" },
    [DQStatus.TIMEOUT]: { color: "red", text: "Failed" },
  };

  const tagProps = effectiveStatus ? statusTagMap[effectiveStatus] : null;
  const qualityHeader = "Submission of the entire dataset";

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
      ) : isHealth ? (
        <>
          {healthMessage}
          <Button as={Link} to="/" onClick={resetUploadSliceState} isExpressive>
            Back to Home
          </Button>
        </>
      ) : (
        <section className="flex flex-col gap-6 pb-20">
          <div>
            <h2 className="ml-4 text-xl font-semibold leading-tight text-gray-900">
              {qualityHeader}
            </h2>
            <div className="flex items-center">
              <div className="flex flex-1 items-center justify-between">
                {(!!activeUploadId || !!isActionPending) && (
                  <div className="mt-6 flex items-center gap-6">
                    <Button
                      className="ml-4 mr-[-1rem] min-h-0 min-w-0"
                      disabled={isRefetchingDqResultQuery || !activeUploadId}
                      renderIcon={Restart}
                      kind="ghost"
                      hasIconOnly
                      iconDescription="Refresh"
                      size="sm"
                      onClick={async () => await refetchDqResultQuery()}
                    />
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
                )}
              </div>
            </div>

            <div className="mb-12 pl-4 text-[1.35rem] font-normal leading-snug text-gray-800">
              {isSubmitMode && !isActionPending && (
                <p>We are currently waiting for your submission...</p>
              )}
              {activeUploadId &&
                effectiveStatus === DQStatus.COMPLETED &&
                !isActionPending &&
                !isRefetchingDqResultQuery && (
                  <p>We have successfully submitted your uploaded file.</p>
                )}
              {activeUploadId && isError && !isRefetchingDqResultQuery && (
                <p className="text-orange-600">
                  Submission checks have failed.
                </p>
              )}
              {actionError && (
                <p className="mt-2 text-sm font-normal text-red-600">
                  {actionError}
                </p>
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
              <div className="mb-8 flex items-stretch gap-4">
                <div className="flex h-full flex-1 flex-col rounded border border-[#e0e0e0] bg-white p-6">
                  <h5 className="mb-4 text-sm font-semibold">
                    Total Schools Uploaded
                  </h5>
                  <p className="mb-4 text-2xl font-semibold">
                    {commaNumber(rows)}
                  </p>
                  <div className="mt-auto">
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

                <div className="flex h-full flex-1 flex-col rounded border border-[#e0e0e0] bg-white p-6">
                  <h5 className="mb-4 text-sm font-semibold">
                    Total Schools Passed
                  </h5>
                  <p className="mb-4 text-2xl font-semibold">
                    {commaNumber(rowsPassed)}
                  </p>
                  <div className="mt-auto">
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

                <div className="flex h-full flex-1 flex-col rounded border border-[#e0e0e0] bg-white p-6">
                  <h5 className="mb-4 text-sm font-semibold">
                    Total Schools Rejected
                  </h5>
                  <p className="mb-4 text-2xl font-semibold">
                    {commaNumber(rowsFailed)}
                  </p>
                  <div className="mt-auto">
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

          {/* Action buttons */}
          <div className="mt-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-[2px]">
              <Button
                kind="secondary"
                className="w-40"
                as={Link}
                to={isUnstructured || isStructured ? ".." : "../assessment"}
                renderIcon={ArrowLeft}
                disabled={(inProgress && !!activeUploadId) || isActionPending}
                onClick={() => decrementStepIndex()}
              >
                Back
              </Button>
              <Button
                kind="primary"
                className="w-40"
                renderIcon={ArrowRight}
                disabled={(inProgress && !!activeUploadId) || isActionPending}
                onClick={isSubmitMode ? handleInitialSubmit : handleSubmit}
              >
                Submit
              </Button>
            </div>

            {!isSubmitMode && inProgress && (
              <Button
                kind="primary"
                className="w-72"
                renderIcon={ArrowRight}
                onClick={handleSubmit}
              >
                Close and run in background
              </Button>
            )}
          </div>
        </section>
      )}
    </>
  );
}

export default Success;
