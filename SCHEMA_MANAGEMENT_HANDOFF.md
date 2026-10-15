# Schema Management — handoff notes

Branch: `feat/implement-schema-management`
Commit: `274a433 feat: implement schema management` (no body — the original request/spec
this was built from isn't preserved anywhere in the repo; this doc is reconstructed
from reading the committed code, not from the original ask).

## What this feature does

A governance layer on top of the Delta `schemas.<dataset>` tables that already exist
(these are read via Trino and previously had no UI/workflow around them). It adds:

- **Groups & datasets** (Postgres) — user-defined groupings (e.g. "facilities") that
  datasets can be filed under, plus a registry of which `schemas.<key>` Delta tables
  are tracked, and free-form links between related datasets.
- **Column browsing** (Delta via Trino, not copied into Postgres) — list/get columns
  on a dataset, including DQ-config fields (`is_mandatory`, `is_unique`,
  `domain_values`, `range_min`/`range_max`, `dynamic_max`, `precision_min`,
  `critical_for`) that previously only lived in NocoDB.
- **Version history & diffing** — reads Delta's own transaction log
  (`schemas."<key>$history"`) and can snapshot/diff any two versions
  (`FOR VERSION AS OF`).
- **Change proposals** — propose add/edit/delete of a single column, with
  approve/reject. Approval applies the change directly to the Delta table via a
  generated INSERT/UPDATE/DELETE and records the resulting Delta version on the
  proposal. A user cannot approve their own proposal.
- **Audit log** — every proposed/approved/rejected/applied/apply_failed action is
  recorded in `schema_proposal_audit_log`.

## Where things live

Backend:
- `api/data_ingestion/models/schema_registry.py` — `DatasetGroup`, `SchemaDataset`,
  `SchemaDatasetLink`, `SchemaProposal`, `SchemaProposalAuditLog` (all Postgres;
  columns themselves are NOT stored here — they're read live from Delta).
- `api/data_ingestion/internal/schema_registry.py` — all business logic, including
  the SQL-builder for applying an approved proposal to Delta
  (`_build_apply_statement`).
- `api/data_ingestion/routers/schema_registry.py` — `/api/schema-registry/*` routes.
  Mutating routes require `IsPrivileged`; reads don't.
- `api/data_ingestion/schemas/schema_registry.py` — Pydantic request/response models,
  including the canonical `REGISTRY_COLUMN_FIELDS` whitelist used both for diffing
  and for validating proposal `after_state` (prevents arbitrary column-name
  injection into the generated Delta SQL).
- `api/data_ingestion/migrations/versions/2026_09_15_1000_b421d64ee9e5_*.py` — creates
  the 5 Postgres tables above.
- `api/scripts/extend_schema_tables.py` — **not run yet**. One-time DDL to add the
  new DQ-config columns onto every existing Delta `schemas.<dataset>` table, and to
  widen Delta log/file retention (default 30-day log / 7-day VACUUM would otherwise
  silently prune the version history this feature depends on).
- `api/scripts/backfill_dataset_registry.py` — **not run yet**. One-time backfill to
  register every existing `schemas.<dataset>` Delta table into `schema_datasets`,
  pulling DQ-config values from `giga-dagster/dagster/src/spark/config_expectations.py`
  and `critical_for` from NocoDB table `SchoolGeolocationMasterDQChecks`. Must run
  after `extend_schema_tables.py`.

Frontend:
- Routes under `ui/src/routes/schema-management/` (`index`, `$datasetKey`, `groups`,
  `proposals`), registered in `ui/src/routeTree.gen.ts`.
- Components in `ui/src/components/schema-management/`: `DatasetsTable`,
  `DatasetDetail`, `GroupsManager`, `ProposalsTable`, `ProposeChangeModal`.
- `ui/src/api/routers/schemaRegistry.ts` + `ui/src/api/queryOptions.ts` — API client
  and TanStack Query options.
- `ui/src/types/schemaRegistry.ts` — mirrors the backend Pydantic schemas.
- Nav entry added in `ui/src/components/common/Navbar.tsx` (`Schema Management`,
  gated on `hasRoles`).

## 2026-09-21 update — ported functionality from giga-schema-manager

A sibling project, `~/PycharmProjects/giga-schema-manager`, implements an
overlapping but architecturally different schema-governance tool (Postgres-only,
local JWT auth, per-dataset/app RBAC — see that repo's own `CLAUDE.local.md` for
its purpose: replacing NocoDB as config source for **giga-dagster**, not this app).
After inventorying its functionality, the following was ported into this feature
(adapted for Delta/Trino as source of truth and the existing Azure AD /
`IsPrivileged` permission model — the fine-grained per-dataset RBAC and local auth
were deliberately **not** ported; see "Explicitly not ported" below):

- **CSV bulk import** — `POST /api/schema-registry/datasets/{key}/import`
  (`internal/schema_registry.py::import_columns_from_csv`), `IsPrivileged`-gated.
  Upserts columns directly against Delta (bypasses individual proposal review,
  same trust level as the existing backfill scripts). Frontend: "Import CSV"
  button on the Columns tab in `DatasetDetail.tsx`, results shown in a modal.
- **Bidirectional dataset links** — `create_link`/`delete_link` now create/delete
  both directions instead of one. Previously linking A→B did not make B show A.
- **Rejection reason** — `SchemaProposal.rejection_reason` (migration
  `4baa07aa81cd`), required on `POST /proposals/{id}/reject`. Frontend: reject
  action now opens a modal requiring a reason before submitting.
- **Filterable, paginated audit log** — `GET /audit` now takes `dataset_key`,
  `column_name`, `actor_id`, `action`, `limit`, `offset`. Response now includes
  denormalized `dataset_key`/`column_name`. This previously had **no frontend at
  all**; added a new `/schema-management/audit` page + `AuditLogTable.tsx`,
  linked from the datasets list (privileged users only).
- **Dataset column/pending-proposal counts** — `SchemaDatasetResponse` already had
  a dead, unused `SchemaDatasetSummary` schema with these fields; wired it up for
  real (folded into `SchemaDatasetResponse` directly) in `list_datasets` and a new
  `get_dataset_detail`. **Caveat**: `list_datasets` does one Trino round trip per
  dataset to count columns — fine at current scale, flagged in-code as worth
  revisiting (e.g. caching) if the dataset count grows a lot.
- **Dedicated diff viewer** — extracted `DiffViewer.tsx` (color-coded before/after
  table), used by `ProposalsTable.tsx`; reusable anywhere else a diff needs
  showing.
- **DQ-checks summary view** — new `ChecksPanel.tsx`, a "DQ checks" tab on
  `DatasetDetail.tsx` that groups a dataset's columns by check type (mandatory /
  unique / domain values / range / precision), mirroring giga-schema-manager's
  `ChecksView`. Pure frontend derivation from the existing columns endpoint — no
  new backend endpoint needed.

**Explicitly not ported** (architecture differences, not oversights):
- Per-dataset/app scoped RBAC (`viewer`/`editor`/`approver`/`admin` via access
  grants) — this app uses global named roles (`Admin`/`Super` → `IsPrivileged`)
  consistently everywhere; adopting per-resource scoping would be a bigger,
  cross-cutting permissions decision, deferred pending a decision from whoever
  owns that call.
- Local JWT/bcrypt auth — this app uses Azure AD; not touched.
- Storing columns as a Postgres copy — this app's `SchemaDataset` is explicitly a
  pointer into live Delta (`schemas.<key>`), not a copy; column state is still
  read via Trino, never persisted to Postgres.

All of the above was verified with `tsc --noEmit` (clean), `eslint` on the
touched files (clean), and the Dockerfile.prod-equivalent build check
(`docker run ... node:20-alpine sh -c "npm ci && npm run build"`, succeeded).
**Not yet run**: the new migration hasn't been applied to any real database.

## Known gaps / open items for whoever picks this up next

1. **No tests.** Nothing under `api/tests` or `ui` covers any of this — not the
   router, the proposal-apply SQL builder, or the frontend components.
2. **Migrations not applied** to any real database yet as of this writing —
   confirm `alembic upgrade head` has been run (now two migrations:
   `b421d64ee9e5` and `4baa07aa81cd`) in whatever environment you're using.
3. **`extend_schema_tables.py` and `backfill_dataset_registry.py` have not been run**
   against real Trino/Delta infrastructure. `extend_schema_tables.py`'s docstring
   explicitly warns to check the target Trino/Delta version supports
   `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and `SET TBLPROPERTIES` before running.
4. **Concurrency**: `approve_proposal` in `internal/schema_registry.py` has an
   in-code NOTE flagging that concurrent approvals against the same dataset can
   interleave Delta writes — a per-dataset advisory lock is called out as needed
   before this goes live, but isn't implemented. The new CSV import path has the
   same exposure, one row at a time.
5. **Partial-failure handling**: if the Delta write in `approve_proposal` succeeds
   but reading back the new version number fails, or vice versa, there's no
   compensating rollback beyond the try/except that marks the proposal
   `apply_failed` — worth a closer look under real failure conditions.
6. No UI or backend logic exists yet for bulk/multi-column *proposals* — one
   proposal still covers exactly one column add/edit/delete. CSV import bypasses
   proposals entirely rather than generalizing them to bulk.
7. **Per-dataset/app RBAC** — deferred, see "Explicitly not ported" above. If
   this app's schema-management needs an editor/approver split narrower than
   `IsPrivileged`, that's a separate design conversation.

## 2026-10-15 update — schema groups and shared cores

The registry now models the hierarchy used by schema consumers:

```
Schema group
├── zero or one core schema
└── one or more member schemas
```

Core and member schemas remain normal Delta `schemas.<key>` tables. A member is
resolved dynamically as `core columns + member columns`; columns are not copied.
Members may not shadow core-owned column names. Existing machine keys should be
preserved during migration even when a friendlier display name is introduced.

Portal implementation:

- `SchemaDataset` now has `name`, `description`, and `role` (`core` or `member`).
  PostgreSQL constraints require a core to belong to a group and allow at most
  one core per group.
- `GET /api/schema-registry/groups/{key}` returns a group's core and members.
- `GET /api/schema-registry/datasets/{key}/resolved` returns core and member
  version references plus combined columns annotated with `origin`,
  `owner_schema_key`, and `read_only`.
- `GET /api/schema-registry/datasets/{key}/impact` lists every member affected
  by a core change.
- Group/role assignment, proposal creation/approval, and CSV import reject
  core/member column-name collisions.
- The UI starts at Schema Groups, then shows the optional core and member
  schemas. Member detail separates the resolved schema from its own columns.
  Core detail has an Impact tab. Core proposal review lists affected members.
- `FileUpload` has nullable schema/version pins (`schema_key`,
  `schema_version`, `core_schema_key`, `core_schema_version`). They are accepted
  and persisted by the upload endpoint, but the current upload wizard continues
  using the legacy flat schema endpoint until Dagster supports resolution.

New migrations, not yet applied:

- `8f3c2a1b7d4e` — schema display metadata, roles, checks, and one-core index.
- `5a7e9c2d4b6f` — nullable resolved-schema version pins on `file_uploads`.

### Required giga-dagster follow-up

Dagster still reads one `schemas.<metastore_schema>` Delta table through
`dagster/src/utils/schema.py::get_schema_columns` and still gets DQ rules from
`config_expectations.py`. Before Giga Sync switches uploads to resolved schemas:

1. Mirror the four nullable schema/version fields on Dagster's `FileUpload`
   model/config.
2. Add a resolver that reads group/core membership from shared Postgres and
   reads the pinned core and member Delta versions.
3. Reject duplicate names and return one combined `StructField` collection.
4. Use the resolver in bronze casting, DQ, staging, and relevant IO-manager
   paths.
5. Read mandatory/unique/domain/range/precision/critical checks from the
   resolved Delta column metadata instead of `config_expectations.py`.
6. Only after that, make the upload wizard request the resolved endpoint and
   submit the returned version references.

Do not make Dagster call the Giga Sync HTTP API at runtime. Resolution should use
the shared Postgres registry and Delta tables so pipeline execution remains
independent of portal availability.
