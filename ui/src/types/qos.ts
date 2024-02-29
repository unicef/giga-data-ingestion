export enum AuthorizationTypeEnum {
  API_KEY = "API_KEY",
  BASIC_AUTH = "BASIC_AUTH",
  BEARER_TOKEN = "BEARER_TOKEN",
  NONE = "NONE",
}

export enum PaginationTypeEnum {
  LIMIT_OFFSET = "LIMIT_OFFSET",
  PAGE_NUMBER = "PAGE_NUMBER",
  NONE = "NONE",
}
export enum RequestMethodEnum {
  GET = "GET",
  POST = "POST",
}

export enum SendQueryInEnum {
  BODY = "BODY",
  QUERY_PARAMETERS = "QUERY_PARAMETERS",
  NONE = "NONE",
}

export interface SchoolListResponse {
  id: string;
  date_created: Date;
  date_modified: Date;
  name: string;

  api_auth_api_key: string;
  api_auth_api_value: string;
  api_endpoint: string;
  authorization_type: AuthorizationTypeEnum;
  basic_auth_password: string;
  basic_auth_username: string;
  bearer_auth_bearer_token: string;
  page_number_key: string;
  page_offset_key: string;
  page_size_key: string;
  page_starts_with: number;
  pagination_type: PaginationTypeEnum;
  query_parameters: string;
  request_body: string;
  request_method: RequestMethodEnum;
  data_key: string;
  school_id_key: string;
  send_query_in: SendQueryInEnum;
  size: number;
  user_email: string;
  user_id: string;

  status: boolean;
  enabled: boolean;
}

export interface PagedSchoolListResponse {
  data: SchoolListResponse[];
  page_index: string;
  per_page: string;
  total_items: string;
  total_pages: string;
}

export interface SchoolListFormValues {
  name: string;
  apiAuthApiKey: string | null;
  apiAuthApiValue: string | null;
  apiEndpoint: string;
  authType: AuthorizationTypeEnum;
  basicAuthPassword: string | null;
  basicAuthUsername: string | null;
  bearerAuthBearerToken: string | null;
  pageNumberKey: string | null;
  pageOffsetKey: string | null;
  pageSizeKey: string | null;
  pageStartsWith: number | null;
  paginationType: PaginationTypeEnum | null | "none";
  queryParamters: string | null;
  requestBody: string | null;
  requestMethod: RequestMethodEnum;
  dataKey: string;
  schoolIdKey: string;
  sendQueryIn: SendQueryInEnum;
  size: number | null;
  userEmail: string;
  userId: string;
}

export const initialSchoolListFormValues: SchoolListFormValues = {
  name: "",
  apiAuthApiKey: null,
  apiAuthApiValue: null,
  apiEndpoint: "",
  authType: AuthorizationTypeEnum.NONE,
  basicAuthPassword: null,
  basicAuthUsername: null,
  bearerAuthBearerToken: null,
  pageNumberKey: null,
  pageOffsetKey: null,
  pageSizeKey: null,
  pageStartsWith: null,
  paginationType: PaginationTypeEnum.NONE,
  queryParamters: null,
  requestBody: null,
  requestMethod: RequestMethodEnum.GET,
  dataKey: "",
  schoolIdKey: "",
  sendQueryIn: SendQueryInEnum.NONE,
  size: null,
  userEmail: "",
  userId: "",
};

export interface MasterColumnMapping {
  school_id: string;
  student_count: string;
  long: string;
  lat: string;
}

// MOCKED Values
export const masterColumns = [
  { name: "school_id", description: "school id description" },
  { name: "student_count", description: "student_count description" },
  { name: "lat", description: "lat  description" },
  { name: "long", description: "long description" },
];
