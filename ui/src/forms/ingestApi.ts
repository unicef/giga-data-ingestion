import { z } from "zod";
import { zu } from "zod_utilz";

import {
  validateAuthType,
  validatePaginationType,
} from "@/forms/validators.ts";
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
  query_parameters: z.union([zu.stringToJSON(), z.string().max(0)]).nullable(),
  request_body: z.union([zu.stringToJSON(), z.string().max(0)]).nullable(),
  request_method: z.nativeEnum(RequestMethodEnum),
  school_id_key: z.string().min(1),
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
  validateAuthType(val, ctx);
  validatePaginationType(val, ctx);

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
    ingestion_frequency_minutes: z.coerce.number().int().min(5),
    date_key: z.string().nullable(),
    date_format: z
      .union([
        z.enum(["timestamp", "ISO8601"]),
        z
          .string()
          .regex(
            new RegExp(
              "^(%Y|%m|%d|%H|%M|%S|%z)([\\/\\-_.+: ]?(%Y|%m|%d|%H|%M|%S|%z))?$",
            ),
          ),
      ])
      .nullable(),
    send_date_in: z.string().nullable(),
    response_date_key: z.string().min(1),
    response_date_format: z.string().min(1),
  },
)
  .superRefine((arg, ctx) => {
    commonSuperRefine(arg, ctx);

    if (arg.date_key && !arg.date_format) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date format must be specified when date key is provided.",
        path: ["date_format"],
      });
    }
  })
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
    response_date_key: "",
    response_date_format: "",
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
