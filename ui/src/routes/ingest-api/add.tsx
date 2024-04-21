import { ProgressIndicator, ProgressStep, Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { useStore } from "@/context/store";

export const Route = createFileRoute("/ingest-api/add")({
  component: Layout,
});

function Layout() {
  const {
    apiIngestionSlice: { stepIndex },
  } = useStore();

  return (
    <Stack gap={10}>
      <Stack gap={1}>
        <h2 className="text-[23px] capitalize">Create New Ingestion</h2>
        <p>Create a new ingestion description</p>
      </Stack>
      <ProgressIndicator currentIndex={stepIndex} spaceEqually>
        <ProgressStep
          label="1"
          description="School listing"
          secondaryLabel="School listing"
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
