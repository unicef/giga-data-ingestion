import { useMemo } from "react";

import { useAccount } from "@azure/msal-react";

function useRoles() {
  const account = useAccount();

  const roles = useMemo(
    () => (account?.idTokenClaims?.groups ?? []) as string[],
    [account?.idTokenClaims?.groups],
  );

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
  };
}

export default useRoles;
