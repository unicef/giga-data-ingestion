import { Suspense } from "react";

import { DataTableSkeleton } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import ErrorSummary from "@/components/ErrorTable/ErrorSummary";
import ErrorTable from "@/components/ErrorTable/ErrorTable";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

interface ErrorTableSearch {
  page?: number;
  page_size?: number;
  country_code?: string;
  dataset_type?: string;
  file_id?: string;
}

export const Route = createFileRoute("/error-table")({
  component: ErrorTablePage,
  validateSearch: (search: Record<string, unknown>): ErrorTableSearch => {
    return {
      page: Number(search?.page) || DEFAULT_PAGE_NUMBER,
      page_size: Number(search?.page_size) || DEFAULT_PAGE_SIZE,
      country_code: (search?.country_code as string) || undefined,
      dataset_type: (search?.dataset_type as string) || undefined,
      file_id: (search?.file_id as string) || undefined,
    };
  },
});

function ErrorTablePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ingestion Errors</h1>
        <p className="text-gray-600">
          View and download records that failed Data Quality (DQ) checks during
          ingestion.
        </p>
      </div>

      <Suspense fallback={<DataTableSkeleton />}>
        <ErrorSummary />
      </Suspense>

      <div className="mt-12">
        <Suspense fallback={<DataTableSkeleton />}>
          <ErrorTable />
        </Suspense>
      </div>
    </div>
  );
}
