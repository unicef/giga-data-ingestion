import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Select,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
  Toggle,
} from "@carbon/react";
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";

import ControllerNumberInputSchoolConnectivity from "@/components/upload/ControllerNumberInputSchoolConnectivity";
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
    return;
    const { apiEndpoint } = useQosStore.getState().schoolList;
    if (apiEndpoint === "") throw redirect({ to: ".." });
  },
});

function SchoolConnectivity() {
  const { decrementStepIndex, resetSchoolConnectivityFormValues } =
    useQosStore();

  const {
    handleSubmit,
    register,
    control,
    resetField,
    watch,
    formState: { errors },
  } = useForm<SchoolConnectivityFormValues>({
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

  const onSubmit: SubmitHandler<SchoolConnectivityFormValues> = async data => {
    console.log(data);
  };

  const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
  const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
  const { BODY, QUERY_PARAMETERS } = SendQueryInEnum;

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

  const ApiEndpointTextInput = () => (
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
        autoComplete="on"
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
        autoComplete="on"
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
        autoComplete="on"
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

  const DataKeyTextInput = () => (
    <TextInput
      id="dataKey"
      helperText="The key in the JSON response that will contain the data to be ingested"
      invalid={!!errors.dataKey}
      labelText="Data key"
      {...register("dataKey", { required: true })}
    />
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

  const FrequencySelect = () => (
    <ControllerNumberInputSchoolConnectivity
      control={control}
      name="ingestionFrequency"
      numberInputProps={{
        id: "ingestionFrequency",
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

  return (
    <section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 3: Configure school connectivity API
        </p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack className="w-full" orientation="horizontal">
          <section className="flex flex-col gap-4">
            <section className="flex flex-col gap-6">
              <section className="flex flex-col gap-6">
                <header className="text-2xl">Ingestion Source</header>
                <RequestMethodSelect />
                <ApiEndpointTextInput />
                <AuthTypeSelect />
                {watchAuthType === API_KEY && <AuthApiKeyInputs />}
                {watchAuthType === BASIC_AUTH && <AuthBasicInputs />}
                {watchAuthType === BEARER_TOKEN && <AuthBearerInputs />}
              </section>
              <section className="flex flex-col gap-6">
                <header className="text-2xl">Ingestion Parameters</header>

                <DataKeyTextInput />

                <PaginationTypeSelect />
                {watchPaginationType === PAGE_NUMBER && (
                  <PaginationPageNumberInputs />
                )}
                {watchPaginationType === LIMIT_OFFSET && (
                  <PaginationLimitOffsetInputs />
                )}
                <SendQueryInSelect />
                {watchSendQueryIn === BODY && <SendQueryInBodyInputs />}
                {watchSendQueryIn === QUERY_PARAMETERS && (
                  <SendQueryInQueryParametersInputs />
                )}
              </section>
              <header className="text-2xl">Ingestion Details</header>
              <FrequencySelect />
              <IngestionEnabledToggle />
            </section>
            <ButtonSet className="w-full">
              <Button
                as={Link}
                className="w-full"
                isExpressive
                kind="secondary"
                renderIcon={ArrowLeft}
                to="/ingest-api/column-mapping"
                onClick={() => {
                  decrementStepIndex();
                  resetSchoolConnectivityFormValues();
                }}
              >
                Cancel
              </Button>
              {/* this should modal submit */}
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
          <aside className="flex h-full">
            <TextArea disabled labelText="Preview" rows={40} />
          </aside>
        </Stack>
      </form>
      <Outlet />
    </section>
  );
}
