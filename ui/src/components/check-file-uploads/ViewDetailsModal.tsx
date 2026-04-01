import { Dispatch, SetStateAction } from "react";

import {
  DataTable,
  DataTableHeader,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

import { DqFailedRowValues } from "@/types/upload";

import { formatAssertion } from "./ColumnChecks";

interface ViewDetailsModalProps {
  assertion: string;
  column: string;
  previewData: DqFailedRowValues[];
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const COLUMN_HEADERS: Record<string, string> = {
  school_id_govt: "School ID",
  school_name: "School Name",
  admin1: "Region",
  admin2: "District",
  latitude: "Latitude",
  longitude: "Longitude",
  education_level: "Education Level",
};

const ViewDetailsModal = ({
  assertion,
  column,
  open,
  previewData,
  setOpen,
}: ViewDetailsModalProps) => {
  const formatValue = (value: string | number | null | undefined) => {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim().toLowerCase() === "nan") ||
      (typeof value === "number" && isNaN(value));

    if (isEmpty) {
      return <span className="italic text-gray-400">(Empty)</span>;
    }
    return value;
  };

  const dynamicColumns =
    previewData.length > 0 ? Object.keys(previewData[0]) : [];

  const headers: DataTableHeader[] = dynamicColumns.map(col => ({
    key: col,
    header:
      COLUMN_HEADERS[col] ??
      col.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
  }));

  const rows = previewData.map((data, index) => ({
    id: `${assertion}-${column}-${index}`,
    ...Object.fromEntries(
      dynamicColumns.map(col => [col, formatValue(data[col])]),
    ),
  }));

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <Modal
      modalHeading={`Rows failing: ${formatAssertion(assertion)}`}
      open={open}
      passiveModal
      primaryButtonText="Proceed"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
    >
      <DataTable headers={headers} rows={rows}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                    <TableHeader colSpan={1} {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow {...getRowProps({ row })}>
                    {row.cells.map(cell => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </Modal>
  );
};

export default ViewDetailsModal;
