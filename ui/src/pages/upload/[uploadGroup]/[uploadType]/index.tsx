import { useState } from "react";
import { Link } from "react-router-dom";

import { Accordion, AccordionItem, Button, Section } from "@carbon/react";

import Datatable from "@/components/upload/Datatable";
import PaginatedDatatable from "@/components/upload/PaginatedDatatable";
import UploadFile from "@/components/upload/UploadFile.tsx";

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [timestamp, setTimestamp] = useState<Date | null>(null);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Singapore",
    hour12: false,
  };

  const dateFormatter = new Intl.DateTimeFormat("en-GB", dateOptions);
  const timeFormatter = new Intl.DateTimeFormat("en-GB", timeOptions);

  const timestampStr = timestamp
    ? `${dateFormatter.format(timestamp)} ${timeFormatter.format(
        timestamp,
      )} GMT+8`
    : "";

  const hasUploadedFile = file != null;

  return (
    <div className="flex flex-col gap-8">
      <h3 className="text-[23px]">Step 1: Upload</h3>
      <UploadFile file={file} setFile={setFile} setTimestamp={setTimestamp} />
      <div
        onClick={() => {
          console.log(Date.now());
        }}
      >
        helolo
      </div>
      <div className="flex gap-2">
        <Link to="/upload" unstable_viewTransition>
          <Button kind="tertiary">Cancel</Button>
        </Link>
        <Link to="metadata" unstable_viewTransition>
          <Button disabled={!hasUploadedFile}>Proceed</Button>
        </Link>
      </div>

      <Section>
        After you upload your file and fill up the metadata in the next page,
        the automated checks below will be run to ensure adequate data quality
      </Section>
      <div className="m-0 w-full">
        <div className="px=28">
          <Accordion align="start">
            <AccordionItem title="Summary">
              <div>
                FileName: <b>{file?.name}</b>
              </div>
              <div>Rows:</div>
              <div>Columns:</div>
              <div>
                <p className="italic">File uploaded at: {timestampStr}</p>
              </div>
            </AccordionItem>
            <AccordionItem title="Checks per column">
              <PaginatedDatatable />
            </AccordionItem>
            <AccordionItem title="Checks for duplicate rows">
              <Datatable />
            </AccordionItem>
            <AccordionItem title="Checks based on geospatial data points">
              <Datatable />
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
