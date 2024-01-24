import {
  DataTable, // @ts-expect-error paginationNav has no typescript declaration yet
  PaginationNav,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";


const rows = ["a", "b", "c"].map(key => ({
  id: key,
  columnName: `ColumName-${key}`,
  expectedDataType: `expectedDataType-${key}`,
  inDataset: `inDataset-${key}`,
  isCorrectLocation: `isCorrectLocation-${key}`,
  nullValues: `nullValues-${key}`,
  uniqueValues: `uniqueValues-${key}`,
}));

const headers = [
  {
    key: "columnName",
    header: "Column name",
  },
  {
    key: "expectedDataType",
    header: "Expected Data Type",
  },
  {
    key: "inDataset",
    header: "Is the column in the dataset?",
  },
  {
    key: "isCorrectLocation",
    header: "Is the column in the right data type?",
  },
  {
    key: "nullValues",
    header: "How many null values per column?",
  },
  {
    key: "uniqueValues",
    header: "How many unique values per column?",
  },
];
const PaginatedDatatable = () => {
  return (
    <>
      <DataTable rows={rows} headers={headers} isSortable>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer title="DataTable" description="With sorting">
            <Table {...getTableProps()} aria-label="sample table">
              <TableHead>
                <TableRow>
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
                {rows.map(row => (
                  <TableRow
                    {...getRowProps({
                      row,
                    })}
                  >
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
      <PaginationNav
        itemsShown={5}
        totalItems={25}
        onChange={(index: number) => console.log(index)}
      />
    </>
  );
};

export default PaginatedDatatable;