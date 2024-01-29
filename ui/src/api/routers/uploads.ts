import { AxiosInstance, AxiosResponse } from "axios";

type Header = {
  key: string;
  header: string;
};

type ColumnCheckRow = {
  id: string;
  columnName: string;
  expectedDataType: string;
  inDataset: string;
  isCorrectLocation: string;
  nullValues: string;
  uniqueValues: string;
};

type DuplicateRow = {
  id: string;
  check: string;
};

type GeospatialDataPoint = DuplicateRow; // Same structure as DuplicateRow

type ColumnChecks = {
  headers: Header[];
  rows: ColumnCheckRow[];
};

type DuplicateRows = {
  headers: Header[];
  rows: DuplicateRow[];
};

type GeospatialDataPoints = {
  headers: Header[];
  rows: GeospatialDataPoint[];
};

type Checks = {
  column_checks: ColumnChecks;
  duplicate_rows: DuplicateRows;
  geospatial_data_points: GeospatialDataPoints;
};

export default function routes(axi: AxiosInstance) {
  return {
    list_column_checks: (): Promise<AxiosResponse<Checks>> => {
      return axi.get("/upload");
    },
  };
}
