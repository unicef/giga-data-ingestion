import { Collapse } from "antd";

import { uploadFileGroups } from "@/mocks/uploadFileGroups.tsx";

export default function UploadDataSelect() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[23px]">What will you be uploading today?</h2>
      <div className="flex flex-col">
        <Collapse
          items={uploadFileGroups}
          bordered={false}
          className="bg-transparent"
        />
      </div>
    </div>
  );
}
