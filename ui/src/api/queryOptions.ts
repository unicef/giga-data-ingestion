import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/index.ts";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

export const uploadsQueryOptions = queryOptions({
  queryFn: () =>
    api.uploads.list_uploads({
      page: DEFAULT_PAGE_NUMBER,
      page_size: DEFAULT_PAGE_SIZE,
    }),
  queryKey: ["uploads", DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE],
});

export const listUsersQueryOptions = queryOptions({
  queryKey: ["users"],
  queryFn: api.users.list,
});

export const listApiIngestionsQueryOptions = queryOptions({
  queryKey: ["school_list", DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE],
  queryFn: () =>
    api.qos.list_school_list({
      count: DEFAULT_PAGE_SIZE,
      page: DEFAULT_PAGE_NUMBER,
    }),
});

export const listApprovalRequestQueryOptions = queryOptions({
  queryKey: ["approval-requests", DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE],
  queryFn: () =>
    api.approvalRequests.listCountries({
      page: DEFAULT_PAGE_NUMBER,
      page_size: DEFAULT_PAGE_SIZE,
    }),
});

export const qosGeolocationSchemaQueryOptions = queryOptions({
  queryFn: () => api.schema.get("school_geolocation", true),
  queryKey: ["schema", "school_geolocation", "", true],
});

export const listCountriesQueryOptions = queryOptions({
  queryKey: ["countries"],
  queryFn: api.utils.listCountries,
});

export const listRolesQueryOptions = queryOptions({
  queryKey: ["roles"],
  queryFn: api.roles.list,
});

export const errorTableSummaryQueryOptions = queryOptions({
  queryKey: ["error-table-summary"],
  queryFn: api.errorTable.get_upload_errors_summary,
});

export const errorTableQueryOptions = (params?: {
  country_code?: string;
  dataset_type?: string;
  file_id?: string;
  page: number;
  page_size: number;
}) =>
  queryOptions({
    queryKey: ["error-table", params],
    queryFn: () => api.errorTable.list_upload_errors(params),
  });
