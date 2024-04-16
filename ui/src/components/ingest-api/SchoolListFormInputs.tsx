import { Dispatch, SetStateAction, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

import IngestApiFormInputs from "@/components/ingest-api/IngestApiFormInputs.tsx";
import { SchoolListFormSchema } from "@/forms/ingestApi.ts";
import { useTestApi } from "@/hooks/useTestApi.ts";
import { IngestApiFormMapping } from "@/types/ingestApi.ts";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SendQueryInEnum,
} from "@/types/qos";
import { GraphUser } from "@/types/user";

interface ErrorStates {
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDataKey: Dispatch<SetStateAction<boolean>>;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
}

interface FetchingStates {
  isUsersRefetching: boolean;
  isUsersFetching: boolean;
}

interface SchoolListFormInputsProps {
  hookForm: UseFormReturn<SchoolListFormSchema>;
  errorStates: ErrorStates;
  fetchingStates: FetchingStates;
  users: GraphUser[];
}

export function SchoolListFormInputs({
  errorStates,
  users,
  hookForm,
}: SchoolListFormInputsProps) {
  const {
    setIsResponseError,
    setIsValidDataKey,
    setIsValidResponse,
    setResponsePreview,
  } = errorStates;

  const { watch, trigger, resetField } = hookForm;

  const { testApi, isLoading } = useTestApi<SchoolListFormSchema>();

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
            resetField("query_parameters");
            resetField("request_body");
          },
        },
        {
          name: "api_endpoint",
          label: "API Endpoint",
          type: "text-action",
          isActionLoading: isLoading,
          action: async () => {
            if (
              !(await trigger([
                "request_method",
                "api_endpoint",
                "authorization_type",
                "query_parameters",
                "request_body",
              ]))
            )
              return;

            await testApi({
              setIsValidResponse,
              setIsResponseError,
              setResponsePreview,
              watch,
              setIsValidDataKey,
            });
          },
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
          placeholder:
            'Input query parameters in JSON format, e.g. {"key": "value"}',
        },
        {
          name: "request_body",
          label: "Request body",
          type: "code",
          required: false,
          helperText: "",
          placeholder:
            'Input request body in JSON format, e.g. {"key": "value"}',
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
            "If the API response is a flat list, leave this blank. If the API response is an object, specify the key that contains a homogeneous array of records to be ingested",
        },
        {
          name: "school_id_key",
          label: "School ID key",
          type: "text",
          required: true,
          helperText:
            "If the API requires a school ID parameter, specify the name of the record where this ID should be sent",
        },
        {
          name: "school_id_send_query_in",
          label: "Send School ID in",
          type: "enum",
          enum: Object.values(SendQueryInEnum),
          required: true,
          helperText: "Specify where to add the school ID record",
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
            resetField("page_offset_key");
            resetField("page_starts_with");
            resetField("size");
          },
        },
        {
          name: "size",
          label: "Records per page",
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
          name: "page_size_key",
          label: "Page size key",
          type: "text",
          required: false,
          helperText: "The name of the key that specifies the page size",
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
          helperText: "The name of the key that specifies the page offset",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.LIMIT_OFFSET],
        },
        {
          name: "page_number_key",
          label: "Page number key",
          type: "text",
          required: false,
          helperText: "The name of the key that specifies the page number",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.PAGE_NUMBER],
        },
        {
          name: "page_starts_with",
          label: "Page starts with",
          type: "text",
          required: false,
          helperText:
            "Whether the page numbering should start at 0 or 1, or another number",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.PAGE_NUMBER],
        },
        {
          name: "page_send_query_in",
          label: "Send pagination parameters in",
          type: "enum",
          enum: Object.values(SendQueryInEnum),
          required: false,
          helperText: "Specify where to insert the pagination parameters",
          dependsOnName: "pagination_type",
          dependsOnValue: [
            PaginationTypeEnum.PAGE_NUMBER,
            PaginationTypeEnum.LIMIT_OFFSET,
          ],
        },
      ],
    }),
    [
      isLoading,
      resetField,
      setIsResponseError,
      setIsValidDataKey,
      setIsValidResponse,
      setResponsePreview,
      testApi,
      trigger,
      watch,
    ],
  );

  return (
    <IngestApiFormInputs
      hookForm={hookForm}
      formMappings={schoolListFormMapping}
    />
  );
}

export default SchoolListFormInputs;
