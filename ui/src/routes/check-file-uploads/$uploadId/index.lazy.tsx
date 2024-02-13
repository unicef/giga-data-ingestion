import { useState } from "react";
import { createPortal } from "react-dom";

import { Accordion, AccordionItem, Link, Modal } from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useApi } from "@/api";
import Datatable from "@/components/upload/Datatable";

export const Route = createFileRoute("/check-file-uploads/$uploadId/")({
  component: Index,
});

export default function Index() {
  const { uploadId } = Route.useParams();

  const [isValuesModalOpen, setIsValuesModalOpen] = useState<boolean>(false);
  const [modalValue, setModalValue] = useState<string>("");

  const api = useApi();

  const { data: dqResult, isLoading } = useQuery({
    queryKey: ["dq_check", uploadId],
    queryFn: () => {
      const data = api.uploads.get_dq_check_result("test.json"); //This should be the actual dq check file name
      return data;
    },
  });

  const { data: fileProperties } = useQuery({
    queryKey: ["file_property", uploadId],
    queryFn: () => {
      const data = api.uploads.get_file_properties(uploadId);
      return data;
    },
  });

  const rowLevelAssertionColumns = [
    {
      key: "check",
      header: "Check",
    },
    {
      key: "count",
      header: "Count",
    },
    {
      key: "actions",
      header: "Actions",
    },
  ];

  const rowLevelAssertionsRows = dqResult?.data.row_level_assertions.map(
    assertion => {
      return {
        id: assertion.assertion,
        check: assertion.assertion,
        key: assertion.assertion,
        count: assertion.count_overall,
        actions: (
          <Link
            onClick={() => {
              setIsValuesModalOpen(true);
              setModalValue("somevalue");
            }}
          >
            View Values
          </Link>
        ),
        ...assertion,
      };
    },
  );

  return (
    <div className="flex flex-col gap-8">
      <div
        onClick={() => {
          console.log(dqResult);
        }}
      >
        dq_result
      </div>

      <div
        onClick={() => {
          // console.log(summaryChecksHeaders);
        }}
      >
        Loggers
      </div>
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
                <em>
                  File Uploaded at:{" "}
                  {fileProperties?.data.creation_time.toLocaleString()}
                </em>
                <div>
                  Rows: <b>{dqResult?.data.summary.rows ?? ""}</b>
                </div>
                <div>
                  Columns:<b>{dqResult?.data.summary.columns ?? ""}</b>
                </div>
              </AccordionItem>
              {/* <AccordionItem title="Checks per column">
                <div className="py-4">
                  These checks will be run on each column in the uploaded file
                </div>
                <PaginatedDatatable
                  headers={summaryChecksHeaders}
                  rows={checksPerColumnRows ?? []}
                />
              </AccordionItem> */}
              {/* <AccordionItem title="Checks for duplicate rows">
                <div className="py-4">
                  These checks will count rows that appear to be duplicates
                  based on combinations of columns.
                </div>
                <Datatable
                  headers={checksData?.data.duplicate_rows.headers ?? []}
                  rows={checksData?.data.duplicate_rows.rows ?? []}
                />
              </AccordionItem> */}
              <AccordionItem title="Checks based on geospatial data points">
                <div className="py-4">
                  These checks will check the data quality of each row based on
                  its coordinate data.
                </div>
                <Datatable
                  headers={rowLevelAssertionColumns ?? []}
                  rows={rowLevelAssertionsRows ?? []}
                />
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>
      {isValuesModalOpen &&
        createPortal(
          <Modal
            modalHeading="Unique Values Check"
            open={isValuesModalOpen}
            passiveModal
            onRequestClose={() => setIsValuesModalOpen(false)}
          >
            <div>HEY</div>
            <div>HEY</div>
            <div>HEY</div>
            <div>HEY</div>
            <div>HEY</div>
            <div>{modalValue}</div>
          </Modal>,
          document.body,
        )}
    </div>
  );
}
