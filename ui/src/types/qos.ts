export enum AuthorizationTypeEnum {
  API_KEY = "API_KEY",
  BASIC_AUTH = "BASIC_AUTH",
  BEARER_TOKEN = "BEARER_TOKEN",
}

export enum PaginationTypeEnum {
  LIMIT_OFFSET = "LIMIT_OFFSET",
  PAGE_NUMBER = "PAGE_NUMBER",
}
export enum RequestMethodEnum {
  GET = "GET",
  POST = "POST",
}

export enum SendQueryInEnum {
  BODY = "BODY",
  HEADERS = "HEADERS",
  QUERY_PARAMETERS = "QUERY_PARAMETERS",
}

export interface SchoolListResponse {
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
  school_id_key: string;
  send_query_in: SendQueryInEnum;
  size: number;
  status: boolean;
  user_email: string;
  user_id: string;
}

export interface PagedSchoolListResponse {
  data: SchoolListResponse[];
  page_index: string;
  per_page: string;
  total_items: string;
  total_pages: string;
}
