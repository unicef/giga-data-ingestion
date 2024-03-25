import { useEffect, useMemo, useState } from "react";

import { ArrowLeft, ArrowRight, Checkmark, QX } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  DataTable,
  DataTableHeader,
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
// @ts-expect-error missing types https://github.com/carbon-design-system/carbon/issues/14831
import Pagination from "@carbon/react/lib/components/Pagination/Pagination";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api, queryClient } from "@/api";
import { useStore } from "@/context/store";
import { cn } from "@/lib/utils.ts";
import { CarbonDataTableRow } from "@/types/datatable";
import { KeyValueObject } from "@/types/datatable";
import { getValueByHeader } from "@/utils/approval_requests";
import { transformToKeyValueObject } from "@/utils/datatable";

export const Route = createFileRoute("/approval-requests/$subpath/")({
  component: ApproveRejectTable,
  loader: ({ params: { subpath } }) => {
    return queryClient.ensureQueryData({
      queryFn: () => api.approvalRequests.get(subpath),
      queryKey: ["approval-requests", subpath],
    });
  },
});

function ApproveRejectTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { subpath } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    approveRowActions: {
      setHeaders,
      setRows,
      setApprovedRows,
      setRejectedRows,
      resetApproveRowState,
    },
    approveRowState: { approvedRowsList, rejectedRowsList },
  } = useStore();
  const {
    data: {
      data: { info, data: approvalRequests },
    },
  } = useSuspenseQuery({
    queryFn: () => api.approvalRequests.get(subpath),
    queryKey: ["approval-requests", subpath],
  });

  const headers: DataTableHeader[] = useMemo(
    () =>
      Object.keys(approvalRequests[0]).map(key => ({
        key,
        header: key,
      })),
    [approvalRequests],
  );

  useEffect(() => resetApproveRowState(), [resetApproveRowState]);

  const formattedRows = useMemo<KeyValueObject[]>(() => {
    const formattedData: KeyValueObject[] = approvalRequests.map(row => {
      const rowWithId = { ...row, id: row.school_id_giga };

      const entries = Object.entries(rowWithId).map(([key, value]) => {
        if (key == "id") return [key, value];

        return [key, value === null ? "NULL" : value];
      });

      return Object.fromEntries(entries);
    });

    return formattedData;
  }, [approvalRequests]);

  const unselectedRows = useMemo<KeyValueObject[]>(() => {
    return formattedRows.filter(
      approvalRequest =>
        !approvedRowsList.includes(approvalRequest.school_id_giga ?? "") &&
        !rejectedRowsList.includes(approvalRequest.school_id_giga ?? ""),
    );
  }, [formattedRows, approvedRowsList, rejectedRowsList]);

  const unselectedRowSlice = useMemo<KeyValueObject[]>(() => {
    return unselectedRows.slice((page - 1) * pageSize, page * pageSize);
  }, [page, pageSize, unselectedRows]);

  const handleApproveRows = (rows: KeyValueObject[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "NULL");
    setApprovedRows([...approvedRowsList, ...ids]);
    setHeaders(headers);
    setRows(formattedRows);
  };

  const handleRejectRows = (rows: KeyValueObject[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "NULL");
    setRejectedRows([...rejectedRowsList, ...ids]);
    setHeaders(headers);
    setRows(formattedRows);
  };

  const handleProceed = () => {
    navigate({
      to: "/approval-requests/$subpath/confirm",
      params: {
        subpath: subpath,
      },
    });
  };

  return (
    <>
      <Section className="container py-6">
        <DataTable
          headers={headers}
          rows={unselectedRowSlice as CarbonDataTableRow}
        >
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
                      {info.country}-{info.dataset}
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
                          transformToKeyValueObject(selectedRows);
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
                          transformToKeyValueObject(selectedRows);
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
                                  <p className="line-through">
                                    {cell.value.old ?? "NULL"}
                                  </p>
                                  <p className="">
                                    {cell.value.update ?? "NULL"}
                                  </p>
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
        <Pagination
          onChange={({
            pageSize,
            page,
          }: {
            pageSize: number;
            page: number;
          }) => {
            setPage(page);
            setPageSize(pageSize);
          }}
          page={1}
          pageSize={pageSize}
          pageSizes={[10, 25, 50]}
          totalItems={unselectedRows.length}
        />
        <ButtonSet className="w-full">
          <Button
            as={Link}
            className="w-full"
            isExpressive
            kind="secondary"
            renderIcon={ArrowLeft}
            to=".."
          >
            Cancel
          </Button>
          <Button
            className="w-full"
            isExpressive
            renderIcon={ArrowRight}
            type="submit"
            onClick={handleProceed}
          >
            Proceed
          </Button>
        </ButtonSet>
      </Section>
    </>
  );
}
