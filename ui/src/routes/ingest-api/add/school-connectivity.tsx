import { createFileRoute, redirect } from "@tanstack/react-router";

import SchoolConnectivity from "@/components/ingest-api/SchoolConnectivity.tsx";
import { useStore } from "@/context/store";

export const Route = createFileRoute("/ingest-api/add/school-connectivity")({
  component: SchoolConnectivity,
  loader: () => {
    const {
      apiIngestionSlice: {
        schoolList: { api_endpoint },
      },
      apiIngestionSliceActions: { setStepIndex },
    } = useStore.getState();

    if (api_endpoint === "") {
      setStepIndex(0);
      throw redirect({ to: "/ingest-api/add" });
    }

    setStepIndex(2);
  },
});
