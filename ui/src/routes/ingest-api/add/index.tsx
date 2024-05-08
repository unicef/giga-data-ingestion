import { createFileRoute } from "@tanstack/react-router";

import {
  geolocationSchemaQueryOptions,
  listCountriesQueryOptions,
} from "@/api/queryOptions.ts";
import { listUsersQueryOptions } from "@/api/queryOptions.ts";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import SchoolListing from "@/components/ingest-api/SchoolListing.tsx";
import { useStore } from "@/context/store";

export const Route = createFileRoute("/ingest-api/add/")({
  component: SchoolListing,
  loader: ({ context: { queryClient } }) => {
    const {
      apiIngestionSliceActions: { setStepIndex },
    } = useStore.getState();

    setStepIndex(0);

    return Promise.all([
      queryClient.ensureQueryData(geolocationSchemaQueryOptions),
      queryClient.ensureQueryData(listUsersQueryOptions),
      queryClient.ensureQueryData(listCountriesQueryOptions),
    ]);
  },
  pendingComponent: IngestFormSkeleton,
});
