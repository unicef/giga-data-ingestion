import { useState } from "react";

import { Link, Modal } from "@carbon/react";

import {
  geospatialChecksHeaders,
  geospatialChecksModalHeaders,
} from "@/constants/check-file-uploads";
import { DataQualityCheckResult } from "@/types/upload";

import Datatable from "../upload/Datatable";

type GeoSpatialRow = {
  id: string;
  value: string;
}[];

export default function GeospatialChecks({
  data: data,
}: {
  data: DataQualityCheckResult | undefined;
}) {
  const [
    isInvalidGeospatialChecksModalOpen,
    setIsInvalidGeospatialChecksModalOpen,
  ] = useState<boolean>(false);
  const [
    invalidGeospatialChecksValuesRows,
    setInvalidGeospatialChecksValuesRows,
  ] = useState<GeoSpatialRow>([]);
  const [selectedGeoSpatialCheckRow, setSelectedGeospatialCheckRow] =
    useState<string>("");

  if (data === undefined) return <></>;

  const geospatialChecksRows = data.geospatial_points_checks.map(check => {
    return {
      id: check.assertion,
      check: check.description,
      count: check.count_failed,
      actions: (
        <Link
          onClick={() => {
            setIsInvalidGeospatialChecksModalOpen(true);

            const rows = check.rows_failed.map(row => {
              return {
                id: row,
                value: row,
              };
            });

            setInvalidGeospatialChecksValuesRows(rows);
            setSelectedGeospatialCheckRow(check.description);
          }}
        >
          View Details
        </Link>
      ),
    };
  });

  return (
    <>
      <div className="py-4">
        Total Number of Rows with Warnings:{" "}
        <b>{geospatialChecksRows?.length} rows</b>
      </div>
      <Datatable
        headers={geospatialChecksHeaders ?? []}
        rows={geospatialChecksRows ?? []}
      />

      <Modal
        modalHeading="Invalid Values Check"
        open={isInvalidGeospatialChecksModalOpen}
        passiveModal
        onRequestClose={() => setIsInvalidGeospatialChecksModalOpen(false)}
      >
        There are <b>{invalidGeospatialChecksValuesRows.length}</b> invalid
        values in <b>{selectedGeoSpatialCheckRow}</b>:
        <Datatable
          headers={geospatialChecksModalHeaders ?? []}
          rows={invalidGeospatialChecksValuesRows ?? []}
        />
      </Modal>
    </>
  );
}
