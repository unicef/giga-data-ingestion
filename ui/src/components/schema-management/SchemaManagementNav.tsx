import { ReactNode, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";

import { listSchemaDatasetsQueryOptions } from "@/api/queryOptions.ts";
import useRoles from "@/hooks/useRoles.ts";

interface NavLinkProps {
  to:
    | "/schema-management"
    | "/schema-management/groups"
    | "/schema-management/proposals"
    | "/schema-management/audit";
  active: boolean;
  children: ReactNode;
  badge?: number;
}

function NavLink({ to, active, children, badge }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
        active
          ? "bg-giga-light-blue font-semibold text-giga-dark-blue"
          : "text-giga-dark-gray hover:bg-giga-light-gray"
      }`}
    >
      <span>{children}</span>
      {!!badge && (
        <span className="rounded-full bg-giga-blue px-2 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SchemaManagementNav() {
  const { isPrivileged } = useRoles();
  const { location } = useRouterState();
  const { data } = useQuery(listSchemaDatasetsQueryOptions);

  const pendingTotal = useMemo(
    () =>
      (data?.data ?? []).reduce(
        (sum, dataset) => sum + dataset.pending_proposal_count,
        0,
      ),
    [data],
  );

  const sub = location.pathname
    .replace(/^\/schema-management\/?/, "")
    .split("/")[0];
  const isDatasets =
    sub === "" || !["groups", "proposals", "audit"].includes(sub);

  return (
    <nav
      aria-label="Schema management sections"
      className="flex w-48 flex-none flex-col gap-1"
    >
      <NavLink to="/schema-management" active={isDatasets}>
        Datasets
      </NavLink>
      <NavLink to="/schema-management/groups" active={sub === "groups"}>
        Groups
      </NavLink>
      <NavLink
        to="/schema-management/proposals"
        active={sub === "proposals"}
        badge={pendingTotal}
      >
        Proposals
      </NavLink>
      {isPrivileged && (
        <NavLink to="/schema-management/audit" active={sub === "audit"}>
          Audit log
        </NavLink>
      )}
    </nav>
  );
}

export default SchemaManagementNav;
