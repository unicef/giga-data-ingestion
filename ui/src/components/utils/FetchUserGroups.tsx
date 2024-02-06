import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/api";
import { useStore } from "@/store.ts";

function FetchUserGroups() {
  const api = useApi();
  const { user, setUser } = useStore();

  const query = useQuery({
    queryFn: api.users.getUserGroups,
    queryKey: ["userGroups"],
  });
  const groups = query.data?.data ?? [];

  useEffect(() => {
    try {
      const roles = groups.map(group => group.display_name);
      setUser({ ...user, roles });
    } catch (err) {
      console.error(err);
    }
  }, [setUser, user]);

  return null;
}

export default FetchUserGroups;
