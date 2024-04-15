import { z } from "zod";
import { zu } from "zod_utilz";

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

const requiredFieldErrorMessage = "This field is required";

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
  school_id_send_query_in: SendQueryInEnum;
  size: number;
  user_email: string;
  user_id: string;
}

export interface SchoolListResponse extends ApiConfigurationResponse {
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
  ingestion_frequency_minutes: number;
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
  school_id_send_query_in: SendQueryInEnum;
  size: number | null;
}

export const ApiIngestionFormSchema = z.object({
  api_auth_api_key: z.string().nullable(),
  api_auth_api_value: z.string().nullable(),
  api_endpoint: z.string().url(),
  authorization_type: z.nativeEnum(AuthorizationTypeEnum),
  basic_auth_password: z.string().nullable(),
  basic_auth_username: z.string().nullable(),
  bearer_auth_bearer_token: z.string().nullable(),
  data_key: z.string().nullable(),
  enabled: z.boolean(),
  error_message: z.string().nullable(),
  page_number_key: z.string().nullable(),
  page_offset_key: z.string().nullable(),
  page_send_query_in: z.nativeEnum(SendQueryInEnum),
  page_size_key: z.string().nullable(),
  page_starts_with: z.number().int().nullable(),
  pagination_type: z.nativeEnum(PaginationTypeEnum),
  query_parameters: z.union([zu.stringToJSON().nullable(), z.string().max(0)]),
  request_body: zu.stringToJSON().nullable(),
  request_method: z.nativeEnum(RequestMethodEnum),
  school_id_key: z.string(),
  school_id_send_query_in: z.nativeEnum(SendQueryInEnum),
  size: z.number().int().nullable(),
});

export type ApiIngestionFormSchema = z.infer<typeof ApiIngestionFormSchema>;

export interface SchoolListFormValues extends ApiIngestionFormValues {
  name: string;
  column_to_schema_mapping: string;
  user_email: string;
  user_id: string;
}

export const SchoolListFormSchema = ApiIngestionFormSchema.extend({
  name: z.string().min(1, requiredFieldErrorMessage),
  column_to_schema_mapping: z.string().min(1),
  user_email: z.string().email(),
  user_id: z.string().min(1, requiredFieldErrorMessage),
}).superRefine((val, ctx) => {
  switch (val.authorization_type) {
    case AuthorizationTypeEnum.API_KEY: {
      if (!val.api_auth_api_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "API Key Name is required when Authorization Type is API Key",
          path: ["api_auth_api_key"],
        });
      }
      if (!val.api_auth_api_value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "API Key Value is required when Authorization Type is API KEY",
          path: ["api_auth_api_value"],
        });
      }
      break;
    }
    case AuthorizationTypeEnum.BEARER_TOKEN: {
      if (!val.bearer_auth_bearer_token) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Bearer Token is required when Authorization Type is BEARER TOKEN",
          path: ["bearer_auth_bearer_token"],
        });
      }
      break;
    }
    case AuthorizationTypeEnum.BASIC_AUTH: {
      if (!val.basic_auth_username) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Username is required when Authorization Type is BASIC AUTH",
          path: ["basic_auth_username"],
        });
      }
      if (!val.basic_auth_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required when Authorization Type is BASIC AUTH",
          path: ["basic_auth_password"],
        });
      }
      break;
    }
  }
});

export type SchoolListFormSchema = z.infer<typeof SchoolListFormSchema>;

export interface SchoolConnectivityFormValues extends ApiIngestionFormValues {
  ingestion_frequency_minutes: number;
  date_key: string | null;
  date_format: string | null;
  send_date_in: string | null;
  response_date_key: string | null;
  response_date_format: string | null;
}

export const SchoolConnectivityFormSchema = ApiIngestionFormSchema.extend({
  ingestion_frequency_minutes: z.number().int(),
  date_key: z.string().nullable(),
  date_format: z.string().nullable(),
  send_date_in: z.string().nullable(),
  response_date_key: z.string().nullable(),
  response_date_format: z.string().nullable(),
});

export type SchoolConnectivityFormSchema = z.infer<
  typeof SchoolConnectivityFormSchema
>;

export const initialApiIngestionFormValues: ApiIngestionFormValues = {
  api_auth_api_key: null,
  api_auth_api_value: null,
  api_endpoint: "",
  authorization_type: AuthorizationTypeEnum.NONE,
  basic_auth_password: null,
  basic_auth_username: null,
  bearer_auth_bearer_token: null,
  data_key: "",
  enabled: true,
  error_message: null,
  page_number_key: null,
  page_offset_key: null,
  page_send_query_in: SendQueryInEnum.NONE,
  page_size_key: null,
  page_starts_with: null,
  pagination_type: PaginationTypeEnum.NONE,
  query_parameters: null,
  request_body: null,
  request_method: RequestMethodEnum.GET,
  school_id_key: "",
  school_id_send_query_in: SendQueryInEnum.NONE,
  size: null,
};

export const initialSchoolListFormValues: SchoolListFormValues = {
  ...initialApiIngestionFormValues,
  name: "",
  column_to_schema_mapping: "",
  user_email: "",
  user_id: "",
};

export const initialSchoolConnectivityFormValues: SchoolConnectivityFormValues =
  {
    ...initialApiIngestionFormValues,

    ingestion_frequency_minutes: 5,
    date_key: null,
    date_format: null,
    send_date_in: SendQueryInEnum.QUERY_PARAMETERS,
    response_date_key: null,
    response_date_format: null,
  };

export interface CreateSchoolListRequest extends SchoolListFormValues {}

export interface CreateSchoolConnectivityRequest
  extends SchoolConnectivityFormValues {}
export interface CreateApiIngestionRequest {
  school_connectivity: CreateSchoolConnectivityRequest;
  school_list: CreateSchoolListRequest;
  file: File | null;
}

export interface EditApiIngestionRequest {
  school_connectivity: CreateSchoolConnectivityRequest;
  school_list: CreateSchoolListRequest;
}
