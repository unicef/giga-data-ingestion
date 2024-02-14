import { useState } from "react";
import { createPortal } from "react-dom";

import {
  Accordion,
  AccordionItem,
  Button,
  Heading,
  Link,
  Modal,
  Section,
  SkeletonText,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link as TanstackLink, createFileRoute } from "@tanstack/react-router";

import { useApi } from "@/api";
import ColumnChecks from "@/components/check-file-uploads/ColumnChecks";
import DuplicateChecks from "@/components/check-file-uploads/DuplicateChecks";
import Datatable from "@/components/upload/Datatable";
import {
  geospatialChecksHeaders,
  geospatialChecksModalHeaders,
} from "@/constants/check-file-uploads";

export const Route = createFileRoute("/check-file-uploads/$uploadId/")({
  component: Index,
});

type GeoSpatialRow = {
  id: string;
  value: string;
}[];



export default function Index() {
  const { uploadId } = Route.useParams();

  const [
    isInvalidGeospatialChecksModalOpen,
    setIsInvalidGeospatialChecksModalOpen,
  ] = useState<boolean>(false);
  const [
    invalidGeospatialChecksValuesRows,
    setInvalidGeospatialChecksValuesRows,
  ] = useState<GeoSpatialRow>([]);
  const [selectedGeoSpatialCheckRow, setSelectedGeospatialCheckRow] =
    useState<string>("");

  const api = useApi();

  const { data: dqResult, isLoading: dqResultLoading } = useQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => {
      const data = api.uploads.get_dq_check_result(uploadId);
      return data;
    },
  });

  const { data: fileProperties, isLoading: filePropertiesLoading } = useQuery({
    queryKey: ["file_property", uploadId],
    queryFn: () => {
      const data = api.uploads.get_file_properties(uploadId);
      return data;
    },
  });

  const geospatialChecksRows = dqResult?.data.geospatial_points_checks.map(
    check => {
      return {
        id: check.assertion,
        check: check.description,
        count: check.count_failed,
        actions: (
          <Link
            onClick={() => {
              setIsInvalidGeospatialChecksModalOpen(true);

              const rows = check.rows_failed.map(row => {
                return {
                  id: row,
                  value: row,
                };
              });

              setInvalidGeospatialChecksValuesRows(rows);
              setSelectedGeospatialCheckRow(check.description);
            }}
          >
            View Details
          </Link>
        ),
      };
    },
  );

  let creationTime = "";
  let checksRunTime = "";

  if (fileProperties) {
    creationTime = new Date(
      fileProperties?.data.creation_time,
    ).toLocaleString();
  }

  if (dqResult) {
    checksRunTime = new Date(dqResult.data.summary.timestamp).toLocaleString();
  }

  const title = fileProperties?.data.name.split("_")[2];

  return (
    <div className="flex flex-col gap-8">
      <div className="m-0 w-full">
        <div className="px=28 ">
          {dqResultLoading && filePropertiesLoading ? (
            <div>
              <SkeletonText paragraph />
              <Accordion align="start">
                <AccordionItem disabled title="Summary" />
                <AccordionItem disabled title="Checks per column" />
                <AccordionItem disabled title="Checks for duplicate rows" />
                <AccordionItem
                  disabled
                  title="Checks based on geospatial data points"
                />
              </Accordion>
            </div>
          ) : (
            <div>
              <Section>
                <Section>
                  <Heading className="capitalize">School {title}</Heading>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    Duis aute irure dolor in reprehenderit in voluptate velit
                    esse cillum dolore eu fugiat nulla pariatur.
                  </p>
                </Section>
              </Section>
              <Accordion align="start">
                <AccordionItem title="Summary">
                  <p>File Uploaded at: {creationTime}</p>
                  <p>Checks performed at {checksRunTime}</p>
                </AccordionItem>
                <AccordionItem title="Checks per column">
                  <ColumnChecks data={dqResult?.data} />
                </AccordionItem>
                <AccordionItem title="Checks for duplicate rows">
                  <DuplicateChecks data={dqResult?.data} />
                </AccordionItem>
                <AccordionItem title="Checks based on geospatial data points">
                  <div className="py-4">
                    Total Number of Rows with Warnings:{" "}
                    <b>{geospatialChecksRows?.length} rows</b>
                  </div>
                  <Datatable
                    headers={geospatialChecksHeaders ?? []}
                    rows={geospatialChecksRows ?? []}
                  />
                </AccordionItem>
              </Accordion>
              <div className="flex flex-col gap-4 pt-4">
                <p>
                  After addressing the above checks, you may try to reupload
                  your file
                </p>
                <Button as={TanstackLink} to="/upload">
                  Reupload
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isInvalidGeospatialChecksModalOpen &&
        createPortal(
          <Modal
            modalHeading="Invalid Values Check"
            open={isInvalidGeospatialChecksModalOpen}
            passiveModal
            onRequestClose={() => setIsInvalidGeospatialChecksModalOpen(false)}
          >
            There are <b>{invalidGeospatialChecksValuesRows.length}</b> invalid
            values in <b>{selectedGeoSpatialCheckRow}</b>:
            <Datatable
              headers={geospatialChecksModalHeaders ?? []}
              rows={invalidGeospatialChecksValuesRows ?? []}
            />
          </Modal>,
          document.body,
        )}
    </div>
  );
}
