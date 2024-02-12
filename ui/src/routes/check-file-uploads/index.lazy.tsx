import { useMemo, useState } from "react";

import { Upload } from "@carbon/icons-react";
import {
  Button,
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
  TableToolbar,
  TableToolbarContent,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createLazyFileRoute } from "@tanstack/react-router";

import { useApi } from "@/api";
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
            <Heading>Check File Uploads</Heading>
          </Section>
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
                  <TableToolbar>
                    <TableToolbarContent>
                      <Button as={Link} to="/upload" renderIcon={Upload}>
                        Upload New File
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
