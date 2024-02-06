import { createLazyFileRoute } from "@tanstack/react-router";
import { Collapse } from "antd";

import { uploadFileGroups } from "@/mocks/uploadFileGroups.tsx";

export const Route = createLazyFileRoute("/upload/")({
  component: () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-[23px]">What will you be uploading today?</h2>
      <div className="flex flex-col">
        <Collapse
          bordered={false}
          className="bg-transparent"
          items={[
            {
              key: "new",
              label: "A completely new dataset",
              children: <li>Create a new dataset</li>,
            },
            {
              key: "append",
              label: "An addition to an existing dataset",
              children: (
                <Collapse
                  items={uploadFileGroups}
                  bordered={false}
                  className="bg-transparent"
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  ),
});
