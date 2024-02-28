import { createFileRoute } from "@tanstack/react-router";

import { useQosStore } from "@/context/apiIngestionStore";

export const Route = createFileRoute("/ingest-api/add/column-mapping")({
  component: AddIngestion,
});

function AddIngestion() {
  const { schoolList, stepIndex } = useQosStore.getState();

  return (
    <div>
      Welcome to column mapping {stepIndex}
      <button onClick={() => console.log(typeof schoolList.size)}>CLICK</button>
    </div>
  );
}
