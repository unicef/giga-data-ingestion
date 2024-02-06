import { Link } from "react-router-dom";

import { CheckCircleOutlined } from "@ant-design/icons";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "antd";

export const Route = createLazyFileRoute(
  "/upload/$uploadGroup/$uploadType/success",
)({
  component: () => (
    <>
      <h4 className="text-base text-gray-3">Step 1: Upload</h4>
      <h4 className="text-base text-gray-3">Step 2: Metadata</h4>

      <div className="flex gap-2 text-[33px] text-primary">
        <CheckCircleOutlined /> Success!
      </div>
      <p>Your data upload was successful. Thank you for uploading your data!</p>
      <p>
        You will be notified when the upload is approved or if other issues
        persist.
      </p>

      <div>
        <Link to="/" unstable_viewTransition>
          <Button type="primary" ghost>
            Back to Home
          </Button>
        </Link>
      </div>
    </>
  ),
});
