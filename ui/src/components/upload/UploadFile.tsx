import { useState } from "react";
import Dropzone from "react-dropzone";

import { FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { notification } from "antd";

import { cn, convertMegabytesToBytes } from "@/lib/utils.ts";

const FILE_UPLOAD_SIZE_LIMIT_MB = 10;
const FILE_UPLOAD_SIZE_LIMIT = convertMegabytesToBytes(
  FILE_UPLOAD_SIZE_LIMIT_MB,
);

export default function UploadFile() {
  const [file, setFile] = useState<File | null>(null);
  const hasUploadedFile = file != null;

  const [notify, contextHolder] = notification.useNotification();

  function onDrop(files: File[]) {
    if (files.length === 0) return;

    const file = files[0];

    if (file.size > FILE_UPLOAD_SIZE_LIMIT) {
      notify.error({
        message: "File too large",
        description: "Files must not exceed 10 MB.",
        placement: "top",
        duration: 5,
      });
      return;
    }

    setFile(file);
  }

  return (
    <>
      {contextHolder}
      <Dropzone onDrop={onDrop}>
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className={cn(
              "w-1/4 rounded border-4 border-dashed transition-colors",
              "cursor-pointer hover:bg-gray-5 active:bg-gray-6",
              {
                "border border-solid border-primary hover:bg-primary/10 active:bg-primary/20":
                  hasUploadedFile,
              },
            )}
          >
            <input {...getInputProps()} />
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-3",
                {
                  "text-primary": hasUploadedFile,
                },
              )}
            >
              {hasUploadedFile ? (
                <>
                  <FileTextOutlined className="text-2xl" />
                  {file.name}
                </>
              ) : (
                <>
                  <UploadOutlined className="text-2xl" />
                  Click or drag a file to upload
                </>
              )}
            </div>
          </div>
        )}
      </Dropzone>
    </>
  );
}
