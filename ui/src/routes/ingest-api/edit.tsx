import { ProgressIndicator, ProgressStep, Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { useQosStore } from "@/context/qosStore";

export const Route = createFileRoute("/ingest-api/edit")({
  component: Layout,
});

function Layout() {
  const { stepIndex } = useQosStore();

  return (
    <Stack gap={10}>
      <Stack gap={1}>
        <h2 className="text-[23px] capitalize">Edit an Ingestion</h2>
        <p>Edit an ingestion description</p>
      </Stack>
      <ProgressIndicator currentIndex={stepIndex} spaceEqually>
        <ProgressStep
          label="1"
          description="School-listing"
          secondaryLabel="School-listing"
        />
        <ProgressStep
          label="2"
          description="Configure columns"
          secondaryLabel="Configure columns"
        />

        <ProgressStep
          label="3"
          description="School connectivity & submit"
          secondaryLabel="School connectivity & submit"
        />
      </ProgressIndicator>
      <Outlet />
    </Stack>
  );
}
