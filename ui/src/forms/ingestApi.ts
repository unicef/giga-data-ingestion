import { z } from "zod";
import { zu } from "zod_utilz";

import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SendQueryInEnum,
} from "@/types/qos.ts";

const requiredFieldErrorMessage = "This field is required";

export const CommonApiIngestionFormSchema = z.object({
  api_auth_api_key: z.string().nullable(),
  api_auth_api_value: z.string().nullable(),
  api_endpoint: z.string().url(),
  authorization_type: z.nativeEnum(AuthorizationTypeEnum),
  basic_auth_password: z.string().nullable(),
  basic_auth_username: z.string().nullable(),
  bearer_auth_bearer_token: z.string().nullable(),
  data_key: z.string().nullable(),
  page_number_key: z.string().nullable(),
  page_offset_key: z.string().nullable(),
  page_send_query_in: z.nativeEnum(SendQueryInEnum),
  page_size_key: z.string().nullable(),
  page_starts_with: z.coerce.number().int().nullable(),
  pagination_type: z.nativeEnum(PaginationTypeEnum),
  query_parameters: z.union([zu.stringToJSON().nullable(), z.string().max(0)]),
  request_body: zu.stringToJSON().nullable(),
  request_method: z.nativeEnum(RequestMethodEnum),
  school_id_key: z.string(),
  school_id_send_query_in: z.nativeEnum(SendQueryInEnum),
  size: z.coerce.number().int().nullable(),
});

export type CommonApiIngestionFormSchema = z.infer<
  typeof CommonApiIngestionFormSchema
>;

function commonSuperRefine(
  val: CommonApiIngestionFormSchema,
  ctx: z.RefinementCtx,
) {
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
        console.log("HI", val.basic_auth_username, !val.basic_auth_username);
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

  switch (val.pagination_type) {
    case PaginationTypeEnum.LIMIT_OFFSET: {
      if (!val.size || val.size < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Size is required when Pagination Method is LIMIT OFFSET",
          path: ["size"],
        });
      }
      if (!val.page_size_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Page Size Key is required when Pagination Method is LIMIT OFFSET",
          path: ["page_size_key"],
        });
      }
      if (!val.page_offset_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Page Offset Key is required when Pagination Method is LIMIT OFFSET",
          path: ["page_offset_key"],
        });
      }
      break;
    }
    case PaginationTypeEnum.PAGE_NUMBER: {
      if (!val.size || val.size < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Size is required when Pagination Method is PAGE NUMBER",
          path: ["size"],
        });
      }
      if (!val.page_size_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Page Size Key is required when Pagination Method is PAGE NUMBER",
          path: ["page_size_key"],
        });
      }
      if (!val.page_number_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Page Number Key is required when Pagination Method is PAGE NUMBER",
          path: ["page_number_key"],
        });
      }
      if (!val.page_starts_with || val.page_starts_with < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Page Starts With must be greater than or equal to 0 when Pagination Method is PAGE NUMBER",
          path: ["page_starts_with"],
        });
      }
      break;
    }
  }

  if (!!val.school_id_key && !val.school_id_send_query_in) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "School ID Send Query In is required when School ID Key is provided",
      path: ["school_id_send_query_in"],
    });
  }
}

export const SchoolListFormSchema = CommonApiIngestionFormSchema.extend({
  name: z.string().min(1, requiredFieldErrorMessage),
  user_id: z.string().min(1, requiredFieldErrorMessage),
})
  .superRefine(commonSuperRefine)
  .transform(arg => ({
    ...arg,
    query_parameters: arg.query_parameters
      ? JSON.stringify(arg.query_parameters)
      : null,
    request_body: arg.request_body ? JSON.stringify(arg.request_body) : null,
  }));

export type SchoolListFormSchema = z.infer<typeof SchoolListFormSchema>;

export const schoolListFormInitialValues: SchoolListFormSchema = {
  name: "",
  user_id: "",

  request_method: RequestMethodEnum.GET,
  api_endpoint: "",
  authorization_type: AuthorizationTypeEnum.NONE,
  api_auth_api_key: null,
  api_auth_api_value: null,
  basic_auth_password: null,
  basic_auth_username: null,
  bearer_auth_bearer_token: null,
  query_parameters: null,
  request_body: null,

  data_key: null,
  school_id_key: "",
  school_id_send_query_in: SendQueryInEnum.NONE,
  pagination_type: PaginationTypeEnum.NONE,
  page_number_key: null,
  page_offset_key: null,
  page_size_key: null,
  page_starts_with: null,
  size: null,
  page_send_query_in: SendQueryInEnum.NONE,
};

export const SchoolConnectivityFormSchema = CommonApiIngestionFormSchema.extend(
  {
    enabled: z.boolean().default(true),
    ingestion_frequency_minutes: z.number().int().min(5),
    date_key: z.string().nullable(),
    date_format: z.string().nullable(),
    send_date_in: z.string().nullable(),
    response_date_key: z.string().nullable(),
    response_date_format: z.string().nullable(),
  },
)
  .superRefine(commonSuperRefine)
  .transform(arg => ({
    ...arg,
    query_parameters: arg.query_parameters
      ? JSON.stringify(arg.query_parameters)
      : null,
    request_body: arg.request_body ? JSON.stringify(arg.request_body) : null,
  }));

export type SchoolConnectivityFormSchema = z.infer<
  typeof SchoolConnectivityFormSchema
>;

export const schoolConnectivityFormInitialValues: SchoolConnectivityFormSchema =
  {
    request_method: RequestMethodEnum.GET,
    api_endpoint: "",
    authorization_type: AuthorizationTypeEnum.NONE,
    api_auth_api_key: null,
    api_auth_api_value: null,
    basic_auth_password: null,
    basic_auth_username: null,
    bearer_auth_bearer_token: null,
    query_parameters: null,
    request_body: null,

    data_key: null,
    school_id_key: "",
    school_id_send_query_in: SendQueryInEnum.NONE,

    date_key: null,
    date_format: null,
    response_date_key: null,
    response_date_format: null,
    send_date_in: SendQueryInEnum.NONE,

    pagination_type: PaginationTypeEnum.NONE,
    page_number_key: null,
    page_offset_key: null,
    page_size_key: null,
    page_starts_with: null,
    size: null,
    page_send_query_in: SendQueryInEnum.NONE,

    ingestion_frequency_minutes: 0,
    enabled: true,
  };

export const ConfigureColumnsForm = z
  .record(z.string().nullable())
  .transform(arg =>
    Object.fromEntries(
      Object.entries(arg).map(([key, value]) => {
        if (value === "") return [key, null];
        return [key, value];
      }),
    ),
  );

export type ConfigureColumnsForm = z.infer<typeof ConfigureColumnsForm>;
