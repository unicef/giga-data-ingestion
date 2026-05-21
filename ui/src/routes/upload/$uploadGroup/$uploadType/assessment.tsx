import { ComponentProps, memo, useMemo, useState } from "react";

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
  UploadParams,
  UploadResponse,
  initialDataQualityCheck,
  initialUploadResponse,
} from "@/types/upload";
import { basicCheckSchema } from "@/types/upload";
import { commaNumber } from "@/utils/number";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/assessment",
)({
  component: Assessment,
  loader: ({ context: { getState }, params: { uploadGroup, uploadType } }) => {
    const {
      uploadSlice: { pendingSchoolDataPayload },
      uploadSliceActions: { setStepIndex },
    } = getState();

    const isUnstructured =
      uploadGroup === "other" && uploadType === "unstructured";
    const isStructured = uploadGroup === "other" && uploadType === "structured";

    if (isUnstructured || isStructured) {
      throw redirect({ from: Route.fullPath, to: ".." });
    }

    if (!pendingSchoolDataPayload) {
      setStepIndex(4);
      throw redirect({ from: Route.fullPath, to: "../success" });
    }
  },
});

const AssessmentDataQualityChecks = memo(
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

function Assessment() {
  const { uploadGroup, uploadType } = Route.useParams();
  const {
    uploadSliceActions: { decrementStepIndex, setStepIndex },
    uploadSlice: { source, pendingSchoolDataPayload },
  } = useStore();

  const navigate = useNavigate({ from: Route.fullPath });
  const [reviewUploadId, setReviewUploadId] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";
  const isStructured = uploadGroup === "other" && uploadType === "structured";
  const activeUploadId = reviewUploadId;

  const reviewFile = useMutation({
    mutationFn: ({
      params,
      dq_mode,
    }: {
      params: UploadParams;
      dq_mode: "uploaded" | "master";
    }) => api.uploads.review(params, dq_mode),
  });

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
    } catch {
      setActionError("Review failed. Please try again.");
    }
  };

  const handleReviewClick = () => {
    void handleReview("uploaded");
  };

  const handleProceedToSubmit = () => {
    setStepIndex(4);
    void navigate({ to: "../success" });
  };

  type TagColors = ComponentProps<typeof Tag>["type"];

  const statusTagMap: Record<DQStatus, { color: TagColors; text: string }> = {
    [DQStatus.IN_PROGRESS]: { color: "blue", text: "In Progress" },
    [DQStatus.COMPLETED]: { color: "green", text: "Success" },
    [DQStatus.ERROR]: { color: "red", text: "Failed" },
    [DQStatus.SKIPPED]: { color: "red", text: "Failed" },
    [DQStatus.TIMEOUT]: { color: "red", text: "Failed" },
    [DQStatus.FILE_CHECKED]: { color: "teal", text: "File Checked" },
  };

  const tagProps = effectiveStatus ? statusTagMap[effectiveStatus] : null;
  const qualityHeader = "Quality assessment - uploaded file only";
  const qualityDescription =
    "Before submitting, we can scan your uploaded file to spot potential issues. You will see a summary of any problems and can decide whether to fix them or proceed.";

  const inProgress = effectiveStatus === DQStatus.IN_PROGRESS;
  const showSummaryCards = reviewFile.isPending || !!activeUploadId;
  const isSummaryLoading =
    reviewFile.isPending ||
    (!!activeUploadId && effectiveStatus !== DQStatus.COMPLETED && !isError);
  const isInitialState = !reviewFile.isPending && !activeUploadId;
  const canRunAssessment = isInitialState;
  const useSkipLabel = isInitialState || isError;
  const alignSkipRight = isInitialState;
  const renderSummaryValue = (value: number) =>
    isSummaryLoading ? (
      <div className="mb-4 h-8 w-36 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
    ) : (
      <p className="mb-4 text-2xl font-semibold">{commaNumber(value)}</p>
    );

  return (
    <section className="flex flex-col gap-6 pb-20">
      <div>
        <div className="mb-8">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold leading-tight text-gray-900">
              {qualityHeader}
            </h2>
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

          <p className="max-w-[70rem] text-lg font-normal leading-relaxed text-gray-900">
            {qualityDescription}
          </p>

          {(activeUploadId || reviewFile.isPending) && (
            <div className="mt-5 flex flex-wrap items-center gap-6">
              {tagProps && (
                <Tag
                  renderIcon={InProgress}
                  type={tagProps.color}
                  className="m-0 rounded-full px-3 py-1"
                >
                  {tagProps.text}
                </Tag>
              )}
              {effectiveStatus === DQStatus.IN_PROGRESS && (
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-gray-800">
                  <Loading small withOverlay={false} className="h-4 w-4" />
                  Refreshing Automatically
                </div>
              )}
              {effectiveStatus === DQStatus.IN_PROGRESS && (
                <div className="text-xs font-medium text-gray-500">
                  Estimated running time: 10–15 mins
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pl-4 text-[1.35rem] font-normal leading-snug text-gray-800">
          {!!reviewUploadId && isError && !isRefetchingDqResultQuery && (
            <p className="text-orange-600">Review checks have failed.</p>
          )}
          {actionError && (
            <p className="mt-2 text-sm font-normal text-red-600">
              {actionError}
            </p>
          )}
        </div>
      </div>

      {showSummaryCards && (
        <>
          <div className="mb-8 flex items-stretch gap-2">
            <div className="flex h-full flex-1 flex-col rounded border border-[#e0e0e0] bg-white p-6">
              <h5 className="mb-2 text-sm font-semibold">
                Total Schools Uploaded
              </h5>
              {renderSummaryValue(rows)}
              <div className="mt-auto">
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Download}
                  disabled={isSummaryLoading || rows === 0}
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
              {renderSummaryValue(rowsPassed)}
              <div className="mt-auto">
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Download}
                  disabled={isSummaryLoading || rowsPassed == 0}
                  onClick={handleDownloadPassedRows}
                >
                  Download Passed Schools
                </Button>
              </div>
            </div>

            <div className="flex h-full flex-1 flex-col rounded border border-[#e0e0e0] bg-white p-6">
              <h5 className="mb-2 text-sm font-semibold">
                Total Schools Rejected
              </h5>
              {renderSummaryValue(rowsFailed)}
              <div className="mt-auto">
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Download}
                  disabled={isSummaryLoading || rowsFailed == 0}
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
        <AssessmentDataQualityChecks
          dqResult={dqResult}
          status={effectiveStatus}
          uploadData={uploadData}
          uploadId={activeUploadId}
        />
      ) : activeUploadId && isBasicCheckFetching ? (
        <p>Loading basic checks...</p>
      ) : activeUploadId && basicCheckItems.length > 0 ? (
        <div className="mt-4">
          <Tabs>
            <TabList aria-label="Basic Checks">
              {basicCheckItems.map(({ key }) => {
                const formattedKey = key
                  .replace(/_/g, " ")
                  .replace("Crictical", "Critical");
                const capitalizedKey =
                  formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
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
      ) : null}

      <div
        className={`mt-8 flex items-center gap-[2px] ${
          alignSkipRight ? "justify-between" : ""
        }`}
      >
        <div className="flex items-center">
          <Button
            kind="secondary"
            className="w-40"
            as={Link}
            to="../metadata"
            renderIcon={ArrowLeft}
            disabled={(inProgress && !!activeUploadId) || reviewFile.isPending}
            onClick={() => decrementStepIndex()}
          >
            Cancel
          </Button>
          {canRunAssessment && (
            <Button
              kind="primary"
              renderIcon={ArrowRight}
              onClick={handleReviewClick}
            >
              Run assessment on uploaded file
            </Button>
          )}
        </div>
        <Button
          kind="tertiary"
          className={useSkipLabel ? "w-72" : "w-40"}
          renderIcon={ArrowRight}
          disabled={(inProgress && !!activeUploadId) || reviewFile.isPending}
          onClick={handleProceedToSubmit}
        >
          {useSkipLabel ? "Skip and go to next step" : "Continue"}
        </Button>
      </div>
    </section>
  );
}

export default Assessment;
