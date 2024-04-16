import { useMemo, useState } from "react";

import { Add, Restart, Tools } from "@carbon/icons-react";
import {
  Button,
  Link as CarbonLink,
  DataTable,
  DataTableSkeleton,
  Pagination,
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";

import { api } from "@/api";
import { HEADERS } from "@/constants/ingest-api";
import { useStore } from "@/context/store";

import StatusIndicator from "../upload/StatusIndicator";
import ConfirmToggleIngestionEnabledModal from "./ConfirmToggleIngestionEnabledModal";
import InfoIngestionModal from "./InfoIngestionModal";

export type LoadingStates = {
  [key: string]: boolean;
};

function IngestTable() {
  const { page: currentPage, page_size: pageSize } = useSearch({
    from: "/ingest-api/",
  });
  const navigate = useNavigate({ from: "/ingest-api/" });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const [selectedIngestionName, setSelectedIngestionName] =
    useState<string>("");
  const [selectedIngestionId, setSelectedIngestionId] = useState<string>("");
  const [selectedIngestionEnabled, setSelectedIngestionEnabled] =
    useState<boolean>(false);

  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState<boolean>(false);
  const [isOpenInfoModal, setIsOpenInfoModal] = useState<boolean>(false);
  const [infoModalErrorMessage, setInfoModalErrorMessage] =
    useState<string>("");
  const [selectedIngestionLastModified, setSelectedIngestionLastModified] =
    useState<Date>(new Date());

  const {
    apiIngestionSliceActions: { resetApiIngestionState: resetState },
  } = useStore();

  const {
    data: schoolListQuery,
    isLoading: isSchoolListLoading,
    refetch: refetchSchoolList,
    isRefetching: isSchoolListRefetching,
  } = useSuspenseQuery({
    queryKey: ["school_list", currentPage, pageSize],
    queryFn: () =>
      api.qos.list_school_list({
        count: pageSize,
        page: currentPage,
      }),
  });

  const schoolListData = useMemo(
    () => schoolListQuery?.data.data ?? [],
    [schoolListQuery],
  );

  const formattedSchoolListData = useMemo(() => {
    return schoolListData.map(schoolList => {
      const lastRun = new Date(schoolList.date_modified).toLocaleString();

      const nextRun = new Date(
        new Date(schoolList.date_modified).setMinutes(
          new Date(schoolList.date_modified).getMinutes() +
            schoolList.school_connectivity.ingestion_frequency_minutes,
        ),
      ).toLocaleString();

      return {
        id: schoolList.id,
        name: schoolList.name,
        endpoint: schoolList.api_endpoint,
        frequency: schoolList.school_connectivity.ingestion_frequency_minutes,
        lastRunConnectivity: lastRun,
        status: schoolList.error_message ? (
          <CarbonLink
            className="flex cursor-pointer"
            onClick={() => {
              if (schoolList.error_message) {
                setSelectedIngestionLastModified(schoolList.date_last_ingested);
                setInfoModalErrorMessage(schoolList.error_message);
                setSelectedIngestionName(schoolList.name);
                setIsOpenInfoModal(true);
              }
            }}
          >
            <StatusIndicator className="mr-1" type="error" />
            Failed
          </CarbonLink>
        ) : (
          <div className="flex">
            <StatusIndicator className="mr-1" type="success" />
            Success
          </div>
        ),

        lastRunList: nextRun,
        active: (
          <Toggle
            disabled={loadingStates[schoolList.id]}
            id={schoolList.id}
            toggled={schoolList.enabled}
            onClick={async () => {
              setSelectedIngestionEnabled(schoolList.enabled);
              setSelectedIngestionId(schoolList.id);
              setSelectedIngestionName(schoolList.name);

              setIsOpenConfirmModal(true);
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
  }, [schoolListData, loadingStates]);

  const handlePaginationChange = ({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) => {
    void navigate({
      to: "./",
      search: () => ({
        page,
        page_size: pageSize,
      }),
    });
  };

  if (isSchoolListLoading) return <DataTableSkeleton headers={HEADERS} />;

  return (
    <>
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
                  onClick={() => resetState()}
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
              totalItems={schoolListQuery?.data.total_count}
              onChange={handlePaginationChange}
            />
          </TableContainer>
        )}
      </DataTable>
      {isOpenConfirmModal && (
        <ConfirmToggleIngestionEnabledModal
          isIngestionActive={selectedIngestionEnabled}
          mutationQueryKey={currentPage}
          ingestionName={selectedIngestionName}
          open={isOpenConfirmModal}
          setLoadingStates={setLoadingStates}
          setOpen={setIsOpenConfirmModal}
          schoolListId={selectedIngestionId}
        />
      )}
      {isOpenInfoModal && (
        <InfoIngestionModal
          ingestionDate={selectedIngestionLastModified}
          errorMessage={infoModalErrorMessage}
          ingestionName={selectedIngestionName}
          open={isOpenInfoModal}
          setOpen={setIsOpenInfoModal}
        />
      )}
    </>
  );
}
export default IngestTable;
