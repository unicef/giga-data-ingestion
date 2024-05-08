import {
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";

export enum AuthorizationTypeEnum {
  NONE = "NONE",
  API_KEY = "API_KEY",
  BASIC_AUTH = "BASIC_AUTH",
  BEARER_TOKEN = "BEARER_TOKEN",
}

export enum PaginationTypeEnum {
  NONE = "NONE",
  LIMIT_OFFSET = "LIMIT_OFFSET",
  PAGE_NUMBER = "PAGE_NUMBER",
}
export enum RequestMethodEnum {
  GET = "GET",
  POST = "POST",
}

export enum SendQueryInEnum {
  NONE = "NONE",
  BODY = "BODY",
  QUERY_PARAMETERS = "QUERY_PARAMETERS",
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
  data_key: string;
  date_created: Date;
  date_last_ingested: Date;
  date_last_successfully_ingested: Date;
  date_modified: Date;
  enabled: boolean;
  error_message: string | null;
  page_number_key: string;
  page_offset_key: string;
  page_send_query_in: SendQueryInEnum;
  page_size_key: string;
  page_starts_with: number;
  pagination_type: PaginationTypeEnum;
  query_parameters: string;
  request_body: string;
  request_method: RequestMethodEnum;
  school_id_key: string;
  size: number;
  user_email: string;
  user_id: string;
}

export interface SchoolListResponse extends ApiConfigurationResponse {
  country: string;
  school_connectivity: SchoolConnectivityResponse;
  column_to_schema_mapping: string;
  name: string;
}

export interface PagedSchoolListResponse {
  data: SchoolListResponse[];
  page: number;
  page_size: number;
  total_count: number;
}

export interface SchoolConnectivityResponse extends ApiConfigurationResponse {
  ingestion_frequency: string;
  schema_url: string;
  school_list: SchoolListResponse;
  school_list_id: string;
  date_key: string | null;
  date_format: string | null;
  school_id_send_query_in: SendQueryInEnum;
  send_date_in: SendQueryInEnum | null;
  response_date_key: string;
  response_date_format: string;
}

export interface PagedSchoolConnectivityResponse {
  data: SchoolConnectivityResponse[];
  page_index: string;
  per_page: string;
  total_items: string;
  total_pages: string;
}

export interface ApiIngestionFormValues {
  api_auth_api_key: string | null;
  api_auth_api_value: string | null;
  api_endpoint: string;
  authorization_type: AuthorizationTypeEnum;
  basic_auth_password: string | null;
  basic_auth_username: string | null;
  bearer_auth_bearer_token: string | null;
  data_key: string;
  enabled: boolean;
  error_message: string | null;
  page_number_key: string | null;
  page_offset_key: string | null;
  page_send_query_in: SendQueryInEnum;
  page_size_key: string | null;
  page_starts_with: number | null;
  pagination_type: PaginationTypeEnum;
  query_parameters: string | null;
  request_body: string | null;
  request_method: RequestMethodEnum;
  school_id_key: string;
  size: number | null;
}

export interface SchoolListFormValues extends ApiIngestionFormValues {
  name: string;
  column_to_schema_mapping: string;
  user_email: string;
  user_id: string;
}

export interface SchoolConnectivityFormValues extends ApiIngestionFormValues {
  ingestion_frequency: string;
  date_key: string | null;
  date_format: string | null;
  school_id_send_query_in: SendQueryInEnum;
  send_date_in: string | null;
  response_date_key: string | null;
  response_date_format: string | null;
}

export interface CreateSchoolListRequest extends SchoolListFormSchema {
  country: string;
  column_to_schema_mapping: string;
  enabled: boolean;
  error_message: string | null;
}

export interface CreateSchoolConnectivityRequest
  extends SchoolConnectivityFormSchema {
  error_message: string | null;
}

export interface CreateApiIngestionRequest {
  school_connectivity: CreateSchoolConnectivityRequest;
  school_list: CreateSchoolListRequest;
  file: File | null;
}

export interface EditApiIngestionRequest {
  school_connectivity: CreateSchoolConnectivityRequest;
  school_list: CreateSchoolListRequest;
}
