import React from "react";
import Dropzone from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";

import { Document, Upload } from "@carbon/icons-react";
import { ToastNotification } from "@carbon/react";

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
const UploadFile: React.FC<UploadFileProps> = ({
  file,
  setFile,
  setTimestamp,
}) => {
  const hasUploadedFile = file != null;

  function onDrop(files: File[]) {
    if (files.length === 0) return;

    const file = files[0];

    if (file.size > FILE_UPLOAD_SIZE_LIMIT) {
      toast.custom(t => (
        <div className={`${t.visible ? "animate-enter" : "animate-leave"} `}>
          <ToastNotification
            aria-label="closes notification"
            kind="error"
            onClose={() => toast.dismiss(t.id)}
            onCloseButtonClick={() => toast.dismiss(t.id)}
            role="status"
            statusIconDescription="notification"
            subtitle="Files must not exceed 10mb"
            title="File too large"
          />
        </div>
      ));
      return;
    }

    setTimestamp(new Date());
    setFile(file);
  }

  return (
    <>
      <Dropzone onDrop={onDrop}>
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className={cn(
              "w-1/4 rounded border-2 border-dashed transition-colors",
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
          </div>
        )}
      </Dropzone>
      <Toaster
        // containerStyle={{
        //   right: 40,
        //   bottom: 40,
        // }}
        position="top-center"
        toastOptions={{ duration: 3000 }}
        reverseOrder={true}
      />
    </>
  );
};

export default UploadFile;
