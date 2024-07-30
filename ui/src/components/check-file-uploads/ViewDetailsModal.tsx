import type { Dispatch, SetStateAction } from "react";

import {
  DataTable,
  type DataTableHeader,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

import type { DqFailedRowValues } from "@/types/upload";

interface ViewDetailsModalProps {
  assertion: string;
  column: string;
  previewData: DqFailedRowValues[];
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ViewDetailsModal = ({
  assertion,
  column,
  open,
  previewData,
  setOpen,
}: ViewDetailsModalProps) => {
  const headers: DataTableHeader[] = [
    { key: "assertion", header: "Assertion" },
    { key: "column", header: "Column" },
    { key: "value", header: "Value" },
  ];

  const rows = previewData.map((data, index) => {
    return {
      id: `${assertion}-${column}-${index}`,
      assertion: assertion,
      column: column,
      value: data[column] === null ? "null" : data[column],
    };
  });

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <Modal
      modalHeading={assertion}
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
                    <TableHeader
                      colSpan={1}
                      {...getHeaderProps({ header })}
                      key={header.key}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
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
