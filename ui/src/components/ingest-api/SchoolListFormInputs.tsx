import { Dispatch, Fragment, SetStateAction, Suspense, useMemo } from "react";
import { Control, FieldValues, UseFormReturn } from "react-hook-form";

import {
  CodeInput,
  FreeTextInput,
  PasswordInput,
  SelectFromArray,
  SelectFromEnum,
  TextInputWithAction,
} from "@/components/ingest-api/school-list/SchoolListInputs.tsx";
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
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
  hasError: boolean;
  users: GraphUser[];
}

export function SchoolListFormInputs({
  errorStates,
  users,
  hookForm: {
    control,
    register,
    watch,
    trigger,
    resetField,
    formState: { errors },
  },
}: SchoolListFormInputsProps) {
  const {
    setIsResponseError,
    setIsValidDataKey,
    setIsValidResponse,
    setResponsePreview,
  } = errorStates;

  const { testApi, isLoading } = useTestApi();

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
          type: "select",
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
            "The key in the JSON response that contains the data to be ingested",
        },
        {
          name: "school_id_key",
          label: "School ID key",
          type: "text",
          required: true,
          helperText: "",
        },
        {
          name: "school_id_send_query_in",
          label: "Send School ID in",
          type: "enum",
          enum: Object.values(SendQueryInEnum),
          required: true,
          helperText: "",
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
          helperText: "",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.LIMIT_OFFSET],
        },
        {
          name: "page_number_key",
          label: "Page number key",
          type: "text",
          required: false,
          helperText: "",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.PAGE_NUMBER],
        },
        {
          name: "page_starts_with",
          label: "Page starts with",
          type: "text",
          required: false,
          helperText: "",
          dependsOnName: "pagination_type",
          dependsOnValue: [PaginationTypeEnum.PAGE_NUMBER],
        },
        {
          name: "page_send_query_in",
          label: "Send pagination parameters in",
          type: "enum",
          enum: Object.values(SendQueryInEnum),
          required: false,
          helperText: "",
          dependsOnName: "pagination_type",
          dependsOnValue: [
            PaginationTypeEnum.PAGE_NUMBER,
            PaginationTypeEnum.LIMIT_OFFSET,
          ],
        },
      ],
    }),
    [
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
    <>
      {Object.entries(schoolListFormMapping).map(([group, formItems]) => (
        <section className="flex flex-col gap-6" key={group}>
          <header className="text-2xl">{group}</header>
          {formItems.map(mapping => {
            const checkDependencies =
              mapping.dependsOnName != null && mapping.dependsOnValue != null
                ? mapping.dependsOnValue.includes(
                    watch(mapping.dependsOnName) as string,
                  )
                : true;

            return (
              <Fragment key={mapping.name}>
                {mapping.type === "text" ? (
                  checkDependencies && (
                    <FreeTextInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  )
                ) : mapping.type === "select" ? (
                  <SelectFromArray
                    options={users}
                    getOptionText={user =>
                      user.display_name
                        ? `${user.display_name} (${user.mail})`
                        : user.mail
                    }
                    mapping={mapping}
                    errors={errors}
                    register={register(mapping.name, {
                      required: mapping.required,
                      onChange: mapping.onChange,
                    })}
                  />
                ) : mapping.type === "enum" ? (
                  <SelectFromEnum
                    mapping={mapping}
                    errors={errors}
                    register={register(mapping.name, {
                      required: mapping.required,
                      onChange: mapping.onChange,
                    })}
                  />
                ) : mapping.type === "text-action" ? (
                  <TextInputWithAction
                    onAction={mapping.action}
                    actionLabel="Test"
                    isActionLoading={isLoading}
                    mapping={mapping}
                    errors={errors}
                    register={register(mapping.name, {
                      required: mapping.required,
                      onChange: mapping.onChange,
                    })}
                  />
                ) : mapping.type === "password" ? (
                  checkDependencies && (
                    <PasswordInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  )
                ) : mapping.type === "code" ? (
                  checkDependencies && (
                    <CodeInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  )
                ) : null}
              </Fragment>
            );
          })}
        </section>
      ))}

      <Suspense>
        <ReactHookFormDevTools
          control={
            control as unknown as Control<FieldValues, SchoolListFormSchema>
          }
        />
      </Suspense>
    </>
  );
}

export default SchoolListFormInputs;
