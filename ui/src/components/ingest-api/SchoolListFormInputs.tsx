import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import IngestApiFormInputs from "@/components/ingest-api/IngestApiFormInputs.tsx";
import type { SchoolListFormSchema } from "@/forms/ingestApi.ts";
import type { Country } from "@/types/country.ts";
import type { IngestApiFormMapping } from "@/types/ingestApi.ts";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SendQueryInEnum,
} from "@/types/qos";
import type { GraphUser } from "@/types/user";

interface SchoolListFormInputsProps {
  users: GraphUser[];
  countries: Country[];
}

export function SchoolListFormInputs({ users, countries }: SchoolListFormInputsProps) {
  const { resetField } = useFormContext<SchoolListFormSchema>();

  const schoolListFormMapping = useMemo<
    Record<string, IngestApiFormMapping<SchoolListFormSchema>[]>
  >(
    () => ({
      "Ingestion Details": [
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          helperText: "",
        },
        {
          name: "user_id",
          label: "Owner",
          type: "select-user",
          options: users,
          required: true,
          helperText:
            "Who will be the designated point person responsible for this ingestion?",
        },
        {
          name: "country",
          label: "Country",
          type: "select-object",
          options: countries,
          labelAccessor: "name_short",
          valueAccessor: "ISO3",
          required: true,
          helperText:
            "Who will be the designated point person responsible for this ingestion?",
        },
      ],
      "Ingestion Source": [
        {
          name: "request_method",
          type: "enum",
          enum: Object.values(RequestMethodEnum),
          required: true,
          helperText: "",
          label: "Request Method",
          onChange: () => {
            resetField("request_body");
            resetField("query_parameters");
          },
        },
        {
          name: "api_endpoint",
          label: "API Endpoint",
          type: "text",
          required: true,
          helperText: "",
          placeholder: "https://example.com/api/ingest",
        },
        {
          name: "authorization_type",
          label: "Authentication Method",
          type: "enum",
          enum: Object.values(AuthorizationTypeEnum),
          required: true,
          helperText: "",
          onChange: () => {
            resetField("api_auth_api_key");
            resetField("api_auth_api_value");
            resetField("basic_auth_username");
            resetField("basic_auth_password");
            resetField("bearer_auth_bearer_token");
          },
        },
        {
          name: "api_auth_api_key",
          label: "API Key Name",
          type: "text",
          required: false,
          helperText: "",
          dependsOnName: "authorization_type",
          dependsOnValue: [AuthorizationTypeEnum.API_KEY],
        },
        {
          name: "api_auth_api_value",
          label: "API Key Value",
          type: "password",
          required: false,
          helperText: "",
          dependsOnName: "authorization_type",
          dependsOnValue: [AuthorizationTypeEnum.API_KEY],
        },
        {
          name: "basic_auth_username",
          label: "Username",
          type: "text",
          required: false,
          helperText: "",
          dependsOnName: "authorization_type",
          dependsOnValue: [AuthorizationTypeEnum.BASIC_AUTH],
        },
        {
          name: "basic_auth_password",
          label: "Password",
          type: "password",
          required: false,
          helperText: "",
          dependsOnName: "authorization_type",
          dependsOnValue: [AuthorizationTypeEnum.BASIC_AUTH],
        },
        {
          name: "bearer_auth_bearer_token",
          label: "Bearer Token",
          type: "password",
          required: false,
          helperText: "",
          dependsOnName: "authorization_type",
          dependsOnValue: [AuthorizationTypeEnum.BEARER_TOKEN],
        },
        {
          name: "query_parameters",
          label: "Query parameters",
          type: "code",
          required: false,
          helperText: "",
          placeholder: 'Input query parameters in JSON format, e.g. {"key": "value"}',
        },
        {
          name: "request_body",
          label: "Request body",
          type: "code",
          required: false,
          helperText: "",
          placeholder: 'Input request body in JSON format, e.g. {"key": "value"}',
          dependsOnName: "request_method",
          dependsOnValue: [RequestMethodEnum.POST],
        },
      ],
      "Ingestion Parameters": [
        {
          name: "data_key",
          label: "Data key",
          type: "text",
          required: false,
          helperText:
            "If the API response is a flat list, leave this blank. If the API response is an object, specify the key that contains a homogeneous array of records to be ingested.",
        },
        {
          name: "school_id_key",
          label: "School ID key",
          type: "text",
          required: false,
          helperText:
            "Specify the name of the key in the API response that contains the school ID.",
        },
        {
          name: "pagination_type",
          label: "Pagination Method",
          type: "enum",
          enum: Object.values(PaginationTypeEnum),
          required: false,
          helperText: "",
          onChange: () => {
            resetField("page_number_key");
            resetField("page_starts_with");
            resetField("page_size_key");
            resetField("size");
            resetField("page_offset_key");
            resetField("page_send_query_in");
          },
        },
        {
          name: "page_number_key",
          label: "Page number key",
          type: "text",
          required: false,
          helperText: "The name of the key that specifies the page number.",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.PAGE_NUMBER],
        },
        {
          name: "page_starts_with",
          label: "Page starts with",
          type: "text",
          required: false,
          helperText:
            "Whether the page numbering should start at 0 or 1, or another number. This will also be used as the test value for page number.",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.PAGE_NUMBER],
        },
        {
          name: "page_size_key",
          label: "Page size key",
          type: "text",
          required: false,
          helperText: "The name of the key that specifies the page size.",
          dependsOnName: "pagination_type",
          dependsOnValue: [
            PaginationTypeEnum.LIMIT_OFFSET,
            PaginationTypeEnum.PAGE_NUMBER,
          ],
        },
        {
          name: "size",
          label: "Page size",
          type: "text",
          required: false,
          helperText: "",
          dependsOnName: "pagination_type",
          dependsOnValue: [
            PaginationTypeEnum.LIMIT_OFFSET,
            PaginationTypeEnum.PAGE_NUMBER,
          ],
        },
        {
          name: "page_offset_key",
          label: "Page offset key",
          type: "text",
          required: false,
          helperText: "The name of the key that specifies the page offset.",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.LIMIT_OFFSET],
        },
        {
          name: "page_send_query_in",
          label: "Send pagination parameters in",
          type: "enum",
          enum: Object.values(SendQueryInEnum),
          required: false,
          helperText: "Specify where to insert the pagination parameters.",
          dependsOnName: "pagination_type",
          dependsOnValue: [
            PaginationTypeEnum.PAGE_NUMBER,
            PaginationTypeEnum.LIMIT_OFFSET,
          ],
        },
      ],
    }),
    [countries, resetField, users],
  );

  return <IngestApiFormInputs formMappings={schoolListFormMapping} />;
}

export default SchoolListFormInputs;
