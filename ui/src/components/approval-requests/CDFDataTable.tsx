import { ComponentProps } from "react";

import { Checkmark, QX } from "@carbon/icons-react";
import {
  DataTable,
  DataTableSkeleton,
  Section,
  Table,
  TableBatchAction,
  TableBatchActions,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
  TableToolbar,
} from "@carbon/react";
import { DataTable as CarbonDataTable } from "@carbon/react/lib/components/DataTable";
// @ts-expect-error missing types https://github.com/carbon-design-system/carbon/issues/14831
import Pagination from "@carbon/react/lib/components/Pagination/Pagination";

import { cn } from "@/lib/utils.ts";
import { ApprovalRequestInfo } from "@/types/approvalRequests.ts";
import { getValueByHeader } from "@/utils/approval_requests.ts";
import { transformSelectedRowsToKeyValArray } from "@/utils/datatable.ts";

interface CDFDataTableProps {
  headers: ComponentProps<typeof CarbonDataTable>["headers"];
  rows: ComponentProps<typeof CarbonDataTable>["rows"];
  info: ApprovalRequestInfo;
  handleApproveRows: (rows: Record<string, string | null>[]) => void;
  handleRejectRows: (rows: Record<string, string | null>[]) => void;
  handlePaginationChange: ({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) => void;
  page: number;
  pageSize: number;
  count: number;
  isLoading?: boolean;
}

function CDFDataTable({
  headers,
  rows,
  info,
  handleApproveRows,
  handleRejectRows,
  handlePaginationChange,
  page,
  pageSize,
  count,
  isLoading = false,
}: CDFDataTableProps) {
  return (
    <>
      <Section className="container py-6">
        {isLoading ? (
          <DataTableSkeleton headers={headers} title="Approve Rows" />
        ) : (
          <DataTable headers={headers} rows={rows}>
            {({
              rows,
              headers,
              getHeaderProps,
              getRowProps,
              getSelectionProps,
              getToolbarProps,
              getBatchActionProps,
              selectedRows,
              getTableProps,
              getTableContainerProps,
              selectRow,
            }) => {
              const batchActionProps = {
                ...getBatchActionProps({
                  onSelectAll: () => {
                    rows.map(row => {
                      if (!row.isSelected) {
                        selectRow(row.id);
                      }
                    });
                  },
                }),
              };
              return (
                <TableContainer
                  title="Approve Rows"
                  description={
                    <>
                      <span>
                        {info.country} - {info.dataset}
                      </span>
                      <br />
                      <span>
                        Select rows to approve or reject below. You may opt to
                        review only a subset of the rows.
                      </span>
                    </>
                  }
                  {...getTableContainerProps()}
                >
                  <TableToolbar {...getToolbarProps()}>
                    <TableBatchActions {...batchActionProps}>
                      <TableBatchAction
                        tabIndex={
                          batchActionProps.shouldShowBatchActions ? 0 : -1
                        }
                        renderIcon={Checkmark}
                        onClick={() => {
                          const keyValueObject =
                            transformSelectedRowsToKeyValArray(selectedRows);
                          handleApproveRows(keyValueObject);
                        }}
                      >
                        Approve Rows
                      </TableBatchAction>
                      <TableBatchAction
                        tabIndex={
                          batchActionProps.shouldShowBatchActions ? 0 : -1
                        }
                        renderIcon={QX}
                        onClick={() => {
                          const keyValueObject =
                            transformSelectedRowsToKeyValArray(selectedRows);
                          handleRejectRows(keyValueObject);
                        }}
                      >
                        Reject Rows
                      </TableBatchAction>
                    </TableBatchActions>
                  </TableToolbar>
                  <Table {...getTableProps()} aria-label="sample table">
                    <TableHead>
                      <TableRow>
                        {/* @ts-expect-error inconsistencies within sub components https://github.com/carbon-design-system/carbon/issues/14831 */}
                        <TableSelectAll {...getSelectionProps()} />
                        {headers.map(header => (
                          // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                          <TableHeader
                            {...getHeaderProps({
                              header,
                            })}
                          >
                            {header.header}
                          </TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map(row => {
                        const changeType = getValueByHeader(
                          row.cells,
                          "_change_type",
                        );

                        return (
                          <TableRow
                            className={cn({
                              "bg-green-300": changeType === "insert",
                              "bg-yellow-200": changeType === "update_preimage",
                            })}
                            {...getRowProps({
                              row,
                            })}
                          >
                            {/* @ts-expect-error radio buttons bad type  https://github.com/carbon-design-system/carbon/issues/14831 */}
                            <TableSelectRow
                              {...getSelectionProps({
                                row,
                              })}
                            />
                            {row.cells.map(cell => (
                              <TableCell key={cell.id}>
                                {typeof cell.value === "object" ? (
                                  <>
                                    <s>{cell.value.old ?? "NULL"}</s>
                                    <p>{cell.value.update ?? "NULL"}</p>
                                  </>
                                ) : (
                                  cell.value
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            }}
          </DataTable>
        )}
        <Pagination
          onChange={handlePaginationChange}
          page={page}
          pageSize={pageSize}
          pageSizes={[10, 25, 50]}
          totalItems={count}
        />
      </Section>
    </>
  );
}

export default CDFDataTable;
