import { type ComponentProps, memo, useMemo } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Download,
  InProgress,
  Restart,
} from "@carbon/icons-react";
import {
  Accordion,
  AccordionItem,
  AccordionSkeleton,
  Button,
  ButtonSet,
  CopyButton,
  InlineLoading,
  Loading,
  Tag,
} from "@carbon/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { api } from "@/api";
import BasicDataQualityCheck from "@/components/check-file-uploads/BasicDataQualityCheck";
import DataCheckItem from "@/components/check-file-uploads/DataCheckItem";
import SummaryBanner from "@/components/check-file-uploads/SummaryBanner";
import SummaryChecks from "@/components/check-file-uploads/SummaryChecks";
import { useStore } from "@/context/store";
import { cn } from "@/lib/utils";
import {
  type Check,
  DQStatus,
  type DataQualityCheck,
  type UploadResponse,
  initialDataQualityCheck,
  initialUploadResponse,
} from "@/types/upload";
import { basicCheckSchema } from "@/types/upload";
import { sumAsertions } from "@/utils/data_quality";
import { saveFile } from "@/utils/download";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/success")({
  component: Success,
  loader: ({ params: { uploadGroup, uploadType } }) => {
    const {
      uploadSlice: { file, columnMapping },
      uploadSliceActions: { setStepIndex },
    } = useStore.getState();

    if (uploadGroup === "other" && uploadType === "unstructured") {
      //do nothing
    } else if (!file || Object.values(columnMapping).filter(Boolean).length === 0) {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }
  },
});

const SuccessDataQualityChecks = memo(
  ({
    dqResult,
    status,
    uploadData,
    uploadId,
  }: {
    dqResult: DataQualityCheck;
    status: DQStatus;
    uploadData: UploadResponse;
    uploadId: string;
  }) => {
    if (status === DQStatus.COMPLETED) {
      const { summary: _, critical_error_check = [], ...checks } = dqResult.dq_summary;

      const typedChecks = Object.keys(checks).map(key => checks[key] as Check[]);

      const { passed: totalPassedAssertions, failed: totalFailedAssertions } =
        sumAsertions(typedChecks);

      const totalAssertions = typedChecks.flat().length;

      const dataCheckItems = Object.keys(checks).map(key => {
        const check = checks[key] as Check[];
        return (
          <DataCheckItem
            data={check}
            hasDownloadButton={false}
            previewData={dqResult.dq_failed_rows_first_five_rows}
            title={key}
            uploadId={uploadId}
          />
        );
      });

      return (
        <>
          <AccordionItem title="Summary">
            <div className="flex flex-col gap-4">
              <SummaryBanner
                criticalErrors={critical_error_check[0].count_failed}
                totalAssertions={totalAssertions}
                totalFailedAssertions={totalFailedAssertions}
                totalPassedAssertions={totalPassedAssertions}
                uploadId={uploadId}
              />
              <SummaryChecks
                checkTimestamp={dqResult.creation_time}
                name={uploadData.original_filename}
                uploadTimestamp={uploadData.created}
              />
            </div>
          </AccordionItem>
          {dataCheckItems}
        </>
      );
    } else {
      return null;
    }
  },
);

function Success() {
  const { uploadGroup, uploadType } = Route.useParams();
  const {
    uploadSliceActions: { resetUploadSliceState },
    uploadSlice: { uploadId, source },
  } = useStore();

  const navigate = useNavigate({ from: "/upload/$uploadId" });

  const isUnstructured = uploadGroup === "other" && uploadType === "unstructured";

  const { data: basicCheckQuery, isFetching: isBasicCheckFetching } = useQuery({
    queryFn: () => api.uploads.list_basic_checks(uploadType, source),
    queryKey: ["basic_checks", uploadType, source],
  });
  const basicCheck = basicCheckQuery?.data ?? [];

  const { data: uploadQuery } = useQuery({
    queryKey: ["upload", uploadId],
    queryFn: () => api.uploads.get_upload(uploadId),
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
    queryKey: ["dq_check", uploadId],
    queryFn: () => api.uploads.get_data_quality_check(uploadId),
    refetchInterval: 7000,
    enabled: !isUnstructured,
  });

  const dqResult = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const status = dqResult?.status;

  const isError =
    status == DQStatus.ERROR ||
    status === DQStatus.SKIPPED ||
    status === DQStatus.TIMEOUT;

  const { mutateAsync: downloadFile, isPending: isPendingDownloadFile } = useMutation({
    mutationFn: api.uploads.download_data_quality_check,
  });

  const basicCheckItems = Object.entries(basicCheck).map(([key, value]) => {
    const basicCheckArraySchema = z.array(basicCheckSchema);
    const check = basicCheckArraySchema.safeParse(value);

    if (check.success) {
      return (
        <AccordionItem title={key}>
          <BasicDataQualityCheck data={check.data} />
        </AccordionItem>
      );
    } else {
      return null;
    }
  });

  async function handleDownloadFullChecks() {
    const blob = await downloadFile(uploadId);
    if (blob) {
      saveFile(blob);
    }
  }

  const handleSubmit = () => {
    if (status === DQStatus.COMPLETED) {
      navigate({ to: "/upload/$uploadId", params: { uploadId } });
    } else {
      navigate({ to: ".." });
    }
  };

  const unstructuredMessage =
    "Your file has been uploaded! Note that no checks will be performed on this file.";

  type TagColors = ComponentProps<typeof Tag>["type"];

  const statusTagMap: Record<DQStatus, { color: TagColors; text: string }> = {
    [DQStatus.IN_PROGRESS]: { color: "blue", text: "In Progress" },
    [DQStatus.COMPLETED]: { color: "green", text: "Success" },
    [DQStatus.ERROR]: { color: "red", text: "Failed" },
    [DQStatus.SKIPPED]: { color: "red", text: "Failed" },
    [DQStatus.TIMEOUT]: { color: "red", text: "Failed" },
  };

  let tagProps = null;
  if (status !== undefined) {
    tagProps = statusTagMap[status];
  }

  return (
    <>
      {isUnstructured ? (
        <>
          {unstructuredMessage}
          <Button as={Link} to="/" onClick={resetUploadSliceState} isExpressive>
            Back to Home
          </Button>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <div className="flex gap-6">
              <div className="flex border-b-2 border-gray-300">
                <div className=" bg-gray-100 py-4 pl-4 pr-28 text-base font-semibold">
                  Data Quality Review
                </div>
                <Button
                  className="bg-gray-100"
                  disabled={isRefetchingDqResultQuery}
                  renderIcon={Restart}
                  kind="ghost"
                  onClick={async () => await refetchDqResultQuery()}
                />
                <div className="flex items-center ">
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
                    <Loading small={true} withOverlay={false} />
                    Refreshing Automatically
                  </div>
                  <div className="flex items-center text-xs text-slate-600">
                    <div>Estimated running time: 10-15 mins</div>
                  </div>
                </>
              )}
            </div>
            {status == DQStatus.IN_PROGRESS && (
              <div className="py-6 text-blue-400">
                Congratulations! Your data file has been uploaded and data quality
                checks are <b> in progress.</b> Data quality report can be accessed
                below and also, in the Home page, searchable by the following Upload ID:
              </div>
            )}
            <div>
              {status == DQStatus.COMPLETED && (
                <>
                  Congratulations! Your data file has been uploaded and data quality
                  checks are successful with{" "}
                  <span className="text-green-600"> warning/are successful.</span> Data
                  quality report can be accessed below and also, in the Home page,
                  searchable by the following Upload ID:
                </>
              )}

              {isError && (
                <>
                  Your data file has been uploaded and data quality checks{" "}
                  <span className="text-orange-400">have failed.</span> Data quality
                  report can be accessed below and also, in the Home page, searchable by
                  the following Upload ID:
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-[33px] font-bold text-primary">
              {uploadId}
              <CopyButton
                onClick={() => {
                  navigator.clipboard.writeText(uploadId);
                }}
              />
            </div>
            <div className="flex justify-between">
              <div className="font-bold">
                You will receive an email with the quality report of data file{" "}
                {uploadId}
              </div>

              <Button
                kind="tertiary"
                className="flex cursor-pointer items-center"
                onClick={handleDownloadFullChecks}
                renderIcon={isPendingDownloadFile ? InlineLoading : Download}
                disabled={isPendingDownloadFile || status != DQStatus.COMPLETED}
              >
                Download
              </Button>
            </div>
            <Accordion align="start">
              {status === DQStatus.COMPLETED ? (
                <>
                  <SuccessDataQualityChecks
                    dqResult={dqResult}
                    status={status}
                    uploadData={uploadData}
                    uploadId={uploadId}
                  />
                </>
              ) : (
                <>{isBasicCheckFetching ? <AccordionSkeleton /> : basicCheckItems}</>
              )}
            </Accordion>
            <ButtonSet className="w-full">
              <Button
                as={Link}
                isExpressive
                kind="secondary"
                renderIcon={ArrowLeft}
                to=".."
              >
                Back
              </Button>
              <Button
                className={cn({
                  "bg-green-600 hover:bg-green-800": status === DQStatus.COMPLETED,
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
        </>
      )}
    </>
  );
}
