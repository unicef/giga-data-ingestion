import { Dispatch, SetStateAction, useState } from "react";
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";

import { SelectItem, TextArea, TextInput, Toggle } from "@carbon/react";

import { Select } from "@/components/forms/Select";
import TestApiButton from "@/components/ingest-api/TestApiButton";
import UploadFile from "@/components/upload/UploadFile.tsx";
import { useStore } from "@/context/store";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SchoolConnectivityFormValues,
  SendQueryInEnum,
} from "@/types/qos";

import ControllerNumberInputSchoolConnectivity from "../upload/ControllerNumberInputSchoolConnectivity";

interface ErrorStates {
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDatakey: Dispatch<SetStateAction<boolean>>;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
}

interface GetValuesProps {
  apiEndpoint: string;
  apiKeyName: string | null;
  apiKeyValue: string | null;
  authorizationType: AuthorizationTypeEnum;
  basicAuthPassword: string | null;
  basicAuthUserName: string | null;
  bearerAuthBearerToken: string | null;
  dataKey: string;
  queryParams: string | null;
  requestBody: string | null;
  requestMethod: RequestMethodEnum;
}

interface UseFormHookReturnValues {
  control: Control<SchoolConnectivityFormValues>;
  errors: FieldErrors<SchoolConnectivityFormValues>;
  register: UseFormRegister<SchoolConnectivityFormValues>;
  trigger: UseFormTrigger<SchoolConnectivityFormValues>;
}

interface SchoolConnectivityFormInputsProps {
  errorStates: ErrorStates;
  gettedFormValues: GetValuesProps;
  hasError: boolean;
  watchAuthType: AuthorizationTypeEnum;
  watchPaginationType: PaginationTypeEnum;
  watchRequestMethod: RequestMethodEnum;
  useFormHookReturnValues: UseFormHookReturnValues;
  hasFileUpload?: boolean;
}

const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
const { POST } = RequestMethodEnum;

export function SchoolConnectivityFormInputs({
  errorStates,
  gettedFormValues,
  hasError,
  watchAuthType,
  watchPaginationType,
  watchRequestMethod,
  useFormHookReturnValues,
  hasFileUpload = true,
}: SchoolConnectivityFormInputsProps) {
  const [queryParameterError, setQueryParameterError] = useState<string>("");
  const [requestBodyError, setRequestBodyError] = useState<string>("");

  const {
    setIsResponseError,
    setIsValidDatakey,
    setIsValidResponse,
    setResponsePreview,
  } = errorStates;

  const {
    apiEndpoint,
    apiKeyName,
    apiKeyValue,
    authorizationType,
    basicAuthPassword,
    basicAuthUserName,
    bearerAuthBearerToken,
    dataKey,
    queryParams,
    requestBody,
    requestMethod,
  } = gettedFormValues;

  const { control, errors, register, trigger } = useFormHookReturnValues;

  const {
    apiIngestionSlice: { file },
    apiIngestionSliceActions: { setFile },
  } = useStore();

  const DataKeyTextInput = () => (
    <TextInput
      id="data_key"
      helperText="The key in the JSON response that will contain the data to be ingested"
      invalid={!!errors.data_key}
      labelText="Data key"
      {...register("data_key")}
    />
  );

  const SchoolIdKeyTextInput = () => (
    <TextInput
      id="school_id_key"
      invalid={!!errors.school_id_key}
      labelText="School ID key"
      {...register("school_id_key", { required: true })}
    />
  );

  const RequestMethodSelect = () => (
    <Select
      id="request_method"
      invalid={!!errors.request_method}
      labelText="Request Method"
      {...register("request_method", { required: true })}
    >
      {Object.keys(RequestMethodEnum).map(request_method => (
        <SelectItem
          key={request_method}
          value={request_method}
          text={request_method}
        />
      ))}
    </Select>
  );

  const ApiEndpointTextInput = () => (
    <div className="flex items-end">
      <TextInput
        id="api_endpoint"
        invalid={!!errors.api_endpoint}
        labelText="API Endpoint"
        placeholder="https://example.com/api/ingest"
        {...register("api_endpoint", { required: true })}
      />
      <div className="bottom-px">
        <TestApiButton
          apiEndpoint={apiEndpoint}
          authorizationType={authorizationType}
          apiKeyName={apiKeyName}
          apiKeyValue={apiKeyValue}
          basicAuthPassword={basicAuthPassword}
          basicAuthUserName={basicAuthUserName}
          bearerAuthBearerToken={bearerAuthBearerToken}
          dataKey={dataKey}
          hasError={hasError}
          queryParams={queryParams}
          requestBody={requestBody}
          requestMethod={requestMethod}
          setIsResponseError={setIsResponseError}
          setIsValidDatakey={setIsValidDatakey}
          setIsValidResponse={setIsValidResponse}
          setResponsePreview={setResponsePreview}
          handleTriggerValidation={() => trigger()}
        />
      </div>
    </div>
  );

  const AuthTypeSelect = () => (
    <Select
      id="authorization_type"
      invalid={!!errors.authorization_type}
      labelText="Authentication Method"
      {...register("authorization_type", { required: true })}
    >
      {Object.keys(AuthorizationTypeEnum).map(authorization_type => (
        <SelectItem
          key={authorization_type}
          text={authorization_type.replace(/_/g, " ")}
          value={authorization_type}
        />
      ))}
    </Select>
  );

  const AuthApiKeyInputs = () => (
    <>
      <TextInput
        id="api_auth_api_key"
        invalid={!!errors.api_auth_api_key}
        labelText="api response key"
        placeholder="Input Authentication Credentials"
        {...register("api_auth_api_key", { required: true })}
      />
      {/*
      //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
      <TextInput.PasswordInput
        autoComplete="on"
        id="api_auth_api_value"
        invalid={!!errors.api_auth_api_value}
        labelText="Authentication Credentials"
        placeholder="Input Authentication Credentials"
        {...register("api_auth_api_value", { required: true })}
      />
    </>
  );

  const AuthBasicInputs = () => (
    <>
      <TextInput
        id="basic_auth_username"
        invalid={!!errors.basic_auth_username}
        labelText="api response key"
        placeholder="Input Authentication Credentials"
        {...register("basic_auth_username", { required: true })}
      />
      {/*
      //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
      <TextInput.PasswordInput
        autoComplete="on"
        id="basic_auth_password"
        invalid={!!errors.basic_auth_password}
        labelText="Authentication Credentials"
        placeholder="Input Authentication Credentials"
        {...register("basic_auth_password", { required: true })}
      />
    </>
  );

  const AuthBearerInputs = () => (
    <>
      {/*
      //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
      <TextInput.PasswordInput
        autoComplete="on"
        id="bearer_auth_bearer_token"
        invalid={!!errors.bearer_auth_bearer_token}
        labelText="Authentication Credentials"
        placeholder="Input Authentication Credentials"
        {...register("bearer_auth_bearer_token", {
          required: true,
        })}
      />
    </>
  );

  const PaginationTypeSelect = () => (
    <Select
      id="pagination_type"
      invalid={!!errors.pagination_type}
      labelText="Pagination Method"
      {...register("pagination_type", { required: true })}
    >
      {Object.keys(PaginationTypeEnum).map(pagination_type => (
        <SelectItem
          key={pagination_type}
          text={pagination_type.replace(/_/g, " ")}
          value={pagination_type}
        />
      ))}
    </Select>
  );

  const PaginationLimitOffsetInputs = () => (
    <>
      <ControllerNumberInputSchoolConnectivity
        control={control}
        name="size"
        numberInputProps={{
          id: "size",
          label: <span>Records per page</span>,
          min: 0,
        }}
      />
      <TextInput
        id="page_size_key"
        invalid={!!errors.page_size_key}
        labelText="Page size key"
        placeholder="Input page size key"
        {...register("page_size_key", { required: true })}
      />
      <TextInput
        id="page_offset_key"
        invalid={!!errors.page_offset_key}
        labelText="Page Offset key"
        placeholder="Input Page Offset key"
        {...register("page_offset_key", { required: true })}
      />
    </>
  );

  const PaginationPageNumberInputs = () => (
    <>
      <ControllerNumberInputSchoolConnectivity
        control={control}
        name="size"
        numberInputProps={{
          id: "size",
          label: <span>Records per page</span>,
          min: 0,
        }}
      />
      <TextInput
        id="page_size_key"
        invalid={!!errors.page_size_key}
        labelText="Page size key"
        placeholder="Input page size key"
        {...register("page_size_key", { required: true })}
      />
      <TextInput
        id="page_number_key"
        invalid={!!errors.page_number_key}
        labelText="Page number key"
        placeholder="Input page number key"
        {...register("page_number_key", { required: true })}
      />

      <Select
        id="page_starts_with"
        invalid={!!errors.page_starts_with}
        labelText="Page Starts with"
        {...register("page_starts_with", { required: true })}
      >
        <SelectItem key="0" text="0" value={0} />
        <SelectItem key="1" text="1" value={1} />
      </Select>
    </>
  );

  const PageSendQueryInSelect = () => (
    <Select
      id="page_send_query_in"
      invalid={!!errors.page_send_query_in}
      labelText="Page send query in"
      {...register("page_send_query_in", { required: true })}
    >
      {Object.keys(SendQueryInEnum).map(send_query_in => (
        <SelectItem
          key={send_query_in}
          text={send_query_in.replace(/_/g, " ")}
          value={send_query_in}
        />
      ))}
    </Select>
  );

  const SchoolIdSendQueryInSelect = () => (
    <Select
      id="school_send_query_in"
      invalid={!!errors.school_id_send_query_in}
      labelText="School Id Send query in"
      {...register("school_id_send_query_in", { required: true })}
    >
      {Object.keys(SendQueryInEnum).map(send_query_in => (
        <SelectItem
          key={send_query_in}
          text={send_query_in.replace(/_/g, " ")}
          value={send_query_in}
        />
      ))}
    </Select>
  );

  const SendQueryInQueryParametersInputs = () => (
    <TextArea
      id="query_parameters"
      invalid={
        errors.query_parameters?.type === "required" ||
        errors.query_parameters?.type === "validate"
      }
      invalidText={queryParameterError}
      labelText="Query parameters"
      placeholder="Input query parameters"
      {...register("query_parameters", {
        required: true,
        validate: value => {
          if (!value) return true;

          try {
            JSON.parse(value);
            return true;
          } catch (e) {
            if (e instanceof Error) {
              setQueryParameterError(e.message);
            } else {
              setQueryParameterError(
                "An unexpected error occured during JSON parsing.",
              );
            }

            return false;
          }
        },
      })}
    />
  );

  const SendQueryInBodyInputs = () => (
    <TextArea
      id="request_body"
      invalid={
        errors.request_body?.type === "required" ||
        errors.request_body?.type === "validate"
      }
      invalidText={requestBodyError}
      labelText="Request body"
      placeholder="Input request body"
      rows={10}
      {...register("request_body", {
        required: true,
        validate: value => {
          if (!value) return true;

          try {
            JSON.parse(value);
            return true;
          } catch (e) {
            if (e instanceof Error) {
              setRequestBodyError(e.message);
            } else {
              setRequestBodyError(
                "An unexpected error occurred during JSON parsing.",
              );
            }

            return false;
          }
        },
      })}
    />
  );

  const FrequencySelect = () => (
    <ControllerNumberInputSchoolConnectivity
      control={control}
      name="ingestion_frequency_minutes"
      numberInputProps={{
        id: "ingestion_frequency_minutes",
        helperText: "In minutes. Min 5",
        label: <span>Frequency</span>,
        min: 5,
      }}
    />
  );

  const IngestionEnabledToggle = () => (
    <Toggle
      id="enabled"
      defaultToggled={true}
      labelText="Whether to retroactively ingest data before the start date"
    />
  );

  // const DateKeyInput = () => (
  //   <TextInput
  //     id="date_key"
  //     invalid={!!errors.date_key}
  //     labelText="OLDDATEKEYDate key"
  //     {...register("date_key")}
  //   />
  // );

  // const DateFormatInput = () => {
  //   const message =
  //     "Can only accept valid python datetime formats e.g.: %Y-%m-%d %H:%M:%S  or timestamp or ISO8601 string constant";
  //   return (
  //     <TextInput
  //       disabled={dateKeyIsEmpty}
  //       helperText={message}
  //       id="date_format"
  //       invalid={!!errors.date_format}
  //       invalidText={message}
  //       labelText="Date Format"
  //       {...register("date_format", {
  //         validate: value => {
  //           // if (value === null) return false;

  //           // if (value === "timestamp" || value === "ISO8601") return true;
  //           // else if (validateDatetimeFormat(value)) return true;
  //           // else return false;
  //           console.log("HEllo world");
  //           console.log(value);
  //           if (value === null || value === "")
  //             if (dateKey === null || dateKey === "") return true;
  //             else {
  //               return false;
  //             }
  //         },
  //       })}
  //     />
  //   );
  // };

  // const SendDateInSelect = () => (
  //   <Select
  //     id="send_date_in"
  //     disabled={dateKeyIsEmpty}
  //     invalid={!!errors.page_send_query_in}
  //     labelText="Send date in"
  //     {...register("send_date_in", { required: true })}
  //   >
  //     {Object.keys(SendQueryInEnum)
  //       .filter(val => val !== SendQueryInEnum.NONE)
  //       .map(send_query_in => (
  //         <SelectItem
  //           key={send_query_in}
  //           text={send_query_in.replace(/_/g, " ")}
  //           value={send_query_in}
  //         />
  //       ))}
  //   </Select>
  // );
  // const ResponseDateKeyInput = () => (
  //   <TextInput
  //     id="response_date_key"
  //     invalid={!!errors.response_date_key}
  //     invalidText="Required"
  //     labelText="Response date key"
  //     {...register("response_date_key", { required: true })}
  //   />
  // );
  // const ResponseDateFormatInput = () => (
  //   <TextInput
  //     id="response_date_format"
  //     invalid={!!errors.response_date_format}
  //     invalidText="Required"
  //     labelText="Response date format"
  //     {...register("response_date_format", { required: true })}
  //   />
  // );

  return (
    <>
      <section className="flex flex-col gap-6">
        <header className="text-2xl">Ingestion Details</header>
        <SchoolIdKeyTextInput />
      </section>
      <section className="flex flex-col gap-6">
        <header className="text-2xl">Ingestion Source</header>
        <DataKeyTextInput />
        <RequestMethodSelect />
        <ApiEndpointTextInput />
        <AuthTypeSelect />
        {watchAuthType === API_KEY && <AuthApiKeyInputs />}
        {watchAuthType === BASIC_AUTH && <AuthBasicInputs />}
        {watchAuthType === BEARER_TOKEN && <AuthBearerInputs />}
        <SendQueryInQueryParametersInputs />
        {watchRequestMethod === POST && <SendQueryInBodyInputs />}
      </section>
      <section className="flex flex-col gap-6">
        <header className="text-2xl">Ingestion Parameters</header>
        <PaginationTypeSelect />
        {watchPaginationType === PAGE_NUMBER && <PaginationPageNumberInputs />}
        {watchPaginationType === LIMIT_OFFSET && (
          <PaginationLimitOffsetInputs />
        )}
        <PageSendQueryInSelect />
        <SchoolIdSendQueryInSelect />
        <FrequencySelect />
        {hasFileUpload && (
          <>
            <header className="text-lg">CSV Schema</header>

            <UploadFile
              acceptType={{
                "text/csv": [".csv"],
              }}
              description="CSV only"
              file={file}
              setFile={file => setFile(file)}
            />
          </>
        )}
        <IngestionEnabledToggle />
      </section>
    </>
  );
}

export default SchoolConnectivityFormInputs;
