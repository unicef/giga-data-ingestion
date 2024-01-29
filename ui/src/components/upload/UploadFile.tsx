import Dropzone from "react-dropzone";
import { FileRejection } from "react-dropzone";
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

    setTimestamp(new Date());
    setFile(file);
  }

  const handleOnDroprejected = (error: FileRejection[]) => {
    const title = error.length > 1 ? "Too many files" : "Invalid file";
    const subtitle =
      error.length > 1 ? "Upload only one file" : "Upload a valid file";

    toast.custom(t => (
      <div className={`${t.visible ? "animate-enter" : "animate-leave"} `}>
        <ToastNotification
          aria-label="closes notification"
          kind="error"
          onClose={() => toast.dismiss(t.id)}
          onCloseButtonClick={() => toast.dismiss(t.id)}
          role="status"
          statusIconDescription="notification"
          subtitle={subtitle}
          title={title}
        />
      </div>
    ));
  };
  return (
    <>
      <Dropzone
        maxFiles={1}
        onDropAccepted={onDrop}
        onDropRejected={handleOnDroprejected}
        accept={{
          "text/plain": [".json", ".txt"],
          "application/octer-stream": [".parquet"],
        }}
        maxSize={FILE_UPLOAD_SIZE_LIMIT}
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
              (.txt, .json, .parquet only, up to 10MB)
            </p>
          </div>
        )}
      </Dropzone>
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3000 }}
        reverseOrder={true}
      />
    </>
  );
};

export default UploadFile;
