import { useState } from "react";

import { ApiOutlined } from "@ant-design/icons";
import { AuthenticatedTemplate } from "@azure/msal-react";

import AddSourceDialog from "@/components/datasources/AddSourceDialog.tsx";

export default function DataSources() {
  const [selectedDataSource, setSelectedDataSource] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOk() {
    setSelectedDataSource("");
    setIsModalOpen(false);
  }

  return (
    <AuthenticatedTemplate>
      <div className="container flex flex-col gap-4 py-6">
        <h2 className="text-[23px]">Add data sources</h2>

        <div className="grid grid-cols-5">
          <button
            className="flex flex-col items-center justify-center gap-2 rounded border p-4 shadow-md transition-shadow hover:shadow-lg"
            onClick={() => {
              setSelectedDataSource("REST API");
              setIsModalOpen(true);
            }}
          >
            <ApiOutlined className="text-4xl" />
            <b>REST API</b>
          </button>
        </div>
      </div>

      <AddSourceDialog
        selectedDataSource={selectedDataSource}
        open={isModalOpen}
        onClose={handleOk}
      />
    </AuthenticatedTemplate>
  );
}
