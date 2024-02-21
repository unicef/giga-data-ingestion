import { useMemo, useState } from "react";

import { Add } from "@carbon/icons-react";
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  Heading, // @ts-expect-error paginationNav has no typescript declaration yet
  PaginationNav,
  Section,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, createLazyFileRoute } from "@tanstack/react-router";

import { useApi } from "@/api";
import StatusIndicator from "@/components/upload/StatusIndicator";
import { parseDqResultFilename } from "@/utils/string";

export const Route = createLazyFileRoute("/check-file-uploads/")({
  component: FileUploads,
});

export default function FileUploads() {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const api = useApi();

  const ITEMS_PER_PAGE = 5;

  const { data: files, isLoading } = useQuery({
    queryKey: ["files", ITEMS_PER_PAGE, currentPage],
    queryFn: () =>
      api.uploads.list_uploads({
        count: ITEMS_PER_PAGE,
        page: currentPage,
      }),
    placeholderData: keepPreviousData
  });

  const rows =
    files?.data.data.map(file => {
      const { id, country, dataset, created, dq_report_path } = file;

      const date = new Date(created);
      const localDate = date.toLocaleString();

      const row = {
        id: id,
        dateUploaded: localDate,
        dataset: dataset,
        country: country,
      };

      if (!dq_report_path) {
        return {
          ...row,
          status: (
            <div className="flex">
              <StatusIndicator className="mr-1" type="info" />
              {"File uploaded, checks running"}
            </div>
          ),
          actions: (
            <Link
              className="text-slate-500"
              disabled
              params={{
                uploadId: id,
              }}
              to="/check-file-uploads/$uploadId"
            >
              View
            </Link>
          ),
        };
      }

      const { warnings, errors } = parseDqResultFilename(dq_report_path);

      return {
        ...row,
        status: (
          <div className="flex">
            <StatusIndicator
              className="mr-1"
              type={
                warnings === 0 && errors === 0
                  ? "success"
                  : errors > 0
                    ? "error"
                    : "warning"
              }
            />
            {warnings === 0 && errors === 0
              ? "Checks completed without errors"
              : errors > 0
                ? "Critical Checks Failed"
                : "Some checks failed"}
          </div>
        ),
        actions: (
          <Link
            params={{
              uploadId: id,
            }}
            to="/check-file-uploads/$uploadId"
          >
            View
          </Link>
        ),
      };
    }) ?? [];

  const columns = useMemo<DataTableHeader[]>(
    () => [
      {
        key: "id",
        header: "Upload Id",
      },
      {
        key: "dateUploaded",
        header: "Date Uploaded",
      },
      {
        key: "dataset",
        header: "Dataset",
      },
      {
        key: "country",
        header: "Country",
      },
      {
        key: "status",
        header: "Status",
      },
      {
        key: "actions",
        header: "Actions",
      },
    ],
    [],
  );

  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <Section>
          <Heading>What will you be uploading today?</Heading>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur.
          </p>
        </Section>
        <div className="flex gap-6">
          <Button
            as={Link}
            to="/upload/$uploadGroup/$uploadType"
            params={{
              uploadGroup: "school-data",
              uploadType: "geolocation",
            }}
            size="2xl"
            renderIcon={Add}
          >
            School geolocation
          </Button>
          <Button
            as={Link}
            to="/upload/$uploadGroup/$uploadType"
            params={{
              uploadGroup: "school-data",
              uploadType: "coverage",
            }}
            size="2xl"
            renderIcon={Add}
          >
            School coverage
          </Button>
        </div>
        <Section>
          {isLoading ? (
            <DataTableSkeleton
              headers={columns}
              showHeader={false}
              showToolbar={false}
            />
          ) : (
            <DataTable headers={columns} rows={rows}>
              {({
                rows,
                headers,
                getHeaderProps,
                getRowProps,
                getTableProps,
              }) => (
                <TableContainer>
                  <Table {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headers.map(header => (
                          // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                          <TableHeader
                            colSpan={1}
                            {...getHeaderProps({ header })}
                          >
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
                  <PaginationNav
                    className="pagination-nav-right"
                    itemsShown={ITEMS_PER_PAGE}
                    totalItems={files?.data.total_pages}
                    onChange={(index: number) => setCurrentPage(index + 1)}
                  />
                </TableContainer>
              )}
            </DataTable>
          )}
        </Section>
      </Stack>
    </Section>
  );
}
