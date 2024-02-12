import { Link } from "@tanstack/react-router";

import StatusIndicator from "@/components/upload/StatusIndicator";

const uploadIds = Array.from({ length: 20 }, () =>
  Math.random().toString(36).substring(2, 10),
);
export const rows = uploadIds.map(uploadId => ({
  id: uploadId,
  dateUploaded: "DateUploaded",
  dataset: "Dataset",
  country: "Country",
  status: (
    <div className="flex">
      <StatusIndicator className="mr-1" type="success" /> File Uploaded
    </div>
  ),
  actions: (
    <div>
      <Link
        to="/check-file-uploads/$uploadId"
        params={{
          uploadId: uploadId,
        }}
      >
        view
      </Link>
    </div>
  ),
}));
