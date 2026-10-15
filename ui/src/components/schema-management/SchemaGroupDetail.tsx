import { Button, Heading, Section, Stack, Tag } from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { schemaGroupDetailQueryOptions } from "@/api/queryOptions.ts";
import useRoles from "@/hooks/useRoles.ts";
import { SchemaDataset } from "@/types/schemaRegistry.ts";

function SchemaCard({
  schema,
  coreColumnCount,
}: {
  schema: SchemaDataset;
  coreColumnCount?: number;
}) {
  return (
    <Link
      className="border border-giga-gray bg-white p-5 text-giga-black no-underline hover:border-giga-blue hover:bg-giga-light-blue"
      to="/schema-management/$datasetKey"
      params={{ datasetKey: schema.key }}
    >
      <Tag type={schema.role === "core" ? "blue" : "teal"}>{schema.role}</Tag>
      <Heading className="mt-3 text-xl">{schema.name}</Heading>
      <code className="text-xs text-giga-dark-gray">{schema.key}</code>
      <p className="mt-2 min-h-10 text-sm text-giga-dark-gray">
        {schema.description ?? "No description provided."}
      </p>
      <p className="mt-4 text-xs text-giga-dark-gray">
        {schema.column_count} own columns
        {coreColumnCount !== undefined ? ` · ${coreColumnCount} inherited` : ""}
        {schema.pending_proposal_count > 0
          ? ` · ${schema.pending_proposal_count} pending`
          : ""}
      </p>
    </Link>
  );
}

function SchemaGroupDetail({ groupKey }: { groupKey: string }) {
  const { isPrivileged } = useRoles();
  const {
    data: { data: group },
  } = useSuspenseQuery(schemaGroupDetailQueryOptions(groupKey));

  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link className="cds--link text-sm" to="/schema-management">
              Schema groups
            </Link>
            <Heading className="mt-2">{group.name}</Heading>
            <p className="mt-2 text-giga-dark-gray">
              {group.description ?? "Related governed schemas."}
            </p>
          </div>
          {isPrivileged && (
            <Button as={Link} kind="tertiary" to="/schema-management/groups">
              Manage group
            </Button>
          )}
        </div>

        {group.core_schema ? (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-giga-blue">
              Shared core schema
            </p>
            <div className="border-t-4 border-giga-blue">
              <SchemaCard schema={group.core_schema} />
            </div>
          </section>
        ) : (
          <div className="border-l-4 border-giga-yellow bg-white p-4">
            <b>No core schema.</b>{" "}
            <span className="text-giga-dark-gray">
              Members in this group are currently applied independently.
            </span>
          </div>
        )}

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-giga-dark-gray">
            Member schemas
            {group.core_schema ? " · inherit the core" : ""}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {group.member_schemas.map(schema => (
              <SchemaCard
                key={schema.id}
                schema={schema}
                coreColumnCount={group.core_schema?.column_count}
              />
            ))}
          </div>
          {group.member_schemas.length === 0 && (
            <p className="bg-white p-4 text-giga-dark-gray">
              This group does not contain any member schemas yet.
            </p>
          )}
        </section>
      </Stack>
    </Section>
  );
}

export default SchemaGroupDetail;
