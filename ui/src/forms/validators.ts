import { z } from "zod";

import {
  CommonApiIngestionFormSchema,
  TestApiSchema,
} from "@/forms/ingestApi.ts";
import { AuthorizationTypeEnum, PaginationTypeEnum } from "@/types/qos.ts";

export function validateAuthType(
  val: TestApiSchema | CommonApiIngestionFormSchema,
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
}

export function validatePaginationType(
  val: TestApiSchema | CommonApiIngestionFormSchema,
  ctx: z.RefinementCtx,
) {
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
}

export function validateSchoolId(
  val: TestApiSchema | CommonApiIngestionFormSchema,
  ctx: z.RefinementCtx,
) {
  if (!!val.school_id_key && !val.school_id_send_query_in) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "School ID Send Query In is required when School ID Key is provided",
      path: ["school_id_send_query_in"],
    });
  }
}
