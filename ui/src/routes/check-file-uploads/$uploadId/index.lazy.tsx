import { useState } from "react";
import { createPortal } from "react-dom";

import { Accordion, AccordionItem, Link, Modal } from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useApi } from "@/api";
import Datatable from "@/components/upload/Datatable";

export const Route = createFileRoute("/check-file-uploads/$uploadId/")({
  component: Index,
});

type GeoSpatialRow = {
  id: string;
  value: string;
}[];

type DuplicateCheckRow = {
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

  const [
    isInvalidDuplicateChecksModalOpen,
    setIsInvalidDuplicateChecksModalOpen,
  ] = useState<boolean>(false);
  const [
    invalidDuplicateChecksValuesRows,
    setInvalidDuplicateChecksValuesRows,
  ] = useState<DuplicateCheckRow>([]);
  const [selectedDuplicateCheckRow, setSelectedDuplicateCheckRow] =
    useState<string>("");

  const api = useApi();

  const { data: dqResult, isLoading } = useQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => {
      const data = api.uploads.get_dq_check_result(uploadId); //This should be the actual dq check file name
      return data;
    },
  });

  const { data: fileProperties } = useQuery({
    queryKey: ["file_property", uploadId],
    queryFn: () => {
      const data = api.uploads.get_file_properties(uploadId);
      return data;
    },
  });

  const geospatialChecksHeaders = [
    {
      key: "check",
      header: "Check",
    },
    {
      key: "count",
      header: "Count",
    },
    {
      key: "actions",
      header: "Actions",
    },
  ];

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

  const invalidGeospatialChecksValuesHeaders = [
    {
      key: "value",
      header: "Value",
    },
  ];

  const duplicateChecksHeaders = [
    {
      key: "check",
      header: "Check",
    },
    {
      key: "count",
      header: "Count",
    },
    {
      key: "actions",
      header: "Actions",
    },
  ];

  const duplicateChecksRows = dqResult?.data.duplicate_rows_checks.map(
    check => {
      return {
        id: check.assertion,
        check: check.description,
        count: check.count_failed,
        actions: (
          <Link
            onClick={() => {
              setIsInvalidDuplicateChecksModalOpen(true);

              const rows = check.rows_failed.map(row => {
                return {
                  id: row,
                  value: row,
                };
              });

              setInvalidDuplicateChecksValuesRows(rows);
              setSelectedDuplicateCheckRow(check.description);
            }}
          >
            View Details
          </Link>
        ),
      };
    },
  );

  const invalidDuplicateChecksValuesHeaders = [
    {
      key: "value",
      header: "Value",
    },
  ];

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

  return (
    <div className="flex flex-col gap-8">
      <div
        onClick={() => {
          console.log(dqResult);
        }}
      >
        dq_result
      </div>

      <div
        onClick={() => {
          // console.log(summaryChecksHeaders);
        }}
      >
        Loggers
      </div>
      <div className="m-0 w-full">
        <div className="px=28 ">
          {isLoading ? (
            <Accordion align="start">
              <AccordionItem disabled title="Summary" />
              <AccordionItem disabled title="Checks per column" />
              <AccordionItem disabled title="Checks for duplicate rows" />
              <AccordionItem
                disabled
                title="Checks based on geospatial data points"
              />
            </Accordion>
          ) : (
            <Accordion align="start">
              <AccordionItem title="Summary">
                <p>File Uploaded at: {creationTime}</p>
                <p>Checks performed at {checksRunTime}</p>
                <div>
                  Rows: <b>{dqResult?.data.summary.rows ?? ""}</b>
                </div>
                <div>
                  Columns:<b>{dqResult?.data.summary.columns ?? ""}</b>
                </div>
              </AccordionItem>
              {/* <AccordionItem title="Checks per column">
                <div className="py-4">
                  These checks will be run on each column in the uploaded file
                </div>
                <PaginatedDatatable
                  headers={summaryChecksHeaders}
                  rows={checksPerColumnRows ?? []}
                />
              </AccordionItem> */}
              <AccordionItem title="Checks for duplicate rows">
                <div className="py-4">
                  These checks will count rows that appear to be duplicates
                  based on combinations of columns.
                </div>
                <Datatable
                  headers={duplicateChecksHeaders ?? []}
                  rows={duplicateChecksRows ?? []}
                />
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
          )}
        </div>
      </div>

      {isInvalidDuplicateChecksModalOpen &&
        createPortal(
          <div className="w-[200px]">
            <Modal
              modalHeading="Invalid Values Check"
              open={isInvalidDuplicateChecksModalOpen}
              passiveModal
              onRequestClose={() => setIsInvalidDuplicateChecksModalOpen(false)}
            >
              There are <b>{invalidDuplicateChecksValuesRows.length}</b> invalid
              values in <b>{selectedDuplicateCheckRow}</b>:
              <Datatable
                headers={invalidDuplicateChecksValuesHeaders ?? []}
                rows={invalidDuplicateChecksValuesRows ?? []}
              />
            </Modal>
          </div>,

          document.body,
        )}

      {isInvalidGeospatialChecksModalOpen &&
        createPortal(
          <div className="w-[200px]">
            <Modal
              modalHeading="Invalid Values Check"
              open={isInvalidGeospatialChecksModalOpen}
              passiveModal
              onRequestClose={() =>
                setIsInvalidGeospatialChecksModalOpen(false)
              }
            >
              There are <b>{invalidGeospatialChecksValuesRows.length}</b>{" "}
              invalid values in <b>{selectedGeoSpatialCheckRow}</b>:
              <Datatable
                headers={invalidGeospatialChecksValuesHeaders ?? []}
                rows={invalidGeospatialChecksValuesRows ?? []}
              />
            </Modal>
          </div>,

          document.body,
        )}
    </div>
  );
}
