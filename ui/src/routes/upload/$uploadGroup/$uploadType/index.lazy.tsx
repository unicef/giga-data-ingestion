import { useState } from "react";

import { Information } from "@carbon/icons-react";
import {
  Accordion,
  AccordionItem,
  Button,
  Section,
  Tooltip,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { useApi } from "@/api";
import Datatable from "@/components/upload/Datatable";
import PaginatedDatatable from "@/components/upload/PaginatedDatatable";
import UploadFile from "@/components/upload/UploadFile.tsx";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/")({
  component: Index,
});

export default function Index() {
  const api = useApi();
  const [file, setFile] = useState<File | null>(null);
  const [, setTimestamp] = useState<Date | null>(null);

  const { data: checksData, isLoading } = useQuery({
    queryKey: ["column_checks"],
    queryFn: api.uploads.list_column_checks,
  });

  const rowsWithToolTip =
    checksData?.data.column_checks.rows.map(item => ({
      ...item,
      columnName: (
        <Tooltip
          align="right"
          enterDelayMs={150}
          label={`some description for cell -${item.columnName}`}
          leaveDelayMs={0}
        >
          <div className="flex gap-1">
            {item.columnName}
            <div className="flex items-center opacity-25">
              <Information />
            </div>
          </div>
        </Tooltip>
      ),
    })) ?? [];

  const hasUploadedFile = file != null;

  return (
    <div className="flex flex-col gap-8">
      <h3 className="text-[23px]">Step 1: Upload</h3>
      <div className="w-1/4">
        <UploadFile file={file} setFile={setFile} setTimestamp={setTimestamp} />
      </div>

      <div className="flex gap-2">
        <Link to="/upload">
          <Button kind="tertiary">Cancel</Button>
        </Link>
        <Link
          to="metadata"
          // TODO: Convert this to tanstack equivalent
          // state={{ file: file, timestamp: timestamp?.toLocaleString() }}
        >
          <Button disabled={!hasUploadedFile}>Proceed</Button>
        </Link>
      </div>

      <Section>
        After you upload your file and fill up the metadata in the next page,
        the automated checks below will be run to ensure adequate data quality
      </Section>
      <div className="m-0 w-full">
        <div className="px=28 ">
          {isLoading ? (
            <Accordion align="start">
              <AccordionItem disabled title="Summary" />
              <AccordionItem disabled title="Checks per column" />
              <AccordionItem disabled title="Checks for duplicate rows" />
              <AccordionItem
                disabled
                title="Checks based on geospatial data points"
              />
            </Accordion>
          ) : (
            <Accordion align="start">
              <AccordionItem title="Summary">
                <div>
                  Rows: <b>{checksData?.data.summary_checks.rows ?? ""}</b>
                </div>
                <div>
                  Columns:<b>{checksData?.data.summary_checks.columns ?? ""}</b>
                </div>
              </AccordionItem>
              <AccordionItem title="Checks per column">
                <div className="py-4">
                  These checks will be run on each column in the uploaded file
                </div>
                <PaginatedDatatable
                  headers={checksData?.data.column_checks.headers ?? []}
                  rows={rowsWithToolTip ?? []}
                />
              </AccordionItem>
              <AccordionItem title="Checks for duplicate rows">
                <div className="py-4">
                  These checks will count rows that appear to be duplicates
                  based on combinations of columns.
                </div>
                <Datatable
                  headers={checksData?.data.duplicate_rows.headers ?? []}
                  rows={checksData?.data.duplicate_rows.rows ?? []}
                />
              </AccordionItem>
              <AccordionItem title="Checks based on geospatial data points">
                <div className="py-4">
                  These checks will check the data quality of each row based on
                  its coordinate data.
                </div>
                <Datatable
                  headers={
                    checksData?.data.geospatial_data_points.headers ?? []
                  }
                  rows={checksData?.data.geospatial_data_points.rows ?? []}
                />
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
