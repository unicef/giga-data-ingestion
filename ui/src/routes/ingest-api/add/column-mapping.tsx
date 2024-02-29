import { createFileRoute, redirect } from "@tanstack/react-router";

import { useQosStore } from "@/context/apiIngestionStore";

export const Route = createFileRoute("/ingest-api/add/column-mapping")({
  component: AddIngestion,
  loader: () => {
    const { stepIndex } = useQosStore.getState();
    if (!stepIndex) throw redirect({ to: ".." });
  },
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
