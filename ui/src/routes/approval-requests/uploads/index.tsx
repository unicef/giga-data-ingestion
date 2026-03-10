import { useMemo, useState } from "react";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  Modal,
  Section,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
  TextInput,
} from "@carbon/react";
import Pagination from "@carbon/react/lib/components/Pagination/Pagination";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { useStore } from "@/context/store";
import { validateSearchParams } from "@/utils/pagination";

/* ---------------------------------- */

const headers: DataTableHeader[] = [
  { key: "upload_id", header: "Upload ID" },
  { key: "uploaded_at", header: "Uploaded At" },
  { key: "uploaded_by", header: "Uploaded By" },
  { key: "file_name", header: "File Name" },
];

export const Route = createFileRoute("/approval-requests/uploads/")({
  validateSearch: validateSearchParams,
  component: UploadSelectionPage,
  pendingComponent: () => (
    <Section className="container py-6">
      <DataTableSkeleton headers={headers} />
    </Section>
  ),
});

/* ---------------------------------- */

function UploadSelectionPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();

  const {
    page = DEFAULT_PAGE_NUMBER,
    page_size = DEFAULT_PAGE_SIZE,
    country,
    dataset,
    upload_id,
    uploaded_by,
    sort_by = "created",
    sort_order = "desc",
  } = search;

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const {
    uploadActions: {
      setSelectedUploadIds: setUploadIdsInStore,
      clearSelectedUploadIds,
    },
  } = useStore();

  const [draftFilters, setDraftFilters] = useState({
    upload_id: upload_id ?? "",
    uploaded_by: uploaded_by ?? "",
    sort_order: sort_order ?? "desc",
  });

  const subPath = useMemo(() => {
    const ds = dataset!.toLowerCase().replace(/\s+/g, "_");
    return encodeURIComponent(`${ds}/${country}`);
  }, [dataset, country]);

  /* ---------------- Data Fetch ---------------- */

  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: [
        "uploads",
        country,
        dataset,
        page,
        page_size,
        upload_id,
        uploaded_by,
        sort_by,
        sort_order,
      ],
      queryFn: () =>
        api.approvalRequests.uploadedListByCountry({
          country: country!,
          dataset: dataset!,
          page,
          page_size,
          upload_id,
          uploaded_by,
          sort_by,
          sort_order,
        }),
    }),
  );

  const response = data.data;

  const rows = useMemo(
    () =>
      response.items.map(item => ({
        id: item.upload_id,
        upload_id: item.upload_id,
        uploaded_at: new Date(item.created).toLocaleString(),
        uploaded_by: item.uploader_email,
        file_name: item.file_name,
      })),
    [response.items],
  );

  const isFilterDirty =
    draftFilters.upload_id !== (upload_id ?? "") ||
    draftFilters.uploaded_by !== (uploaded_by ?? "") ||
    draftFilters.sort_order !== (sort_order ?? "desc");

  /* ---------------- Render ---------------- */

  return (
    <>
      <Section className="container py-6">
        <h2 className="mb-2 text-xl font-semibold">
          Uploads By Country and Dataset
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Select one or more uploads to review and approve changes.
        </p>

        {/* ---------------- Filters ---------------- */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <TextInput
            id="filter-upload-id"
            labelText="Upload ID"
            placeholder="Filter by upload id"
            value={draftFilters.upload_id}
            onChange={e =>
              setDraftFilters(prev => ({
                ...prev,
                upload_id: e.target.value,
              }))
            }
          />

          <TextInput
            id="filter-uploaded-by"
            labelText="Uploaded By"
            placeholder="email@example.com"
            value={draftFilters.uploaded_by}
            onChange={e =>
              setDraftFilters(prev => ({
                ...prev,
                uploaded_by: e.target.value,
              }))
            }
          />

          <Select
            id="sort-order"
            labelText="Sort by uploaded time"
            value={draftFilters.sort_order}
            onChange={e =>
              setDraftFilters(prev => ({
                ...prev,
                sort_order: e.target.value as "asc" | "desc",
              }))
            }
          >
            <SelectItem value="desc" text="Newest first" />
            <SelectItem value="asc" text="Oldest first" />
          </Select>

          <div className="flex items-end gap-2">
            <Button
              disabled={!isFilterDirty}
              onClick={() =>
                navigate({
                  to: Route.fullPath,
                  search: prev => ({
                    ...prev,
                    page: DEFAULT_PAGE_NUMBER,
                    upload_id: draftFilters.upload_id || undefined,
                    uploaded_by: draftFilters.uploaded_by || undefined,
                    sort_by: "created",
                    sort_order: draftFilters.sort_order,
                  }),
                })
              }
            >
              Apply filters
            </Button>

            <Button
              kind="secondary"
              onClick={() => {
                setDraftFilters({
                  upload_id: "",
                  uploaded_by: "",
                  sort_order: "desc",
                });

                navigate({
                  to: Route.fullPath,
                  search: prev => ({
                    ...prev,
                    page: DEFAULT_PAGE_NUMBER,
                    upload_id: undefined,
                    uploaded_by: undefined,
                    sort_by: "created",
                    sort_order: "desc",
                  }),
                });
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* ---------------- Table ---------------- */}

        <DataTable headers={headers} rows={rows}>
          {({
            rows,
            headers,
            getHeaderProps,
            getRowProps,
            getSelectionProps,
            selectedRows,
          }) => {
            const selectedUploadIds = selectedRows.map(r => r.id);

            return (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      {/* @ts-expect-error Carbon typing issue */}
                      <TableSelectAll {...getSelectionProps()} />
                      {headers.map(header => (
                        // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                        <TableHeader {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map(row => (
                      <TableRow {...getRowProps({ row })}>
                        {/* @ts-expect-error Carbon typing issue */}
                        <TableSelectRow {...getSelectionProps({ row })} />
                        {row.cells.map(cell => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  page={page}
                  pageSize={page_size}
                  pageSizes={[10, 25, 50, 100]}
                  totalItems={response.total}
                  onChange={({ page, pageSize }) =>
                    navigate({
                      to: Route.fullPath,
                      search: prev => ({
                        ...prev,
                        page,
                        page_size: pageSize,
                      }),
                    })
                  }
                />

                {/* Footer actions */}
                <div className="mt-6">
                  <ButtonSet className="w-full">
                    <Button
                      kind="secondary"
                      renderIcon={ArrowLeft}
                      onClick={() => {
                        clearSelectedUploadIds();
                        navigate({
                          to: "/approval-requests",
                        });
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      renderIcon={ArrowRight}
                      disabled={selectedUploadIds.length === 0}
                      onClick={() => {
                        setUploadIdsInStore(selectedUploadIds);
                        setIsConfirmModalOpen(true);
                      }}
                    >
                      Proceed ({selectedUploadIds.length})
                    </Button>
                  </ButtonSet>
                </div>
              </>
            );
          }}
        </DataTable>
      </Section>

      <Modal
        modalHeading="Confirm Upload Selection"
        open={isConfirmModalOpen}
        primaryButtonText="Proceed"
        secondaryButtonText="Cancel"
        onRequestClose={() => setIsConfirmModalOpen(false)}
        onRequestSubmit={() => {
          navigate({
            to: "/approval-requests/$subpath",
            params: { subpath: subPath },
          });
          setIsConfirmModalOpen(false);
        }}
      >
        Proceed with selected uploads?
      </Modal>
    </>
  );
}
