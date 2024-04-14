import { Dispatch, SetStateAction } from "react";
import {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetError,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";

import { SelectItem, TextArea, TextInput, Toggle } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";

import { api } from "@/api";
import { Select } from "@/components/forms/Select";
import UploadFile from "@/components/upload/UploadFile.tsx";
import { useStore } from "@/context/store";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SchoolConnectivityFormValues,
  SendQueryInEnum,
} from "@/types/qos";
import { validateDatetimeFormat } from "@/utils/string";

import ControllerNumberInputSchoolConnectivity from "../upload/ControllerNumberInputSchoolConnectivity";
import TestApiButton from "./school-connectivity/TestApiButton";

interface ErrorStates {
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDataKey: Dispatch<SetStateAction<boolean>>;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
  setIsValidResponseDateFormat: Dispatch<SetStateAction<boolean>>;
}

interface SchoolConnectivityFormInputsProps {
  clearErrors: UseFormClearErrors<SchoolConnectivityFormValues>;
  control: Control<SchoolConnectivityFormValues>;
  errors: FieldErrors<SchoolConnectivityFormValues>;
  errorStates: ErrorStates;
  hasFileUpload?: boolean;
  register: UseFormRegister<SchoolConnectivityFormValues>;
  setError: UseFormSetError<SchoolConnectivityFormValues>;
  setValue: UseFormSetValue<SchoolConnectivityFormValues>;
  trigger: UseFormTrigger<SchoolConnectivityFormValues>;
  watch: UseFormWatch<SchoolConnectivityFormValues>;
}

const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
const { POST } = RequestMethodEnum;

export function SchoolConnectivityFormInputs({
  clearErrors,
  control,
  errors,
  errorStates,
  register,
  setError,
  setValue,
  trigger,
  watch,
  hasFileUpload = true,
}: SchoolConnectivityFormInputsProps) {
  const {
    setIsResponseError,
    setIsValidDataKey,
    setIsValidResponse,
    setResponsePreview,
    setIsValidResponseDateFormat,
  } = errorStates;

  const {
    apiIngestionSlice: { file },
    apiIngestionSliceActions: { setFile },
  } = useStore();

  const { mutateAsync: isValidDatetimeFormatCodeRequest } = useMutation({
    mutationKey: ["is_valid_datetime_format_code"],
    mutationFn: api.utils.isValidDateTimeFormatCodeRequest,
  });

  const handleValidateIsValidJson = (value: string | null) => {
    if (!value) return false;

    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      if (e instanceof Error) {
        return e.message;
      } else {
        return "An unexpected error occured during JSON parsing.";
      }
    }
  };

  const handleIsValidDateFormat = (value: string | null) => {
    if (watch("date_key") === "") return true;
    if (!value)
      return 'Can only accept valid python datetime formats e.g.: %Y-%m-%d %H:%M:%S  or "timestamp" or "ISO8601" string constant';

    if (value === "timestamp" || value === "ISO8601") return true;
    else if (validateDatetimeFormat(value)) return true;
    else
      return 'Can only accept valid python datetime formats e.g.: %Y-%m-%d %H:%M:%S  or "timestamp" or "ISO8601" string constant';
  };

  const handleDateKeyOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      clearErrors("date_format");
      setValue("date_format", "");
      setValue("send_date_in", SendQueryInEnum.NONE);
    }

    if (value !== "") {
      if (watch("send_date_in") === SendQueryInEnum.NONE) {
        setValue("send_date_in", SendQueryInEnum.BODY);
      }
    }
  };

  // eslint-disable-next-line
  const handleCustomValidation = async (responseData: any) => {
    const responseDateKeyValue =
      responseData[0][watch("response_date_key") ?? ""];

    const isValid = await isValidDatetimeFormatCodeRequest({
      datetime_str: responseDateKeyValue,
      format_code: watch("response_date_format") ?? "",
    });

    if (isValid.data) {
      setIsValidResponseDateFormat(true);
    } else {
      setIsValidResponseDateFormat(false);
      setError("response_date_format", {
        type: "valueError",
        message: `value in ${watch(
          "response_date_key",
        )} does not match response date format`,
      });
    }
  };

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

  const SendDateInSelect = () => (
    <Select
      id="send_date_in"
      disabled={watch("date_key") === ""}
      invalid={!!errors.send_date_in}
      labelText="Send date in"
      {...register("send_date_in", { required: true })}
    >
      {Object.keys(SendQueryInEnum).map(send_query_in => (
        <SelectItem
          disabled={send_query_in === SendQueryInEnum.NONE}
          key={send_query_in}
          text={send_query_in.replace(/_/g, " ")}
          value={send_query_in}
        />
      ))}
    </Select>
  );

  return (
    <>
      <section className="flex flex-col gap-6">
        <header className="text-2xl">Ingestion Details</header>
        <TextInput
          id="school_id_key"
          invalid={!!errors.school_id_key}
          labelText="School ID key"
          {...register("school_id_key", { required: true })}
        />
      </section>
      <section className="flex flex-col gap-6">
        <header className="text-2xl">Ingestion Source</header>
        <TextInput
          id="data_key"
          helperText="The key in the JSON response that will contain the data to be ingested"
          invalid={!!errors.data_key}
          labelText="Data key"
          {...register("data_key")}
        />
        <RequestMethodSelect />
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
              apiEndpoint={watch("api_endpoint")}
              apiKeyName={watch("api_auth_api_key")}
              apiKeyValue={watch("api_auth_api_value")}
              authorizationType={watch("authorization_type")}
              basicAuthPassword={watch("basic_auth_password")}
              basicAuthUserName={watch("basic_auth_username")}
              bearerAuthBearerToken={watch("bearer_auth_bearer_token")}
              dataKey={watch("data_key")}
              dateFormat={watch("date_format")}
              queryParams={watch("query_parameters")}
              requestBody={watch("request_body")}
              requestMethod={watch("request_method")}
              responseDateFormat={watch("response_date_format")}
              responseDateKey={watch("response_date_key")}
              sendDateIn={watch("send_date_in")}
              setIsResponseError={setIsResponseError}
              setIsValidDatakey={setIsValidDataKey}
              setIsValidResponse={setIsValidResponse}
              setResponsePreview={setResponsePreview}
              handleCustomValidation={handleCustomValidation}
              handleTriggerValidation={() => {
                trigger();
                return Object.keys(errors).length;
              }}
            />
          </div>
        </div>
        <AuthTypeSelect />
        {watch("authorization_type") === API_KEY && (
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
        )}
        {watch("authorization_type") === BASIC_AUTH && (
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
        )}
        {watch("authorization_type") === BEARER_TOKEN && (
          //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder
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
        )}
        <TextArea
          id="query_parameters"
          invalid={
            errors.query_parameters?.type === "required" ||
            errors.query_parameters?.type === "isValidJson"
          }
          invalidText={
            errors.query_parameters?.type === "required"
              ? 'Use empty object "{}" for empty query parameters'
              : errors.query_parameters?.message
          }
          labelText="Query parameters"
          placeholder="Input query parameters"
          {...register("query_parameters", {
            required: true,
            validate: {
              isValidJson: handleValidateIsValidJson,
            },
          })}
        />

        {watch("request_method") === POST && (
          <TextArea
            id="request_body"
            invalid={
              errors.request_body?.type === "required" ||
              errors.request_body?.type === "isValidJson"
            }
            invalidText={
              errors.request_body?.type === "required"
                ? "Required"
                : errors.request_body?.message
            }
            labelText="Request body"
            placeholder="Input request body"
            rows={10}
            {...register("request_body", {
              required: true,
              validate: {
                isValidJson: handleValidateIsValidJson,
              },
            })}
          />
        )}
      </section>
      <section className="flex flex-col gap-6">
        <header className="text-2xl">Ingestion Parameters</header>
        <PaginationTypeSelect />
        {watch("pagination_type") === PAGE_NUMBER && (
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
        )}
        {watch("pagination_type") === LIMIT_OFFSET && (
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
        )}
        <PageSendQueryInSelect />
        <SchoolIdSendQueryInSelect />
        <TextInput
          id="date_key"
          invalid={!!errors.date_key}
          labelText="Date key"
          {...register("date_key", {
            onChange: handleDateKeyOnChange,
          })}
        />
        <TextInput
          disabled={watch("date_key") === ""}
          helperText={
            "Can only accept valid python datetime formats e.g.: %Y-%m-%d %H:%M:%S  or timestamp or ISO8601 string constant"
          }
          id="date_format"
          invalid={!!errors.date_format}
          invalidText={errors.date_format?.message}
          labelText="Date Format"
          {...register("date_format", {
            validate: {
              isValidDateFormat: handleIsValidDateFormat,
            },
          })}
        />
        {watch("date_key") !== "" && <SendDateInSelect />}
        <TextInput
          id="response_date_key"
          invalid={!!errors.response_date_key}
          invalidText={
            errors.request_body?.type === "valueError"
              ? 'Use empty object "{}" for empty request body parameters'
              : errors.request_body?.message
          }
          labelText="Response date key"
          {...register("response_date_key", { required: true })}
        />
        <TextInput
          id="response_date_format"
          invalid={!!errors.response_date_format}
          invalidText={
            errors.response_date_format?.type === "valueError"
              ? errors.request_body?.message
              : "Required"
          }
          labelText="Response date format"
          {...register("response_date_format", { required: true })}
        />
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
