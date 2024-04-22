import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import SchoolConnectivity from "@/components/ingest-api/SchoolConnectivity";

export const Route = createFileRoute(
  "/ingest-api/edit/$ingestionId/school-connectivity",
)({
  component: EditSchoolConnectivity,
  loader: async ({ params: { ingestionId }, context: { queryClient } }) => {
    const options = queryOptions({
      queryKey: ["school_connectivity", ingestionId],
      queryFn: () => api.qos.get_school_connectivity(ingestionId),
    });

    return await queryClient.ensureQueryData(options);
  },
  pendingComponent: IngestFormSkeleton,
});

function EditSchoolConnectivity() {
  const { ingestionId } = Route.useParams();

  const {
    data: { data: schoolConnectivityQuery },
  } = useSuspenseQuery({
    queryKey: ["school_connectivity", ingestionId],
    queryFn: () => api.qos.get_school_connectivity(ingestionId),
  });

  const {
    id: _id,
    date_created: _date_created,
    date_modified: _date_modified,
    schema_url: _schema_url,
    school_list: _school_list,
    school_list_id: _school_list_id,
    user_email: _user_email,
    user_id: _user_id,
    ...schoolConnectivityFormDefaultValues
  } = schoolConnectivityQuery;

  return (
    <SchoolConnectivity
      isEditing
      defaultData={schoolConnectivityFormDefaultValues}
    />
  );
}
