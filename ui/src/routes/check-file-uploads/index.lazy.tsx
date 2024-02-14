import { useMemo, useState } from "react";

import {
  DataTable,
  DataTableHeader,
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
import { useQuery } from "@tanstack/react-query";
import { Link, createLazyFileRoute } from "@tanstack/react-router";

import { useApi } from "@/api";
import { UploadLink } from "@/components/common/UploadLink";
import StatusIndicator from "@/components/upload/StatusIndicator";

export const Route = createLazyFileRoute("/check-file-uploads/")({
  component: FileUploads,
});

export default function FileUploads() {
  {
    const [currentPage, setCurrentPage] = useState<number>(0);

    const api = useApi();

    const { data: files } = useQuery({
      queryKey: ["files"],
      queryFn: api.uploads.list_files,
    });

    const rows =
      files?.data.map(file => {
        const { uid, country, dataset, timestamp } = file;
        const dateUploadedLocal = new Date(timestamp).toLocaleString();
        return {
          id: uid,
          dateUploaded: dateUploadedLocal,
          dataset: dataset,
          country: country,
          status: (
            <div className="flex">
              <StatusIndicator className="mr-1" type="info" />
              Uploaded
            </div>
          ),
          actions: (
            <Link
              to="/check-file-uploads/$uploadId"
              params={{
                uploadId: uid,
              }}
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

    const ROWS_PER_PAGE = 10;

    const maxPages = Math.ceil(rows.length / ROWS_PER_PAGE);
    const startIndex = currentPage * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    const rowSlice = rows.slice(startIndex, endIndex);

    return (
      <Section className="container py-6">
        <Stack gap={6}>
          <Section>
            <Heading>What will you be uploading today?</Heading>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </p>
          </Section>
          <div className="flex gap-8">
            <UploadLink uploadType="geolocation">Geolocation</UploadLink>
            <UploadLink uploadType="coverage">Coverage</UploadLink>
          </div>
          <Section>
            <DataTable headers={columns} rows={rowSlice}>
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
                  <PaginationNav
                    className="pagination-nav-right"
                    itemsShown={5}
                    totalItems={maxPages}
                    onChange={(index: number) => setCurrentPage(index)}
                  />
                </TableContainer>
              )}
            </DataTable>
          </Section>
        </Stack>
      </Section>
    );
  }
}
