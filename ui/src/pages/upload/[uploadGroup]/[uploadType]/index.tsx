import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Information } from "@carbon/icons-react";
import "@carbon/react";
import {
  Accordion,
  AccordionItem,
  Button,
  DataTableSkeleton,
  Section,
  Tooltip,
} from "@carbon/react";

import Datatable from "@/components/upload/Datatable";
import PaginatedDatatable from "@/components/upload/PaginatedDatatable";
import UploadFile from "@/components/upload/UploadFile.tsx";

const rows = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
].map(key => ({
  id: key,
  columnName: (
    <Tooltip
      align="right"
      enterDelayMs={150}
      label={`some description for cell -${key}`}
      leaveDelayMs={0}
    >
      <div className="flex">
        some flavor text here
        <div className="flex items-center">
          <Information />
        </div>
      </div>
    </Tooltip>
  ),
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

const check3rows = [
  {
    id: "dupx",
    check:
      "Suspected duplicate rows with everything same except school code (dupx)",
    count: "Not run",
  },
  {
    id: "dup0",
    check:
      "Suspected duplicate rows with same school id, education level, school name, lat-lon (dup0)",
    count: "Not run",
  },
  {
    id: "dup1",
    check:
      "Suspected duplicate rows with same school name, education level, lat-lon (dup1)",
    count: "Not run",
  },
];

const check4headers = [
  {
    key: "check",
    header: "Check",
  },
  {
    key: "count",
    header: "Count",
  },
];

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [timestamp, setTimestamp] = useState<Date | null>(null);
  const [isCheckingHeaders, setIsCheckingHeaders] = useState<boolean>(true);
  // const hasUploadedFile = file != null;

  // dummy useeffect that will parse for data
  const hasData = false;

  useEffect(() => {
    console.log("file");
  }, [file]);

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
      <UploadFile
        file={file}
        setFile={setFile}
        setTimestamp={setTimestamp}
        onUpload={() => console.log("run query")}
      />

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
        <div className="px=28 ">
          <Accordion align="start">
            <AccordionItem disabled={!isCheckingHeaders} title="Summary">
              <div>
                FileName: <b>{file?.name}</b>
              </div>
              <div>Rows:</div>
              <div>Columns:</div>
              <div>
                <p className="italic">File uploaded at: {timestampStr}</p>
              </div>
            </AccordionItem>
            <AccordionItem
              disabled={!isCheckingHeaders}
              title="Checks per column"
            >
              {hasData ? (
                <PaginatedDatatable headers={headers} rows={rows} />
              ) : (
                <DataTableSkeleton showHeader={false} showToolbar={false} />
              )}
            </AccordionItem>
            <AccordionItem
              disabled={!isCheckingHeaders}
              title="Checks for duplicate rows"
            >
              <div className="py-4">
                These checks will count rows that appear to be duplicates based
                on combinations of columns.
              </div>
              <Datatable headers={check4headers} rows={check3rows} />
            </AccordionItem>
            <AccordionItem
              disabled={!isCheckingHeaders}
              title="Checks based on geospatial data points"
            >
              <div className="py-4">
                These checks will check the data quality of each row based on
                its coordinate data.
              </div>
              <Datatable headers={check4headers} rows={check3rows} />
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
