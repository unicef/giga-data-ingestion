import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Section,
  Select,
  SelectItem,
  Tag,
  TextArea,
  TextInput,
  Toggle,
} from "@carbon/react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import ConfirmAddIngestionModal from "@/components/ingest-api/ConfirmAddIngestionModal";
import TestApiButton from "@/components/ingest-api/TestApiButton";
import ControllerNumberInputSchoolConnectivity from "@/components/upload/ControllerNumberInputSchoolConnectivity";
import UploadFile from "@/components/upload/UploadFile.tsx";
import { useQosStore } from "@/context/qosStore";
import {
  PaginationTypeEnum,
  SchoolConnectivityFormValues,
  SendQueryInEnum,
} from "@/types/qos";
import { AuthorizationTypeEnum, RequestMethodEnum } from "@/types/qos";

export const Route = createFileRoute("/ingest-api/add/school-connectivity")({
  component: SchoolConnectivity,
  loader: () => {
    const { api_endpoint } = useQosStore.getState().schoolList;
    if (api_endpoint === "") throw redirect({ to: ".." });
  },
});

const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
const { POST } = RequestMethodEnum;

function SchoolConnectivity() {
  const [responsePreview, setResponsePreview] = useState<string | string[]>("");
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidDatakey, setIsValidDatakey] = useState<boolean>(false);
  const [isResponseError, setIsResponseError] = useState<boolean>(false);

  const {
    decrementStepIndex,
    resetSchoolConnectivityFormValues,
    setSchoolConnectivityFormValues,
    setFile,
  } = useQosStore();

  const { file } = useQosStore.getState();

  const hasUploadedFile = file != null;

  const [open, setOpen] = useState<boolean>(false);

  const {
    control,
    formState,
    getValues,
    handleSubmit,
    register,
    resetField,
    watch,
    trigger,
  } = useForm<SchoolConnectivityFormValues>({
    defaultValues: {
      api_auth_api_key: null,
      api_auth_api_value: null,
      authorization_type: AuthorizationTypeEnum.NONE,
      basic_auth_password: null,
      basic_auth_username: null,
      bearer_auth_bearer_token: null,
      enabled: false,
      page_number_key: null,
      page_offset_key: null,
      page_size_key: null,
      page_starts_with: null,
      pagination_type: PaginationTypeEnum.NONE,
      request_body: "",
      request_method: RequestMethodEnum.GET,
      query_parameters: "",
      send_query_in: SendQueryInEnum.NONE,
      size: null,
      status: true,
      user_email: schoolList.user_email,
      user_id: schoolList.user_id,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { errors } = formState;
  const watchAuthType = watch("authorization_type");
  const watchPaginationType = watch("pagination_type");
  const watchSendQueryIn = watch("send_query_in");
  const watchRequestMethod = watch("request_method");

  const hasError = Object.keys(errors).length > 0;
  const authorizationType = getValues("authorization_type");
  const queryParams = getValues("query_parameters");
  const requestBody = getValues("request_body");
  const requestMethod = getValues("request_method");
  const dataKey = getValues("data_key");
  const apiKeyName = getValues("api_auth_api_key");
  const apiKeyValue = getValues("api_auth_api_value");
  const basicAuthUserName = getValues("basic_auth_username");
  const basicAuthPassword = getValues("basic_auth_password");
  const apiEndpoint = getValues("api_endpoint");
  const bearerAuthBearerToken = getValues("bearer_auth_bearer_token");

  useEffect(() => {
    resetField("api_auth_api_key");
    resetField("api_auth_api_value");
    resetField("basic_auth_username");
    resetField("basic_auth_password");
    resetField("bearer_auth_bearer_token");
  }, [watchAuthType, resetField]);

  useEffect(() => {
    resetField("page_number_key");
    resetField("page_offset_key");
    resetField("page_starts_with");
    resetField("size");
  }, [watchPaginationType, resetField]);

  useEffect(() => {
    resetField("query_parameters");
    resetField("request_body");
  }, [watchSendQueryIn, resetField]);

  const onSubmit: SubmitHandler<SchoolConnectivityFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }
    setSchoolConnectivityFormValues(data);
    setOpen(true);
  };

  const prettyResponse = JSON.stringify(responsePreview, undefined, 4);

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

  const SendQueryInSelect = () => (
    <Select
      id="send_query_in"
      invalid={!!errors.send_query_in}
      labelText="Send query in"
      {...register("send_query_in", { required: true })}
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
            return false;
          }
        },
      })}
    />
  );

  const FrequencySelect = () => (
    <ControllerNumberInputSchoolConnectivity
      control={control}
      name="ingestion_frequency"
      numberInputProps={{
        id: "ingestion_frequency",
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

  const IngestionDetailsSection = () => (
    <section className="flex flex-col gap-6">
      <header className="text-2xl">Ingestion Details</header>
      <SchoolIdKeyTextInput />
    </section>
  );

  const IngestionSourceSection = () => (
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
  );

  const IngestionParametersSection = () => (
    <section className="flex flex-col gap-6">
      <header className="text-2xl">Ingestion Parameters</header>

      <PaginationTypeSelect />
      {watchPaginationType === PAGE_NUMBER && <PaginationPageNumberInputs />}
      {watchPaginationType === LIMIT_OFFSET && <PaginationLimitOffsetInputs />}
      <SendQueryInSelect />
      <FrequencySelect />

      <header className="text-lg">CSV Schema</header>
      <UploadFile
        acceptType={{
          "text/csv": [".csv"],
        }}
        description="CSV only"
        file={file}
        setFile={file => setFile(file)}
      />

      <IngestionEnabledToggle />
    </section>
  );

  return (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 3: Configure school connectivity API
        </p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex w-full space-x-10 ">
          <section className="flex w-full flex-col gap-4">
            <IngestionDetailsSection />
            <IngestionSourceSection />
            <IngestionParametersSection />
            <ButtonSet className="w-full">
              <Button
                as={Link}
                className="w-full"
                isExpressive
                kind="secondary"
                renderIcon={ArrowLeft}
                to="/ingest-api/add/column-mapping"
                onClick={() => {
                  decrementStepIndex();
                  resetSchoolConnectivityFormValues();
                }}
              >
                Cancel
              </Button>
              <Button
                className="w-full"
                disabled={
                  !isValidResponse ||
                  !isValidDatakey ||
                  isResponseError ||
                  !hasUploadedFile
                }
                isExpressive
                renderIcon={ArrowRight}
                type="submit"
              >
                Proceed
              </Button>
            </ButtonSet>
          </section>
          <aside className="flex w-full flex-col ">
            <div className="grow basis-0 overflow-y-auto">
              {isResponseError && (
                <Tag type="red">Invalid Output from api request</Tag>
              )}
              {responsePreview === "invalid" && (
                <Tag type="blue">Invalid Datakey</Tag>
              )}
              <SyntaxHighlighter
                customStyle={{ height: "100%" }}
                language="json"
                style={docco}
              >
                {responsePreview === "" ? "Preview" : prettyResponse}
              </SyntaxHighlighter>
            </div>
          </aside>
        </div>
      </form>
      <ConfirmAddIngestionModal open={open} setOpen={setOpen} />
    </Section>
  );
}
