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
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import { Select } from "@/components/forms/Select";
import ControllerNumberInputSchoolList from "@/components/upload/ControllerNumberInputSchoolList";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView";
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
  // loader: ({ params: { ingestionId } }) => {
  //   const schoolListQueryOptions = queryOptions({
  //     queryKey: ["ingestion", ingestionId],
  //     queryFn: () => api.qos.get_school_list(ingestionId),
  //   });

  //   return queryClient.ensureQueryData(schoolListQueryOptions);
  // },
});

const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
const { BODY, QUERY_PARAMETERS } = SendQueryInEnum;

function EditIngestion() {
  const { resetQosState } = useQosStore();

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
  });

  const watchAuthType = watch("authType");
  const watchPaginationType = watch("paginationType");
  const watchSendQueryIn = watch("sendQueryIn");

  useEffect(() => {
    resetField("apiAuthApiKey");
    resetField("apiAuthApiValue");
    resetField("basicAuthUsername");
    resetField("basicAuthPassword");
    resetField("bearerAuthBearerToken");
  }, [watchAuthType, resetField]);

  useEffect(() => {
    resetField("pageNumberKey");
    resetField("pageOffsetKey");
    resetField("pageStartsWith");
    resetField("size");
  }, [watchPaginationType, resetField]);

  useEffect(() => {
    resetField("queryParamters");
    resetField("requestBody");
  }, [watchSendQueryIn, resetField]);

  // const {
  //   data: { data: initialValues },
  // } = useSuspenseQuery({
  //   queryKey: ["ingestion", ingestionId],
  //   queryFn: () => api.qos.get_school_list(ingestionId),
  // });

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

  const onSubmit: SubmitHandler<SchoolListFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      console.log("Form has errors, not submitting");
      return;
    }

    console.log(data);

    // setSchoolListFormValues(data);
    // incrementStepIndex();
    // void navigate({ to: "./column-mapping" });
  };

  // if (isUsersLoading) return <IngestFormSkeleton />;

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
      id="userId"
      disabled={isUsersRefetching}
      helperText="Who will be the designated point person responsible for this ingestion?"
      invalid={!!errors.userId}
      labelText="Owner"
      {...register("userId", { required: true })}
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
      id="requestMethod"
      invalid={!!errors.requestMethod}
      labelText="Request Method"
      {...register("requestMethod", { required: true })}
    >
      <SelectItem value="" text="" />
      {Object.keys(RequestMethodEnum).map(requestMethod => (
        <SelectItem
          key={requestMethod}
          value={requestMethod}
          text={requestMethod}
        />
      ))}
    </Select>
  );

  const ApiEndpointTextinput = () => (
    <div className="flex items-end">
      <TextInput
        id="apiEndpoint"
        invalid={!!errors.apiEndpoint}
        labelText="API Endpoint"
        placeholder="https://example.com/api/ingest"
        {...register("apiEndpoint", { required: true })}
      />
      <div className="bottom-px">
        <Button size="md">Test</Button>
      </div>
    </div>
  );

  const AuthTypeSelect = () => (
    <Select
      id="authType"
      invalid={!!errors.authType}
      labelText="Authentication Method"
      {...register("authType", { required: true })}
    >
      <SelectItem value="" text="" />
      {Object.keys(AuthorizationTypeEnum).map(authType => (
        <SelectItem
          key={authType}
          text={authType.replace(/_/g, " ")}
          value={authType}
        />
      ))}
    </Select>
  );

  const AuthApiKeyInputs = () => (
    <>
      <TextInput
        id="apiAuthApiKey"
        invalid={!!errors.apiAuthApiKey}
        labelText="api response key"
        placeholder="Input Authentication Credentials"
        {...register("apiAuthApiKey", { required: true })}
      />
      {/*
                  //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
      <TextInput.PasswordInput
        id="apiAuthApiValue"
        invalid={!!errors.apiAuthApiValue}
        labelText="Authentication Credentials"
        placeholder="Input Authentication Credentials"
        {...register("apiAuthApiValue", { required: true })}
      />
    </>
  );

  const AuthBasicInputs = () => (
    <>
      <TextInput
        id="basicAuthUsername"
        invalid={!!errors.basicAuthUsername}
        labelText="api response key"
        placeholder="Input Authentication Credentials"
        {...register("basicAuthUsername", { required: true })}
      />
      {/*
                  //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
      <TextInput.PasswordInput
        id="basicAuthPassword"
        invalid={!!errors.basicAuthPassword}
        labelText="Authentication Credentials"
        placeholder="Input Authentication Credentials"
        {...register("basicAuthPassword", { required: true })}
      />
    </>
  );

  const AuthBearerInputs = () => (
    <>
      {/*
                  //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
      <TextInput.PasswordInput
        id="bearerAuthBearerToken"
        invalid={!!errors.bearerAuthBearerToken}
        labelText="Authentication Credentials"
        placeholder="Input Authentication Credentials"
        {...register("bearerAuthBearerToken", {
          required: true,
        })}
      />
    </>
  );

  const PaginationTypeSelect = () => (
    <Select
      id="paginationType"
      invalid={!!errors.paginationType}
      labelText="Pagination Method"
      {...register("paginationType", { required: true })}
    >
      {Object.keys(PaginationTypeEnum).map(paginationType => (
        <SelectItem
          key={paginationType}
          text={paginationType.replace(/_/g, " ")}
          value={paginationType}
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
        id="pageSizeKey"
        invalid={!!errors.pageSizeKey}
        labelText="Page size key"
        placeholder="Input page size key"
        {...register("pageSizeKey", { required: true })}
      />
      <TextInput
        id="pageOffsetKey"
        invalid={!!errors.pageOffsetKey}
        labelText="Page Offset key"
        placeholder="Input Page Offset key"
        {...register("pageOffsetKey", { required: true })}
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
        id="pageSizeKey"
        invalid={!!errors.pageSizeKey}
        labelText="Page size key"
        placeholder="Input page size key"
        {...register("pageSizeKey", { required: true })}
      />
      <TextInput
        id="pageNumberKey"
        invalid={!!errors.pageNumberKey}
        labelText="Page number key"
        placeholder="Input page number key"
        {...register("pageNumberKey", { required: true })}
      />

      <Select
        id="pageStartsWith"
        invalid={!!errors.pageStartsWith}
        labelText="Page Starts with"
        {...register("pageStartsWith", { required: true })}
      >
        <SelectItem key="0" text="0" value={0} />
        <SelectItem key="1" text="1" value={1} />
      </Select>
    </>
  );

  const SendQueryInSelect = () => (
    <Select
      id="sendQueryIn"
      invalid={!!errors.sendQueryIn}
      labelText="Send query in"
      {...register("sendQueryIn", { required: true })}
    >
      {Object.keys(SendQueryInEnum).map(sendQueryIn => (
        <SelectItem
          key={sendQueryIn}
          text={sendQueryIn.replace(/_/g, " ")}
          value={sendQueryIn}
        />
      ))}
    </Select>
  );

  const SendQueryInQueryParametersInputs = () => (
    <TextArea
      id="queryParamters"
      invalid={!!errors.queryParamters}
      labelText="Query parameters"
      placeholder="Input query parameters"
      {...register("queryParamters", { required: true })}
    />
  );

  const SendQueryInBodyInputs = () => (
    <TextArea
      id="requestBody"
      invalid={!!errors.requestBody}
      labelText="Request body"
      placeholder="Input request body"
      {...register("requestBody", { required: true })}
    />
  );

  return (
    <AuthenticatedRBACView roles={["Admin", "Super"]}>
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
    </AuthenticatedRBACView>
  );
}

export default EditIngestion;
