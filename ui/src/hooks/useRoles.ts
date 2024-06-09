import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/api";

function useRoles() {
  const { data: rolesQuery, isFetching } = useQuery({
    queryKey: ["roles", "me"],
    queryFn: api.roles.getForCurrentUser,
    staleTime: 60 * 5 * 1000,
  });
  const roles = useMemo(() => rolesQuery?.data ?? [], [rolesQuery?.data]);

  const isAdmin = useMemo(() => roles.includes("Admin"), [roles]);

  const isSuperAdmin = useMemo(() => roles.includes("Super"), [roles]);

  const isPrivileged = useMemo(
    () => isAdmin || isSuperAdmin,
    [isAdmin, isSuperAdmin],
  );

  const hasRoles = useMemo(() => {
    return roles.length > 0;
  }, [roles]);

  const countryDatasets = useMemo(() => {
    const out = {} as Record<string, string[]>;

    roles
      .map(role => role.split("-"))
      .filter(roleComponent => roleComponent.length > 1)
      .forEach(roleComponent => {
        let [country, dataset] = roleComponent;
        country = country.trim();
        dataset = dataset.trim();
        out[dataset] ? out[dataset].push(country) : (out[dataset] = [country]);
      });

    return out;
  }, [roles]);

  return {
    roles,
    hasRoles,
    isAdmin,
    isSuperAdmin,
    isPrivileged,
    countryDatasets,
    isFetching,
  };
}

export default useRoles;
