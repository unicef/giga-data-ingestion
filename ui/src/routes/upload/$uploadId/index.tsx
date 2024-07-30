import { useMemo } from "react";

import { Accordion, AccordionItem, Button, Heading, Section } from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import DataCheckItem from "@/components/check-file-uploads/DataCheckItem";
import SummaryBanner from "@/components/check-file-uploads/SummaryBanner";
import SummaryChecks from "@/components/check-file-uploads/SummaryChecks";
import UploadCheckSkeleton from "@/components/check-file-uploads/UploadCheckSkeleton";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import type { Check } from "@/types/upload";
import {
  type DataQualityCheck,
  type UploadResponse,
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
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
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

  if (dqResultIsLoading || dqResultIsFetching || uploadIsLoading || uploadIsFetching)
    return <UploadCheckSkeleton />;

  const { summary: _, critical_error_check = [], ...checks } = dqResultData.dq_summary;

  const typedChecks = Object.keys(checks).map(key => checks[key] as Check[]);

  const { passed: totalPassedAssertions, failed: totalFailedAssertions } =
    sumAsertions(typedChecks);

  const totalAssertions = typedChecks.flat().length;

  const dataCheckItems = Object.keys(checks).map(key => {
    const check = checks[key] as Check[];
    return (
      <DataCheckItem
        data={check}
        previewData={dqResultData.dq_failed_rows_first_five_rows}
        title={key}
        uploadId={uploadId}
        key={key}
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
                <Heading className="capitalize">School {uploadData.dataset}</Heading>
                <>
                  <p className="cds--label-description">
                    This page can be used to check on the progress of all 156 data
                    quality checks or “assertions” being performed on your data.
                  </p>
                  <p className="cds--label-description">
                    It will label each assertion and provide an overall summary of those
                    that have been successful, those with errors and those with critical
                    errors. Data which contains any critical errors will not pass these
                    validation checks and will not be loaded to Project Connect.
                  </p>{" "}
                  <p className="cds--label-description">
                    This page can be used to identify which, if any, quality tests your
                    data has failed on, the values causing the failure and a suggestion
                    as to what is needed to fix it. A full summary report will be
                    emailed to but, and is also available to be downloaded as a .csv
                    file for use offline. In the event your data contains critical
                    errors which need to be fixed, this page is designed to help assist
                    you with those necessary changes before re-uploading your data
                    again.
                  </p>{" "}
                  <p className="cds--label-description">
                    Users can expect a wait time of approx.15 minutes for all checks to
                    be carried out successfully, at which time an email will be sent
                    with a full report and the “DQ Check Status” will show as
                    “Completed” in the File Uploads table. Once all data checks have
                    been completed with 0 critical errors, a final approval request will
                    be made to ingest your data into Project Connect. Data will not be
                    displayed on the live site until this process is complete.”
                  </p>
                </>
              </Section>
            </Section>
            <Accordion align="start">
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
                After addressing the above checks, you may try to reupload your file
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
