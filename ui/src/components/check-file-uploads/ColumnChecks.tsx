import { useState } from "react";

import { Information } from "@carbon/icons-react";
import { DataTableSkeleton, Link, Modal, Tooltip } from "@carbon/react";

import PaginatedDatatable from "@/components/upload/PaginatedDatatable";
import { columnChecksHeaders } from "@/constants/check-file-uploads";
import { columnCheckModalHeaders } from "@/constants/check-file-uploads";
import { DataQualityCheckResult } from "@/types/upload";
import { ColumnCheck } from "@/types/upload";

import Datatable from "../upload/Datatable";
import StatusIndicator from "../upload/StatusIndicator";

type ColumnCheckRow = {
  id: string;
  value: string;
  count: number;
}[];

export default function ColumnChecks({
  data: data,
  isLoading: isLoading,
}: {
  data: DataQualityCheckResult | undefined;
  isLoading: boolean;
}) {
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

  if (data === undefined) return <></>;

  const columnChecksRows = data.column_checks.map(check => {
    return {
      id: check.assertion,
      columnName: (
        <Tooltip
          align="right"
          enterDelayMs={150}
          label={`${check.description}`}
          leaveDelayMs={0}
        >
          <div className="flex gap-1">
            {check.assertion}
            <div className="flex items-center opacity-25">
              <Information />
            </div>
          </div>
        </Tooltip>
      ),
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

  const columnCheckPassedRows = data.column_checks.reduce(
    (acc, curr) =>
      curr.is_present === true &&
      curr.is_correct_datatype === true &&
      curr.null_values_count === 0
        ? acc + 1
        : acc,
    0,
  );

  const columnCheckFailedRows = data.column_checks.reduce(
    (acc, curr) =>
      curr.is_present !== true ||
      curr.is_correct_datatype !== true ||
      curr.null_values_count !== 0
        ? acc + 1
        : acc,
    0,
  );

  if (isLoading)
    return <DataTableSkeleton headers={columnCheckModalHeaders ?? []} />;

  return (
    <>
      <div className="py-4">
        Out of {data.column_checks.length} columns,{" "}
        <b>{columnCheckPassedRows}</b> passed and had{" "}
        <b>{columnCheckFailedRows}</b> errors
      </div>
      <PaginatedDatatable
        headers={columnChecksHeaders}
        rows={columnChecksRows ?? []}
      />

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
      </Modal>
    </>
  );
}
