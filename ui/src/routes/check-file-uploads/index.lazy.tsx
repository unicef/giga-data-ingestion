import { useMemo } from "react";

import {
  DataTable,
  DataTableHeader,
  Heading,
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
import { Link, createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/check-file-uploads/")({
  component: FileUploads,
});

export default function FileUploads() {
  {
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

    const id = "1231dASD@#";

    const filteredUsersData = [
      {
        id: id,
        dateUploaded: "testData",
        dataset: "testdataset",
        country: "ASDASDDAS",
        status: "dasdasdasd",
        actions: (
          <div>
            <Link
              to="/check-file-uploads/$uploadId"
              params={{
                uploadId: id,
              }}
            >
              view
            </Link>
          </div>
        ),
      },
    ];

    return (
      <Section className="container py-6">
        <Stack gap={6}>
          <Section>
            <Heading>Check File Uploads</Heading>
          </Section>
          <Section>
            <DataTable headers={columns} rows={filteredUsersData}>
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
                      <div>Add user modal should have been here</div>
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
                  {/* <PaginationNav
                    itemsShown={5}
                    totalItems={Math.ceil(
                      filteredUsersData.length / ROWS_PER_PAGE,
                    )}
                    onChange={(index: number) => setCurrentPage(index)}
                  /> */}
                </TableContainer>
              )}
            </DataTable>
          </Section>
        </Stack>
      </Section>
    );
  }
}
