import { useMemo, useState } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";

interface SchemaNavigatorProps {
  activeGroupKey?: string;
  activeDatasetKey?: string;
}

function SchemaNavigator({
  activeGroupKey,
  activeDatasetKey,
}: SchemaNavigatorProps) {
  const [search, setSearch] = useState("");
  const {
    data: { data: groups },
  } = useSuspenseQuery(listDatasetGroupsQueryOptions);
  const {
    data: { data: datasets },
  } = useSuspenseQuery(listSchemaDatasetsQueryOptions);

  const activeDataset = datasets.find(
    dataset => dataset.key === activeDatasetKey,
  );
  const activeGroup = groups.find(
    group =>
      group.key === activeGroupKey || group.id === activeDataset?.group_id,
  );
  const normalizedSearch = search.trim().toLowerCase();

  const visibleGroups = useMemo(
    () =>
      groups.filter(group => {
        if (!normalizedSearch) return true;
        const groupMatches = [group.name, group.key, group.description]
          .filter(Boolean)
          .some(value => value?.toLowerCase().includes(normalizedSearch));
        const schemaMatches = datasets
          .filter(dataset => dataset.group_id === group.id)
          .some(dataset =>
            [dataset.name, dataset.key].some(value =>
              value.toLowerCase().includes(normalizedSearch),
            ),
          );
        return groupMatches || schemaMatches;
      }),
    [datasets, groups, normalizedSearch],
  );

  const currentLocation = activeDataset
    ? `${activeGroup?.name ?? "Ungrouped"} / ${activeDataset.name}`
    : activeGroup?.name ?? "Schema groups";

  const navigation = (
    <>
      <label className="block border-b border-carbon-datatable-grey p-3">
        <span className="sr-only">Find a schema group or schema</span>
        <input
          className="h-9 w-full border border-carbon-datatable-grey bg-giga-light-gray px-3 text-xs"
          placeholder="Find group or schema"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </label>
      <Link
        className="block border-b border-carbon-datatable-grey px-4 py-3 text-sm text-giga-dark-blue no-underline hover:bg-giga-light-blue"
        to="/schema-management"
      >
        ← All schema groups
      </Link>
      <nav aria-label="Schema groups and schemas" className="py-2">
        {visibleGroups.map(group => {
          const groupDatasets = datasets
            .filter(dataset => dataset.group_id === group.id)
            .sort((left, right) => {
              if (left.role !== right.role)
                return left.role === "core" ? -1 : 1;
              return left.name.localeCompare(right.name);
            });
          const groupIsActive = group.id === activeGroup?.id;
          const groupIsExpanded = groupIsActive || normalizedSearch !== "";

          return (
            <div key={group.id}>
              <Link
                className={clsx(
                  "flex min-h-10 items-center justify-between border-l-[3px] px-3 py-2 text-sm font-semibold text-giga-black no-underline hover:bg-giga-light-blue",
                  groupIsActive &&
                    !activeDatasetKey &&
                    "border-giga-blue bg-giga-light-blue text-giga-dark-blue",
                  (!groupIsActive || activeDatasetKey) && "border-transparent",
                )}
                to="/schema-management/groups/$groupKey"
                params={{ groupKey: group.key }}
              >
                <span>{group.name}</span>
                <span aria-hidden>{groupIsExpanded ? "⌄" : "›"}</span>
              </Link>
              {groupIsExpanded &&
                groupDatasets.map(dataset => (
                  <Link
                    key={dataset.id}
                    className={clsx(
                      "block min-h-9 border-l-[3px] py-2 pl-7 pr-3 text-xs text-giga-dark-gray no-underline hover:bg-giga-light-blue",
                      dataset.key === activeDatasetKey
                        ? "border-giga-blue bg-giga-light-blue font-semibold text-giga-dark-blue"
                        : "border-transparent",
                    )}
                    to="/schema-management/$datasetKey"
                    params={{ datasetKey: dataset.key }}
                  >
                    {dataset.role === "core" ? "◆ " : ""}
                    {dataset.name}
                  </Link>
                ))}
            </div>
          );
        })}
      </nav>
      <Link
        className="block border-t border-carbon-datatable-grey px-4 py-3 text-xs text-giga-dark-blue no-underline hover:bg-giga-light-blue"
        to="/schema-management/groups"
      >
        Group administration
      </Link>
    </>
  );

  return (
    <>
      <aside className="sticky top-16 hidden border border-carbon-datatable-grey bg-white lg:block">
        <div className="border-b border-carbon-datatable-grey px-4 py-3 text-xs font-semibold uppercase tracking-wide text-giga-dark-gray">
          Browse schemas
        </div>
        {navigation}
      </aside>
      <details className="mb-5 border border-carbon-datatable-grey bg-white lg:hidden">
        <summary className="cursor-pointer px-4 py-3 font-semibold">
          {currentLocation}
        </summary>
        {navigation}
      </details>
    </>
  );
}

export default SchemaNavigator;
