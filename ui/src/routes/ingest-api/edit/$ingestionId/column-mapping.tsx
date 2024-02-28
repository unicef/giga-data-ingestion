import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api, queryClient } from "@/api";

export const Route = createFileRoute(
  "/ingest-api/edit/$ingestionId/column-mapping",
)({
  component: EditIngestion,
  loader: ({ params: { ingestionId } }) => {
    const schoolListQueryOptions = queryOptions({
      queryKey: ["ingestion", ingestionId],
      queryFn: () => api.qos.get_school_list(ingestionId),
    });

    return queryClient.ensureQueryData(schoolListQueryOptions);
  },
});

function EditIngestion() {
  const { ingestionId } = Route.useParams();

  const {
    data: { data: initialValues },
  } = useSuspenseQuery({
    queryKey: ["ingestion", ingestionId],
    queryFn: () => api.qos.get_school_list(ingestionId),
  });

  console.log(initialValues);

  return <div>COLUMN_MAPPING You are now edit ID numbber {ingestionId}</div>;
}

export default EditIngestion;
