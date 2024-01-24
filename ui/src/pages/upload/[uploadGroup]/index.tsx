import { Link } from "react-router-dom";

import { Button } from "antd";

import UploadFile from "@/components/upload/UploadFile.tsx";

export default function Index() {
  return (
    <div className="flex flex-col gap-8">
      <h3 className="text-[23px]">Step 1: Upload</h3>
      <UploadFile />

      <div className="flex gap-2">
        <Link to="/upload" unstable_viewTransition>
          <Button className="border-primary text-primary">Cancel</Button>
        </Link>
        <Link to="metadata" unstable_viewTransition>
          <Button type="primary" className="bg-primary">
            Proceed
          </Button>
        </Link>
      </div>
    </div>
  );
}
