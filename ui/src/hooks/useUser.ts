import { useQuery } from "@tanstack/react-query";

import { api } from "@/api";

function useUser() {
  const { data: rolesQuery, isFetching } = useQuery({
    queryKey: ["user", "me"],
    queryFn: api.users.getCurrentUser,
    staleTime: 60 * 5 * 1000,
  });

  const enabled = rolesQuery?.data.enabled;

  return {
    enabled,
    isFetching,
  };
}

export default useUser;
