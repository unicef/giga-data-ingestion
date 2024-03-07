import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Section,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
} from "@carbon/react";
import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { api, queryClient } from "@/api";
import { Select } from "@/components/forms/Select";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import ControllerNumberInputSchoolList from "@/components/upload/ControllerNumberInputSchoolList";
import { useQosStore } from "@/context/qosStore";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SchoolListFormValues,
  SendQueryInEnum,
} from "@/types/qos";

export const Route = createFileRoute("/ingest-api/edit/$ingestionId/")({
  component: EditIngestion,
  loader: async ({ params: { ingestionId } }) => {
    const options = queryOptions({
      queryKey: ["ingestion", ingestionId],
      queryFn: () => api.qos.get_school_list(ingestionId),
    });

    return await queryClient.ensureQueryData(options);
  },
  errorComponent: IngestFormSkeleton,
  pendingComponent: IngestFormSkeleton,
});

const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
const { BODY, QUERY_PARAMETERS } = SendQueryInEnum;

function EditIngestion() {
  const { resetQosState, setSchoolListFormValues, incrementStepIndex } =
    useQosStore();

  const { ingestionId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    data: { data: schoolListQuery },
    isError,
    isRefetching: isSchoolListRefetching,
  } = useSuspenseQuery({
    queryKey: ["ingestion", ingestionId],
    queryFn: () => api.qos.get_school_list(ingestionId),
  });

  const {
    data: usersQuery,
    // isLoading: isUsersLoading,
    // refetch: refetchUsers,
    isRefetching: isUsersRefetching,
  } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
  });

  const users = usersQuery?.data ?? [];

  const {
    handleSubmit,
    register,
    resetField,
    watch,
    control,
    formState: { errors },
  } = useForm<SchoolListFormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: schoolListQuery.name,
      api_auth_api_key: schoolListQuery.api_auth_api_key,
      api_auth_api_value: schoolListQuery.api_auth_api_value,
      api_endpoint: schoolListQuery.api_endpoint,
      authorization_type: schoolListQuery.authorization_type,
      basic_auth_password: schoolListQuery.basic_auth_password,
      basic_auth_username: schoolListQuery.basic_auth_username,
      bearer_auth_bearer_token: schoolListQuery.bearer_auth_bearer_token,
      page_number_key: schoolListQuery.page_number_key,
      page_offset_key: schoolListQuery.page_offset_key,
      page_size_key: schoolListQuery.page_size_key,
      page_starts_with: schoolListQuery.page_starts_with,
      pagination_type: schoolListQuery.pagination_type,
      query_parameters: schoolListQuery.query_parameters,
      request_body: schoolListQuery.request_body,
      request_method: schoolListQuery.request_method,
      data_key: schoolListQuery.data_key,
      school_id_key: schoolListQuery.school_id_key,
      send_query_in: schoolListQuery.send_query_in,
      size: schoolListQuery.size,
      user_email: schoolListQuery.user_email,
      user_id: schoolListQuery.user_id,
    },
  });

  const watchAuthType = watch("authorization_type");
  const watchPaginationType = watch("pagination_type");
  const watchSendQueryIn = watch("send_query_in");

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

  const onSubmit: SubmitHandler<SchoolListFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }

    console.log(data);

    setSchoolListFormValues(data);
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
      id="user_id"
      disabled={isUsersRefetching || isSchoolListRefetching}
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
      <SelectItem value="" text="" />
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
        <Button size="md">Test</Button>
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
      <SelectItem value="" text="" />
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
      invalid={!!errors.query_parameters}
      labelText="Query parameters"
      placeholder="Input query parameters"
      {...register("query_parameters", { required: true })}
    />
  );

  const SendQueryInBodyInputs = () => (
    <TextArea
      id="request_body"
      invalid={!!errors.request_body}
      labelText="Request body"
      placeholder="Input request body"
      {...register("request_body", { required: true })}
    />
  );

  const DataKeyTextInput = () => (
    <TextInput
      id="data_key"
      helperText="The key in the JSON response that will contain the data to be ingested"
      invalid={!!errors.data_key}
      labelText="Data key"
      {...register("data_key", { required: true })}
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

  if (isError) return <IngestFormSkeleton />;

  return (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 1: Configure school listing API
        </p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack className="w-full" orientation="horizontal">
          <section className="flex flex-col gap-4">
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
              {watchSendQueryIn === QUERY_PARAMETERS && (
                <SendQueryInQueryParametersInputs />
              )}
              {watchSendQueryIn === BODY && <SendQueryInBodyInputs />}

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
                  isExpressive
                  renderIcon={ArrowRight}
                  type="submit"
                >
                  Proceed
                </Button>
              </ButtonSet>
            </section>
          </section>
          <aside className="flex h-full">
            <TextArea disabled labelText="Preview" rows={40} />
          </aside>
        </Stack>
      </form>
      <Outlet />
    </Section>
  );
}

export default EditIngestion;
