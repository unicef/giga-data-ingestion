import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import { listCountriesQueryOptions } from "@/api/queryOptions.ts";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import SchoolListing from "@/components/ingest-api/SchoolListing.tsx";

export const Route = createFileRoute("/ingest-api/edit/$ingestionId/")({
  component: EditIngestion,
  loader: ({ params: { ingestionId }, context: { queryClient } }) => {
    const options = queryOptions({
      queryKey: ["school_list", ingestionId],
      queryFn: () => api.qos.get_school_list(ingestionId),
    });

    return Promise.all([
      queryClient.ensureQueryData(options),
      queryClient.ensureQueryData(listCountriesQueryOptions),
    ]);
  },
  pendingComponent: IngestFormSkeleton,
});

function EditIngestion() {
  const { ingestionId } = Route.useParams();

  const {
    data: { data: schoolListQuery },
  } = useSuspenseQuery({
    queryKey: ["school_list", ingestionId],
    queryFn: () => api.qos.get_school_list(ingestionId),
  });

  const {
    id: _id,
    date_created: _date_created,
    date_modified: _date_modified,
    ...schoolListFormDefaultValues
  } = schoolListQuery;

  return <SchoolListing isEditing defaultData={schoolListFormDefaultValues} />;
}
