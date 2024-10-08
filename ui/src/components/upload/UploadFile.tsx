import { Dispatch, SetStateAction } from "react";
import Dropzone from "react-dropzone";

import { Document, Upload } from "@carbon/icons-react";
import { parse } from "papaparse";

import { useStore } from "@/context/store.ts";
import { cn, convertMegabytesToBytes } from "@/lib/utils.ts";
import { MetaSchema } from "@/types/schema.ts";

const FILE_UPLOAD_SIZE_LIMIT_MB = 10;
const FILE_UPLOAD_SIZE_LIMIT = convertMegabytesToBytes(
  FILE_UPLOAD_SIZE_LIMIT_MB,
);

interface UploadFileProps {
  file: File | null;
  setFile: (file: File | null) => void;
  setTimestamp?: (timestamp: Date | null) => void;
  acceptType?: {
    [key: string]: string[];
  };
  description?: string;
  schema?: MetaSchema[];
  setIsLoading?: Dispatch<SetStateAction<boolean>>;
}

const DEFAULT_ACCEPT_TYPE = {
  "application/json": [".json"],
  "application/octet-stream": [".parquet"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx  ",
  ],
  "text/csv": [".csv"],
};

const DEFAULT_MESSAGE = "(.xlsx, .xls, .csv, .json, .parquet only, up to 10MB)";

const UploadFile = ({
  file,
  setFile,
  acceptType = DEFAULT_ACCEPT_TYPE,
  description = DEFAULT_MESSAGE,
  setTimestamp = () => {},
  schema,
  setIsLoading,
}: UploadFileProps) => {
  const {
    uploadSliceActions: { setDetectedColumns, setColumnMapping },
  } = useStore();

  const hasUploadedFile = file != null;

  function onDrop(files: File[]) {
    if (files.length === 0) return;

    if (setIsLoading) setIsLoading(true);
    const file = files[0];

    setTimestamp(new Date());
    setFile(file);

    parse(file, {
      complete: result => {
        const detectedColumns = result.data[0] as string[];
        setDetectedColumns(detectedColumns);

        if (schema) {
          const autoColumnMapping: Record<string, string> = {};
          schema.forEach(column => {
            if (detectedColumns.includes(column.name)) {
              autoColumnMapping[column.name] = column.name;
            }
          });
          setColumnMapping(autoColumnMapping);
        }

        if (setIsLoading) setIsLoading(false);
      },
      error: () => {
        if (setIsLoading) setIsLoading(false);
      },
      preview: 1,
    });
  }

  return (
    <Dropzone
      accept={acceptType}
      maxFiles={1}
      maxSize={FILE_UPLOAD_SIZE_LIMIT}
      multiple={false}
      onDropAccepted={onDrop}
    >
      {({ getRootProps, getInputProps }) => (
        <div
          {...getRootProps()}
          className={cn(
            "rounded border-2 border-dashed transition-colors",
            "cursor-pointer hover:bg-giga-light-gray active:bg-giga-gray",
            {
              "border border-solid border-primary hover:bg-primary/10 active:bg-primary/20":
                hasUploadedFile,
            },
          )}
        >
          <input {...getInputProps()} />
          <div
            className={cn(
              "text-gray-3 flex flex-col items-center justify-center gap-2 p-6 text-center",
              {
                "text-primary": hasUploadedFile,
              },
            )}
          >
            {hasUploadedFile ? (
              <>
                <Document size={24} />
                {file.name}
              </>
            ) : (
              <>
                <Upload size={24} />
                Click or drag a file to upload
              </>
            )}
          </div>
          <p className="text-gray-4 px-6 text-center text-xs opacity-25">
            {description}
          </p>
        </div>
      )}
    </Dropzone>
  );
};

export default UploadFile;
