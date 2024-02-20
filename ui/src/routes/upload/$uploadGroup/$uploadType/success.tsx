import { CheckmarkOutline } from "@carbon/icons-react";
import { Button } from "@carbon/react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { useStore } from "@/store.ts";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/success",
)({
  component: Success,
  loader: () => {
    const { upload } = useStore.getState();
    if (!upload.file) {
      throw redirect({ to: ".." });
    }
  },
});

function Success() {
  const { upload, resetUploadState } = useStore();

  return (
    <>
      <h4 className="text-gray-3 text-base opacity-40">Step 1: Upload</h4>
      <h4 className="text-gray-3 text-base opacity-40">Step 2: Metadata</h4>
      <div className="flex items-center gap-2 text-[33px] text-primary">
        <CheckmarkOutline size={30} />
        Success!
      </div>
      <p>
        Your data upload was successful. Thank you for uploading your file and
        filling in the metadata!
      </p>
      <p>
        Data quality checks will now be performed on your upload; you may check
        the progress and output of the checks on the File Uploads page. To check
        this upload in the future, it has Upload ID <b>{upload.uploadId}</b> and
        completed at <b>{upload.uploadDate}</b>
      </p>
      <p>You may now safely close this page</p>
      <div>
        <Button as={Link} to="/" onClick={resetUploadState}>
          Back to Home
        </Button>
      </div>
    </>
  );
}
