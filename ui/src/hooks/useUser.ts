import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/api";

function useUser() {
  const { data: userQuery, isFetching } = useQuery({
    queryKey: ["user", "me"],
    queryFn: api.users.getCurrentUser,
    staleTime: 60 * 5 * 1000,
  });

  const enabled = useMemo(
    () => userQuery?.data?.enabled ?? false,
    [userQuery?.data],
  );

  return {
    enabled,
    isFetching,
  };
}

export default useUser;
