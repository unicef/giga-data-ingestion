import { Dispatch, SetStateAction, useState } from "react";
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";

import { SelectItem, TextArea, TextInput } from "@carbon/react";

import { Select } from "@/components/forms/Select";
import TestApiButton from "@/components/ingest-api/TestApiButton";
import ControllerNumberInputSchoolList from "@/components/upload/ControllerNumberInputSchoolList";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SchoolListFormValues,
  SendQueryInEnum,
} from "@/types/qos";
import { GraphUser } from "@/types/user";

interface ErrorStates {
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDatakey: Dispatch<SetStateAction<boolean>>;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
}

interface FetchingStates {
  isUsersRefetching: boolean;
  isUsersFetching: boolean;
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
  control: Control<SchoolListFormValues>;
  errors: FieldErrors<SchoolListFormValues>;
  register: UseFormRegister<SchoolListFormValues>;
  trigger: UseFormTrigger<SchoolListFormValues>;
}

interface SchoolListFormInputsProps {
  errorStates: ErrorStates;
  fetchingStates: FetchingStates;
  gettedFormValues: GetValuesProps;
  hasError: boolean;
  users: GraphUser[];
  watchAuthType: AuthorizationTypeEnum;
  watchPaginationType: PaginationTypeEnum;
  watchRequestMethod: RequestMethodEnum;
  useFormHookReturnValues: UseFormHookReturnValues;
}

const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
const { POST } = RequestMethodEnum;

export function SchoolListFormInputs({
  errorStates,
  fetchingStates,
  gettedFormValues,
  hasError,
  users,
  watchAuthType,
  watchPaginationType,
  watchRequestMethod,
  useFormHookReturnValues,
}: SchoolListFormInputsProps) {
  const [queryParameterError, setQueryParameterError] = useState<string>("");
  const [requestBodyError, setRequestBodyError] = useState<string>("");

  const {
    setIsResponseError,
    setIsValidDatakey,
    setIsValidResponse,
    setResponsePreview,
  } = errorStates;

  const { isUsersFetching, isUsersRefetching } = fetchingStates;

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

  const NameTextInput = () => (
    <TextInput
      id="name"
      invalid={!!errors.name}
      labelText="Name"
      placeholder="How would you like to indentify your ingestion?"
      {...register("name", { required: true })}
    />
  );

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

  const UserSelect = () => (
    <Select
      id="user_id"
      disabled={isUsersRefetching || isUsersFetching}
      helperText="Who will be the designated point person responsible for this ingestion?"
      invalid={!!errors.user_id}
      labelText="Owner"
      {...register("user_id", { required: true })}
    >
      <SelectItem value="" text="" />
      {users.map(user => (
        <SelectItem
          key={user.id}
          text={user.display_name ?? ""}
          value={user.id}
        />
      ))}
    </Select>
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

  const ApiEndpointTextinput = () => {
    return (
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
  };
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
      <ControllerNumberInputSchoolList
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
      <ControllerNumberInputSchoolList
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
      id="school_id_send_query_in"
      invalid={!!errors.school_id_send_query_in}
      labelText="School ID send query in"
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
                "An unexpected error occurred during JSON parsing.",
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

  const IngestionDetailsSection = () => (
    <section className="flex flex-col gap-6">
      <header className="text-2xl">Ingestion Details</header>
      <NameTextInput />
      <UserSelect />
      <SchoolIdKeyTextInput />
    </section>
  );

  const IngestionSourceSection = () => (
    <section className="flex flex-col gap-6">
      <header className="text-2xl">Ingestion Source</header>
      <DataKeyTextInput />
      <RequestMethodSelect />
      <ApiEndpointTextinput />
      <AuthTypeSelect />
      {watchAuthType === API_KEY && <AuthApiKeyInputs />}
      {watchAuthType === BASIC_AUTH && <AuthBasicInputs />}
      {watchAuthType === BEARER_TOKEN && <AuthBearerInputs />}
      <SendQueryInQueryParametersInputs />
      {watchRequestMethod === POST && <SendQueryInBodyInputs />}
    </section>
  );

  const IngestionParametersSection = () => (
    <section className="flex flex-col gap-6">
      <header className="text-2xl">Ingestion Parameters</header>
      <PaginationTypeSelect />
      {watchPaginationType === PAGE_NUMBER && <PaginationPageNumberInputs />}
      {watchPaginationType === LIMIT_OFFSET && <PaginationLimitOffsetInputs />}
      <PageSendQueryInSelect />
      <SchoolIdSendQueryInSelect />
    </section>
  );

  return (
    <>
      <IngestionDetailsSection />
      <IngestionSourceSection />
      <IngestionParametersSection />
    </>
  );
}

export default SchoolListFormInputs;
