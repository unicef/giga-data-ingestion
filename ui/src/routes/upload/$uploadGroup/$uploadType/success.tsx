import { CheckmarkOutline } from "@carbon/icons-react";
import { Button } from "@carbon/react";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/success",
)({
  component: () => (
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
        this upload in the future, it has Upload ID{" "}
        {/* TODO: convert to tanstack equivalent */}
        {/*<b>{location.state.uploadId}</b> and completed at{" "}*/}
        {/*<b>{location.state.uploadDate}</b>*/}
      </p>
      <p>You may now safely close this page</p>
      <div>
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </>
  ),
});
