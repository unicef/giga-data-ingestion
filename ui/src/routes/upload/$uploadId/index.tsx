import { useMemo } from "react";

import {
  Accordion,
  AccordionItem,
  Button,
  Heading,
  Section,
} from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import DataCheckItem from "@/components/check-file-uploads/DataCheckItem";
import SummaryBanner from "@/components/check-file-uploads/SummaryBanner";
import SummaryChecks from "@/components/check-file-uploads/SummaryChecks";
import UploadCheckSkeleton from "@/components/check-file-uploads/UploadCheckSkeleton";
import { Check } from "@/types/upload";
import {
  DataQualityCheck,
  UploadResponse,
  initialDataQualityCheck,
  initialUploadResponse,
} from "@/types/upload";
import { sumAsertions } from "@/utils/data_quality";

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
});

function Index() {
  const { uploadId } = Route.useParams();

  const {
    data: dqResultQuery,
    isLoading: dqResultIsLoading,
    isFetching: dqResultIsFetching,
  } = useSuspenseQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => api.uploads.get_data_quality_check(uploadId),
  });

  const dqResultData = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const {
    data: uploadQuery,
    isLoading: uploadIsLoading,
    isFetching: uploadIsFetching,
  } = useSuspenseQuery({
    queryKey: ["upload", uploadId],
    queryFn: () => api.uploads.get_upload(uploadId),
  });

  const uploadData = useMemo<UploadResponse>(
    () => uploadQuery?.data ?? initialUploadResponse,
    [uploadQuery],
  );

  if (
    dqResultIsLoading ||
    dqResultIsFetching ||
    uploadIsLoading ||
    uploadIsFetching
  )
    return <UploadCheckSkeleton />;

  const {
    summary: _,
    critical_error_check = [],
    ...checks
  } = dqResultData.dq_summary;

  const typedChecks = Object.keys(checks).map(key => checks[key] as Check[]);

  const { passed: totalPassedAssertions, failed: totalFailedAssertions } =
    sumAsertions(typedChecks);

  const totalAssertions = typedChecks.flat().length;

  const hasCriticalError =
    (critical_error_check as Check[]).length > 0 &&
    (critical_error_check as Check[])[0].percent_passed != 100;

  const dataCheckItems = Object.keys(checks).map(key => {
    const check = checks[key] as Check[];
    return (
      <DataCheckItem
        data={check}
        previewData={dqResultData.dq_failed_rows_first_five_rows}
        title={key}
        uploadId={uploadId}
      />
    );
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="m-0 w-full">
        <div className="px=28 ">
          <div>
            <Section>
              <Section>
                <Heading className="capitalize">
                  School {uploadData.dataset}
                </Heading>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur.
                </p>
              </Section>
            </Section>
            <Accordion align="start">
              <AccordionItem title="Summary">
                <div className="flex flex-col gap-4">
                  <SummaryBanner
                    hasCriticalError={hasCriticalError}
                    totalAssertions={totalAssertions}
                    totalFailedAssertions={totalFailedAssertions}
                    totalPassedAssertions={totalPassedAssertions}
                    uploadId={uploadId}
                  />
                  <SummaryChecks
                    checkTimestamp={dqResultData.creation_time}
                    name={uploadData.original_filename}
                    uploadTimestamp={uploadData.created}
                  />
                </div>
              </AccordionItem>

              {dataCheckItems}
            </Accordion>
            <div className="flex flex-col gap-4 pt-4">
              <p>
                After addressing the above checks, you may try to reupload your
                file
              </p>
              <Button as={Link} to="/upload">
                Reupload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
