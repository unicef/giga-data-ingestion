import { CheckmarkOutline } from "@carbon/icons-react";
import { Button, DefinitionTooltip } from "@carbon/react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { format } from "date-fns";

import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { useStore } from "@/context/store";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/success",
)({
  component: Success,
  loader: ({ params: { uploadGroup, uploadType } }) => {
    const {
      uploadSlice: { file, columnMapping },
      uploadSliceActions: { setStepIndex },
    } = useStore.getState();

    if (uploadGroup === "other" && uploadType === "unstructured") {
      //do nothing
    } else if (
      !file ||
      Object.values(columnMapping).filter(Boolean).length === 0
    ) {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }
  },
});

function Success() {
  const { uploadGroup, uploadType } = Route.useParams();
  const {
    uploadSlice: { uploadDate, uploadId },
    uploadSliceActions: { resetUploadSliceState },
  } = useStore();

  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";

  const unstructuredMessage =
    "Your file has been uploaded! Note that no checks will be performed on this file.";
  const defaultMessage = (
    <>
      Your data has been successfully uploaded and submitted for data quality
      checks. You can check on the progress using the File Uploads page and
      searching for Upload ID <b>{uploadId}</b> - this task was completed at{" "}
      <DefinitionTooltip
        align="right"
        definition="Date uploaded is the server time"
        openOnHover
      >
        <b>{format(uploadDate ?? new Date(), DEFAULT_DATETIME_FORMAT)}</b>
      </DefinitionTooltip>
    </>
  );

  return (
    <>
      <div>
        <div className="flex items-center gap-2 text-[33px] text-primary">
          <CheckmarkOutline size={30} />
          Success!
        </div>

        <p>{isUnstructured ? unstructuredMessage : defaultMessage}</p>
        <p>You may now safely close this page</p>
      </div>
      <Button as={Link} to="/" onClick={resetUploadSliceState} isExpressive>
        Back to Home
      </Button>
    </>
  );
}
