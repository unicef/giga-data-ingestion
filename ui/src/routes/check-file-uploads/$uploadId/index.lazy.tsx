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
import Datatable from "@/components/upload/Datatable";
import PaginatedDatatable from "@/components/upload/PaginatedDatatable";
import StatusIndicator from "@/components/upload/StatusIndicator";
import {
  columnCheckModalHeaders,
  columnChecksHeaders,
  duplicateCheckModalHeaders,
  duplicateChecksHeaders,
  geospatialChecksHeaders,
  geospatialChecksModalHeaders,
} from "@/constants/check-file-uploads";
import { ColumnCheck } from "@/types/upload";

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

type ColumnCheckRow = {
  id: string;
  value: string;
  count: number;
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

  const [isColumnChecksModalOpen, setIsColumnChecksModalOpen] =
    useState<boolean>(false);
  const [columnCheckModalRows, setColumnCheckModalRows] =
    useState<ColumnCheckRow>([]);
  const [selectedColumnCheck, setSelectedColumnCheck] = useState<ColumnCheck>({
    assertion: "",
    description: "",
    data_type: "",
    is_present: false,
    is_correct_datatype: false,
    null_values_count: 0,
    unique_values_count: 0,
    unique_values: [],
    rows_failed: [],
  });

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

  const columnChecksRows = dqResult?.data.column_checks.map(check => {
    return {
      id: check.assertion,
      columnName: check.assertion,
      expectedDataType: check.data_type,
      isPresent: (
        <div className="flex">
          <StatusIndicator
            className="mr-1"
            type={check.is_present ? "success" : "error"}
          />
          Present
        </div>
      ),
      isCorrectDatatype: (
        <div className="flex">
          <StatusIndicator
            className="mr-1"
            type={check.is_correct_datatype ? "success" : "error"}
          />
          {check.data_type}
        </div>
      ),
      nullValuesCount: (
        <div className="flex">
          <StatusIndicator
            className="mr-1"
            type={check.null_values_count == 0 ? "success" : "error"}
          />
          {check.null_values_count} null values
        </div>
      ),
      uniqueValuesCount: (
        <div className="flex">
          <StatusIndicator className="mr-1" type="info" />
          {check.unique_values_count} unique values
        </div>
      ),
      actions: (
        <Link
          onClick={() => {
            setIsColumnChecksModalOpen(true);

            const rows = check.unique_values.map(row => {
              return {
                id: row.name,
                value: row.name,
                count: row.count,
              };
            });

            setSelectedColumnCheck(check);
            setColumnCheckModalRows(rows);
          }}
        >
          View Details
        </Link>
      ),
    };
  });

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

  const columnCheckPassedRows = dqResult?.data.column_checks.reduce(
    (acc, curr) =>
      curr.is_present === true &&
      curr.is_correct_datatype === true &&
      curr.null_values_count === 0
        ? acc + 1
        : acc,
    0,
  );

  const columnCheckFailedRows = dqResult?.data.column_checks.reduce(
    (acc, curr) =>
      curr.is_present !== true ||
      curr.is_correct_datatype !== true ||
      curr.null_values_count !== 0
        ? acc + 1
        : acc,
    0,
  );

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
                  <div className="py-4">
                    Out of {dqResult?.data.column_checks.length} columns,{" "}
                    <b>{columnCheckPassedRows}</b> passed and had{" "}
                    <b>{columnCheckFailedRows}</b> errors
                  </div>
                  <PaginatedDatatable
                    headers={columnChecksHeaders}
                    rows={columnChecksRows ?? []}
                  />
                </AccordionItem>
                <AccordionItem title="Checks for duplicate rows">
                  <div className="py-4">
                    Total suspected duplicate rows:{" "}
                    <b>{duplicateChecksRows?.length} rows</b>
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

      {isColumnChecksModalOpen &&
        createPortal(
          <Modal
            modalHeading="Unique Values Check"
            open={isColumnChecksModalOpen}
            passiveModal
            onRequestClose={() => setIsColumnChecksModalOpen(false)}
          >
            <p>
              {" "}
              There are <b>{selectedColumnCheck.unique_values_count}</b> unique
              values in <b>{selectedColumnCheck.assertion}</b>
            </p>
            <Datatable
              headers={columnCheckModalHeaders ?? []}
              rows={columnCheckModalRows ?? []}
            />
          </Modal>,
          document.body,
        )}

      {isInvalidDuplicateChecksModalOpen &&
        createPortal(
          <Modal
            modalHeading="Invalid Values Check"
            open={isInvalidDuplicateChecksModalOpen}
            passiveModal
            onRequestClose={() => setIsInvalidDuplicateChecksModalOpen(false)}
          >
            There are <b>{invalidDuplicateChecksValuesRows.length}</b> invalid
            values in <b>{selectedDuplicateCheckRow}</b>:
            <Datatable
              headers={duplicateCheckModalHeaders ?? []}
              rows={invalidDuplicateChecksValuesRows ?? []}
            />
          </Modal>,
          document.body,
        )}

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
