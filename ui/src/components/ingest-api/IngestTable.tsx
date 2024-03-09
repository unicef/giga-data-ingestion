import { useMemo, useState } from "react";

import { Add, Restart, Tools } from "@carbon/icons-react";
import {
  Button,
  DataTable,
  DataTableSkeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  Toggle,
} from "@carbon/react";
// @ts-expect-error missing types https://github.com/carbon-design-system/carbon/issues/14831
import Pagination from "@carbon/react/lib/components/Pagination/Pagination";
import { faker } from "@faker-js/faker";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AxiosResponse } from "axios";

import { queryClient, useApi } from "@/api";
import { HEADERS, ITEMS_PER_PAGE } from "@/constants/ingest-api";
import { useQosStore } from "@/context/qosStore";
import { PagedSchoolListResponse } from "@/types/qos";

type LoadingStates = {
  [key: string]: boolean;
};

function IngestTable() {
  // TODO: REMOVE THIS WHEN NO DUMMY DATA
  faker.seed(1);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  const api = useApi();

  const { resetQosState } = useQosStore();

  const {
    data: schoolListQuery,
    isLoading: isSchoolListLoading,
    refetch: refetchSchoolList,
    isRefetching: isSchoolListRefetching,
  } = useQuery({
    queryKey: ["school_list", currentPage],
    queryFn: () =>
      api.qos.list_school_list({
        count: ITEMS_PER_PAGE,
        page: currentPage,
      }),
    placeholderData: keepPreviousData,
  });

  const { mutateAsync: updateSchoolListStatus } = useMutation({
    mutationFn: api.qos.update_school_list_status,
    onMutate: async (schoolIdStatus: { id: string; enabled: boolean }) => {
      setLoadingStates(prev => ({ ...prev, [schoolIdStatus.id]: true }));

      await queryClient.cancelQueries({
        queryKey: ["school_list", currentPage],
      });

      const previousTodos = queryClient.getQueryData([
        "school_list",
        currentPage,
      ]);

      queryClient.setQueryData(
        ["school_list", currentPage],
        (old: AxiosResponse<PagedSchoolListResponse>) => {
          const newSchoolListStatus = old.data.data.find(
            item => item.id === schoolIdStatus.id,
          );

          if (newSchoolListStatus) {
            const newData = {
              ...old,
              data: {
                ...old.data,
                data: old.data.data.map(item =>
                  item.id === schoolIdStatus.id
                    ? { ...item, enabled: schoolIdStatus.enabled }
                    : item,
                ),
              },
            };
            return newData;
          }

          return old;
        },
      );

      return { previousTodos };
    },

    onSettled: (_, __, schoolIdStatus) => {
      setLoadingStates(prev => ({ ...prev, [schoolIdStatus.id]: false }));
      queryClient.invalidateQueries({ queryKey: ["school_list", currentPage] });
    },
  });

  const schoolListData = useMemo(
    () => schoolListQuery?.data.data ?? [],
    [schoolListQuery],
  );

  const formattedSchoolListData = useMemo(() => {
    return schoolListData.map(schoolList => {
      // TODO: this should be retrieved from the qos-connectivity table
      const FREQUENCY_IN_MINUTES = faker.helpers.arrayElement([
        15, 30, 45, 60, 75, 90,
      ]);

      // TODO: REPLACE THIS WITH ACTUAL LAST RUN
      const lastRun = new Date(schoolList.date_modified).toLocaleString();

      const nextRun = new Date(
        new Date(schoolList.date_modified).setMinutes(
          new Date(schoolList.date_modified).getMinutes() +
            FREQUENCY_IN_MINUTES,
        ),
      ).toLocaleString();

      return {
        id: schoolList.id,
        name: schoolList.name,
        endpoint: schoolList.api_endpoint,
        frequency: schoolList.school_connectivity.ingestion_frequency,
        lastRunConnectivity: lastRun,
        // status: (
        //   <div className="flex">
        //     <StatusIndicator
        //       className="mr-1"
        //       type={schoolList.status ? "success" : "error"}
        //     />
        //     {schoolList.status ? "Success" : "Failed"}
        //   </div>
        // ),
        lastRunList: nextRun,
        active: (
          <Toggle
            disabled={loadingStates[schoolList.id]}
            id={schoolList.id}
            toggled={schoolList.enabled}
            onClick={async () => {
              await updateSchoolListStatus({
                id: schoolList.id,
                enabled: !schoolList.enabled,
              });
            }}
          />
        ),
        actions: (
          <Button
            kind="tertiary"
            renderIcon={Tools}
            size="sm"
            as={Link}
            to="./edit/$ingestionId"
            params={{ ingestionId: schoolList.id }}
          >
            Edit
          </Button>
        ),
      };
    });
  }, [schoolListData, updateSchoolListStatus, loadingStates]);

  if (isSchoolListLoading) return <DataTableSkeleton headers={HEADERS} />;

  return (
    <DataTable headers={HEADERS} rows={formattedSchoolListData}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent className="flex items-center">
              <Button
                kind="ghost"
                renderIcon={Restart}
                hasIconOnly
                iconDescription="Reload"
                onClick={async () => {
                  await refetchSchoolList();
                }}
                disabled={isSchoolListRefetching}
              />
              <Button
                renderIcon={Add}
                as={Link}
                to="./add"
                onClick={() => resetQosState()}
              >
                Create New Ingestion
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map(header => (
                  // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                  <TableHeader {...getHeaderProps({ header })}>
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
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            pageSizes={[10, 25, 50]}
            totalItems={schoolListQuery?.data.total_items}
            onChange={({
              pageSize,
              page,
            }: {
              pageSize: number;
              page: number;
            }) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            }}
          />
        </TableContainer>
      )}
    </DataTable>
  );
}
export default IngestTable;
