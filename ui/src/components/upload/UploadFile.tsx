import Dropzone from "react-dropzone";

import { Document, Upload } from "@carbon/icons-react";

import { cn, convertMegabytesToBytes } from "@/lib/utils.ts";

const FILE_UPLOAD_SIZE_LIMIT_MB = 10;
const FILE_UPLOAD_SIZE_LIMIT = convertMegabytesToBytes(
  FILE_UPLOAD_SIZE_LIMIT_MB,
);

interface UploadFileProps {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  setTimestamp: React.Dispatch<React.SetStateAction<Date | null>>;
}
const UploadFile = ({ file, setFile, setTimestamp }: UploadFileProps) => {
  const hasUploadedFile = file != null;

  function onDrop(files: File[]) {
    if (files.length === 0) return;

    const file = files[0];

    setTimestamp(new Date());
    setFile(file);
  }

  return (
    <>
      <Dropzone
        accept={{
          "text/plain": [".csv", ".json"],
          "application/octer-stream": [".parquet", ".xls", ".xlsx"],
        }}
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
              (.xlsx, .xls, .csv, .json, .parquet only, up to 10MB)
            </p>
          </div>
        )}
      </Dropzone>
    </>
  );
};

export default UploadFile;
