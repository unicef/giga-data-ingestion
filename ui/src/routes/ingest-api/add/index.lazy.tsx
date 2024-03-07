import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Section,
  SelectItem,
  Tag,
  TextArea,
  TextInput,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { api } from "@/api";
import { Select } from "@/components/forms/Select";
import TestSchoolListApiButton from "@/components/ingest-api/TestSchoolListApiButton";
import ControllerNumberInputSchoolList from "@/components/upload/ControllerNumberInputSchoolList";
import { useQosStore } from "@/context/qosStore";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SchoolListFormValues,
  SendQueryInEnum,
} from "@/types/qos";

export const Route = createFileRoute("/ingest-api/add/")({
  component: AddIngestion,
});

function AddIngestion() {
  const [responsePreview, setResponsePreview] = useState<string | string[]>("");
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidDatakey, setIsValidDatakey] = useState<boolean>(false);
  const [isResponseError, setIsResponseError] = useState<boolean>(false);
  const { setSchoolListFormValues, incrementStepIndex, resetQosState } =
    useQosStore();

  const navigate = useNavigate({ from: Route.fullPath });

  const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
  const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
  const { GET, POST } = RequestMethodEnum;

  const {
    handleSubmit,
    register,
    resetField,
    getValues,
    watch,
    control,
    trigger,
    formState,
  } = useForm<SchoolListFormValues>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "someName", // remove this after dev
      request_method: RequestMethodEnum.GET,
      // authorization_type: AuthorizationTypeEnum.NONE,
      authorization_type: AuthorizationTypeEnum.BEARER_TOKEN, // remove this after dev

      pagination_type: PaginationTypeEnum.NONE,
      send_query_in: SendQueryInEnum.QUERY_PARAMETERS,
      api_endpoint:
        "https://uni-connect-services-dev.azurewebsites.net/api/v1/schools/country/32", // remove this after dev
      page_number_key: null,
      page_offset_key: null,
      page_size_key: "",
      page_starts_with: null,
      api_auth_api_key: null,
      api_auth_api_value: null,
      basic_auth_username: null,
      basic_auth_password: null,
      bearer_auth_bearer_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImRhaWx5Y2hlY2thcHAiLCJpYXQiOjE1MTYyMzkwMjJ9.9lHxUZ0XmSc-5ddqEEKFt2Opx2CC-gSsRTGSCI-KcQU",
      size: null,
      query_parameters: null,
      request_body: null,
    },
  });

  const { errors } = formState;
  const watchAuthType = watch("authorization_type");
  const watchPaginationType = watch("pagination_type");
  const watchRequestMethod = watch("request_method");

  useEffect(() => {
    resetField("api_auth_api_key");
    resetField("api_auth_api_value");
    resetField("basic_auth_username");
    resetField("basic_auth_password");
    resetField("bearer_auth_bearer_token");

    setResponsePreview("");
    setIsValidResponse(false);
    setIsValidDatakey(false);
    setIsResponseError(false);
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
  }, [watchRequestMethod, resetField]);

  const { data: usersQuery, isRefetching: isUsersRefetching } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
  });

  const users = usersQuery?.data ?? [];

  const onSubmit: SubmitHandler<SchoolListFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }

    const user = users.find(user => user.id === data.user_id);
    const dataWithUserEmail = { ...data, user_email: user?.mail ?? "" };

    setSchoolListFormValues(dataWithUserEmail);
    incrementStepIndex();
    void navigate({ to: "./column-mapping" });
  };

  const NameTextInput = () => (
    <TextInput
      id="name"
      invalid={!!errors.name}
      labelText="Name"
      placeholder="How would you like to indentify your ingestion?"
      {...register("name", { required: true })}
    />
  );

  const UserSelect = () => (
    <Select
      //key ref

      id="user_id"
      disabled={isUsersRefetching}
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

  const ApiEndpointTextinput = () => (
    <div className="flex items-end">
      <TextInput
        id="api_endpoint"
        invalid={!!errors.api_endpoint}
        labelText="API Endpoint"
        placeholder="https://example.com/api/ingest"
        {...register("api_endpoint", { required: true })}
      />
      <div className="bottom-px">
        <TestSchoolListApiButton
          setIsValidDatakey={setIsValidDatakey}
          setIsValidResponse={setIsValidResponse}
          setIsResponseError={setIsResponseError}
          formState={formState}
          getValues={getValues}
          setResponsePreview={setResponsePreview}
          trigger={trigger}
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
      // warn={errors.query_parameters?.type === "validate"}
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
      helperText="The key in the JSON response that will contain the data to be ingested"
      invalid={!!errors.school_id_key}
      labelText="School ID key"
      {...register("school_id_key", { required: true })}
    />
  );

  const prettyResponse = JSON.stringify(responsePreview, undefined, 4);

  // if (isUsersLoading) return <IngestFormSkeleton />;

  return (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 1: Configure school listing API
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex w-full space-x-10 ">
          <section className="flex w-full flex-col gap-4 ">
            <section className="flex flex-col gap-6">
              <NameTextInput />
              <DataKeyTextInput />
              <SchoolIdKeyTextInput />
            </section>

            <header className="text-2xl">Ingestion Details</header>
            <UserSelect />

            <section className="flex flex-col gap-6">
              <header className="text-2xl">Ingestion Source</header>
              <RequestMethodSelect />
              <ApiEndpointTextinput />
              <AuthTypeSelect />

              {watchAuthType === API_KEY && <AuthApiKeyInputs />}
              {watchAuthType === BASIC_AUTH && <AuthBasicInputs />}
              {watchAuthType === BEARER_TOKEN && <AuthBearerInputs />}

              {watchRequestMethod === GET && (
                <SendQueryInQueryParametersInputs />
              )}
              {watchRequestMethod === POST && <SendQueryInBodyInputs />}
            </section>

            <section className="flex flex-col gap-6">
              <header className="text-2xl">Ingestion Parameters</header>
              <PaginationTypeSelect />
              {watchPaginationType === LIMIT_OFFSET && (
                <PaginationLimitOffsetInputs />
              )}
              {watchPaginationType === PAGE_NUMBER && (
                <PaginationPageNumberInputs />
              )}

              <SendQueryInSelect />

              <ButtonSet className="w-full">
                <Button
                  as={Link}
                  className="w-full"
                  isExpressive
                  kind="secondary"
                  renderIcon={ArrowLeft}
                  to="/ingest-api"
                  onClick={resetQosState}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full"
                  disabled={
                    !isValidResponse || !isValidDatakey || isResponseError
                  }
                  isExpressive
                  renderIcon={ArrowRight}
                  type="submit"
                >
                  Proceed
                </Button>
              </ButtonSet>
            </section>
          </section>
          <div className="flex  w-full flex-col">
            <aside className="grow basis-0 overflow-y-auto">
              {isResponseError && (
                <Tag type="red">Invalid Output from api request</Tag>
              )}
              {isValidResponse && !isValidDatakey && (
                <Tag type="blue">Invalid Datakey</Tag>
              )}
              <SyntaxHighlighter
                customStyle={{ height: "100%" }}
                language="json"
                style={docco}
              >
                {responsePreview === ""
                  ? "Preview"
                  : isValidResponse
                    ? prettyResponse
                    : "Invalid Response"}
              </SyntaxHighlighter>
            </aside>
          </div>
        </div>
      </form>
      <Outlet />
    </Section>
  );
}
