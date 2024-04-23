import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import IngestApiFormInputs from "@/components/ingest-api/IngestApiFormInputs.tsx";
import { SchoolConnectivityFormSchema } from "@/forms/ingestApi.ts";
import { IngestApiFormMapping } from "@/types/ingestApi.ts";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SendQueryInEnum,
} from "@/types/qos";

export function SchoolConnectivityFormInputs() {
  const { resetField } = useFormContext<SchoolConnectivityFormSchema>();

  const schoolConnectivityFormMapping = useMemo<
    Record<string, IngestApiFormMapping<SchoolConnectivityFormSchema>[]>
  >(
    () => ({
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
            "If the API response is a flat list, leave this blank. If the API response is an object, specify the key that contains a homogeneous array of records to be ingested.",
        },
        {
          name: "school_id_key",
          label: "School ID key",
          type: "text",
          required: true,
          helperText:
            "If the API requires a school ID parameter, specify the name of the record where this ID should be sent.",
        },
        {
          name: "school_id_send_query_in",
          label: "Send School ID in",
          type: "enum",
          enum: Object.values(SendQueryInEnum),
          required: true,
          helperText: "Specify where to add the school ID record.",
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
        {
          name: "date_key",
          label: "Request date key",
          type: "text",
          required: false,
          helperText:
            "If the API requires a date parameter, specify the name of the record where this date should be sent.",
          onChange: e => {
            // @ts-expect-error text field has e.target.value, TODO: figure out what the correct type is
            if (e?.target.value === "") {
              resetField("date_format");
            }
          },
        },
        {
          name: "date_format",
          label: "Request date format",
          type: "text",
          required: false,
          helperText: `If the API requires a date parameter, specify the date format using one of the following:
          - A valid Python datetime format string, e.g. %Y-%m-%d %H:%M:%S
          - "timestamp" for Unix epoch timestamps (in milliseconds)
          - "ISO8601" for ISO timestamps, e.g. 2024-01-01T03:14:00Z
          `,
          dependsOnName: "date_key",
          dependsOnValue: true,
        },
        {
          name: "response_date_key",
          label: "Response date key",
          type: "text",
          required: true,
          helperText:
            "The key in the API response body that contains the timestamp.",
        },
        {
          name: "response_date_format",
          label: "Response date format",
          type: "text",
          required: true,
          helperText: `Specify the date format of the response timestamp using one of the following:
          - A valid Python datetime format string, e.g. %Y-%m-%d %H:%M:%S
          - "timestamp" for Unix epoch timestamps (in milliseconds)
          - "ISO8601" for ISO timestamps, e.g. 2024-01-01T03:14:00Z
          `,
        },
        {
          name: "ingestion_frequency",
          label: "Frequency",
          type: "text",
          required: true,
          helperText:
            "Ingestion frequency in minutes. Minimum value is 5 minutes. Must be a valid UNIX cron format",
        },
        {
          name: "enabled",
          label:
            "Whether to create the ingestion in an enabled state. You can change this later in the Ingestions listing.",
          type: "toggle",
          required: true,
          helperText: "",
        },
      ],
    }),
    [],
  );

  return <IngestApiFormInputs formMappings={schoolConnectivityFormMapping} />;

  //       {hasFileUpload && (
  //         <>
  //           <header className="text-lg">CSV Schema</header>
  //
  //           <UploadFile
  //             acceptType={{
  //               "text/csv": [".csv"],
  //             }}
  //             description="CSV only"
  //             file={file}
  //             setFile={file => setFile(file)}
  //           />
  //         </>
  //       )}
  //       <IngestionEnabledToggle />
  //     </section>
  //   </>
  // );
}

export default SchoolConnectivityFormInputs;
