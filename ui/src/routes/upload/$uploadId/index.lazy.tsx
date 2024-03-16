import { useMemo } from "react";

import {
  Accordion,
  AccordionItem,
  Button,
  Heading,
  Section,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import DataCheckItem from "@/components/check-file-uploads/DataCheckItem";
import SummaryBanner from "@/components/check-file-uploads/SummaryBanner";
import SummaryChecks from "@/components/check-file-uploads/SummaryChecks";
import UploadCheckSkeleton from "@/components/check-file-uploads/UploadCheckSkeleton";
import { UploadResponse, initialUploadResponse } from "@/types/upload";
import { DataQualityCheck, initialDataQualityCheck } from "@/types/upload";
import { sumAsertions } from "@/utils/data_quality";

export const Route = createFileRoute("/upload/$uploadId/")({
  component: Index,
});

function Index() {
  const { uploadId } = Route.useParams();

  const {
    data: dqResultQuery,
    isLoading: dqResultIsLoading,
    isFetching: dqResultIsFetching,
  } = useQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => {
      const data = api.uploads.get_data_quality_check(uploadId);
      return data;
    },
  });

  const dqResultData = useMemo<DataQualityCheck>(
    () => dqResultQuery?.data ?? initialDataQualityCheck,
    [dqResultQuery],
  );

  const {
    data: uploadQuery,
    isLoading: uploadisLoading,
    isFetching: uploadIsFetching,
  } = useQuery({
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
    uploadisLoading ||
    uploadIsFetching
  )
    return <UploadCheckSkeleton />;

  const {
    dq_summary: {
      format_validation_checks,
      completeness_checks,
      domain_checks,
      range_checks,
      duplicate_rows_checks,
      geospatial_checks,
    },
  } = dqResultData;

  const { passed: totalPassedAssertions, failed: totalFailedAssertions } =
    sumAsertions([
      format_validation_checks,
      completeness_checks,
      domain_checks,
      range_checks,
      duplicate_rows_checks,
      geospatial_checks,
    ]);

  const totalAssertions = [
    ...format_validation_checks,
    ...completeness_checks,
    ...domain_checks,
    ...range_checks,
    ...duplicate_rows_checks,
    ...geospatial_checks,
  ].length;

  const hasCriticalError =
    dqResultData.dq_summary.critical_error_check[0].percent_passed != 100;

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

              <DataCheckItem
                data={format_validation_checks}
                previewData={dqResultData.dq_failed_rows_first_five_rows}
                title="Format Validation Checks"
                uploadId={uploadId}
              />

              <DataCheckItem
                data={completeness_checks}
                previewData={dqResultData.dq_failed_rows_first_five_rows}
                title="Completeness Checks"
                uploadId={uploadId}
              />

              <DataCheckItem
                data={domain_checks}
                previewData={dqResultData.dq_failed_rows_first_five_rows}
                title="Domain Checks"
                uploadId={uploadId}
              />

              <DataCheckItem
                data={range_checks}
                previewData={dqResultData.dq_failed_rows_first_five_rows}
                title="Range Checks"
                uploadId={uploadId}
              />

              <DataCheckItem
                data={duplicate_rows_checks}
                previewData={dqResultData.dq_failed_rows_first_five_rows}
                title="Duplicate Rows Checks"
                uploadId={uploadId}
              />

              <DataCheckItem
                data={geospatial_checks}
                previewData={dqResultData.dq_failed_rows_first_five_rows}
                title="Geospatial Checks"
                uploadId={uploadId}
              />
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
