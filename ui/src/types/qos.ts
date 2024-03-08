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

export interface ApiConfigurationResponse {
  id: string;
  api_auth_api_key: string;
  api_auth_api_value: string;
  api_endpoint: string;
  authorization_type: AuthorizationTypeEnum;
  basic_auth_password: string;
  basic_auth_username: string;
  bearer_auth_bearer_token: string;
  date_created: Date;
  date_modified: Date;
  enabled: boolean;
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
  status: boolean;
  user_email: string;
  user_id: string;
}

export interface SchoolListResponse extends ApiConfigurationResponse {
  column_to_schema_mapping: string;
  name: string;
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
  api_auth_api_key: string | null;
  api_auth_api_value: string | null;
  api_endpoint: string;
  authorization_type: AuthorizationTypeEnum;
  basic_auth_password: string | null;
  basic_auth_username: string | null;
  bearer_auth_bearer_token: string | null;
  data_key: string;
  page_number_key: string | null;
  page_offset_key: string | null;
  page_size_key: string | null;
  page_starts_with: number | null;
  pagination_type: PaginationTypeEnum | null;
  query_parameters: string | null;
  request_body: string | null;
  request_method: RequestMethodEnum;
  school_id_key: string;
  send_query_in: SendQueryInEnum;
  size: number | null;
  user_email: string;
  user_id: string;
}

export const initialSchoolListFormValues: SchoolListFormValues = {
  name: "",
  api_auth_api_key: null,
  api_auth_api_value: null,
  api_endpoint: "",
  authorization_type: AuthorizationTypeEnum.NONE,
  basic_auth_password: null,
  basic_auth_username: null,
  bearer_auth_bearer_token: null,
  data_key: "",
  page_number_key: null,
  page_offset_key: null,
  page_size_key: null,
  page_starts_with: null,
  pagination_type: PaginationTypeEnum.NONE,
  query_parameters: null,
  request_body: null,
  request_method: RequestMethodEnum.GET,
  school_id_key: "",
  send_query_in: SendQueryInEnum.NONE,
  size: null,
  user_email: "",
  user_id: "",
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

export interface SchoolConnectivityResponse extends ApiConfigurationResponse {
  ingestion_frequency: number;
  schema_url: string;
  school_list: SchoolListResponse;
  school_list_id: string;
}

export interface PagedSchoolConnectivityResponse {
  data: SchoolConnectivityResponse[];
  page_index: string;
  per_page: string;
  total_items: string;
  total_pages: string;
}

export interface SchoolConnectivityFormValues {
  api_auth_api_key: string | null;
  api_auth_api_value: string | null;
  api_endpoint: string;
  authorization_type: AuthorizationTypeEnum;
  basic_auth_password: string | null;
  basic_auth_username: string | null;
  bearer_auth_bearer_token: string | null;
  data_key: string;
  enabled: boolean;
  page_number_key: string | null;
  page_offset_key: string | null;
  page_size_key: string | null;
  page_starts_with: number | null;
  pagination_type: PaginationTypeEnum;
  query_parameters: string;
  request_body: string;
  request_method: RequestMethodEnum;
  school_id_key: string;
  send_query_in: SendQueryInEnum;
  size: number | null;
  status: boolean;
  user_email: string;
  user_id: string;

  ingestion_frequency: number;
}
export const initialSchoolConnectivityFormValues: SchoolConnectivityFormValues =
  {
    api_auth_api_key: null,
    api_auth_api_value: null,
    api_endpoint: "",
    authorization_type: AuthorizationTypeEnum.NONE,
    basic_auth_password: null,
    basic_auth_username: null,
    bearer_auth_bearer_token: null,
    data_key: "",
    enabled: false,
    page_number_key: null,
    page_offset_key: null,
    page_size_key: null,
    page_starts_with: null,
    pagination_type: PaginationTypeEnum.NONE,
    query_parameters: "",
    request_body: "",
    request_method: RequestMethodEnum.GET,
    school_id_key: "",
    send_query_in: SendQueryInEnum.NONE,
    size: null,
    status: false,
    user_email: "",
    user_id: "",
    ingestion_frequency: 5, // in minutes
  };

export interface CreateSchoolListRequest extends SchoolListFormValues {
  column_to_schema_mapping: string;
}

export interface CreateApiIngestionRequest {
  school_connectivity: SchoolConnectivityFormValues;
  school_list: CreateSchoolListRequest;
}
