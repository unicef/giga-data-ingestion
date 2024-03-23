import { useMemo, useState } from "react";

import { Checkmark } from "@carbon/icons-react";
import {
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

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
  const { subpath } = Route.useParams();

  const navigate = useNavigate({ from: Route.fullPath });

  const {
    approveRowActions: { setHeaders, setRows, setApprovedRows },
  } = useStore();

  const {
    data: {
      data: { info, data },
    },
  } = useSuspenseQuery({
    queryFn: () => api.approvalRequests.get(subpath),
    queryKey: ["approval-requests", subpath],
  });

  const [page, _setPage] = useState(1);
  const [pageSize, _setPageSize] = useState(10);

  const headers: DataTableHeader[] = useMemo(
    () =>
      Object.keys(data[0])
        .map(key => ({
          key,
          header: key,
        }))
        .sort((a, b) =>
          a.key === "school_id_giga" ? -1 : b.key === "school_id_giga" ? 1 : 0,
        ),
    [data],
  );

  const formattedRows = useMemo(() => {
    const dataSlice = data.slice((page - 1) * pageSize, page * pageSize);

    const formattedData: KeyValueObject[] = dataSlice.map(row => {
      const rowWithId = { ...row, id: row.school_id_giga };

      const entries = Object.entries(rowWithId).map(([key, value]) => {
        if (key == "id") return [key, value];

        return [
          key,
          value === null ? "NULL" : typeof value === "object" ? value : value,
        ];
      });

      return Object.fromEntries(entries);
    });

    return formattedData;
  }, [data, page, pageSize]);

  const handleApproveRows = (rows: KeyValueObject[]) => {
    const ids = rows.map(row => row.id ?? "NULL");
    setApprovedRows(ids);
    setHeaders(headers);
    setRows(formattedRows);
    navigate({
      to: "/approval-requests/$subpath/confirm",
      params: {
        subpath: subpath,
      },
    });
  };

  return (
    <Section className="container py-6">
      <DataTable headers={headers} rows={formattedRows as CarbonDataTableRow}>
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
                    tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                    renderIcon={Checkmark}
                    onClick={() => {
                      const keyValueObject =
                        transformToKeyValueObject(selectedRows);
                      handleApproveRows(keyValueObject);
                    }}
                  >
                    Approve Rows
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
    </Section>
  );
}
