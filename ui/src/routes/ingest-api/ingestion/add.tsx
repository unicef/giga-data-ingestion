import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  Button,
  Section,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

import { api } from "@/api";
import { Select } from "@/components/forms/Select";
import ControllerNumberInputSchoolList from "@/components/upload/ControllerNumberInputSchoolList";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView";
// import { TextInput } from "@/components/forms/TextInput";
// import { z } from "zod";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SchoolListFormValues,
  SendQueryInEnum,
} from "@/types/qos";

// import type { json } from "../../../types/json";

export const Route = createFileRoute("/ingest-api/ingestion/add")({
  component: AddIngestion,
});

function AddIngestion() {
  // const { schoolList, setSchoolList } = useQosStore();

  const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;
  const { LIMIT_OFFSET, PAGE_NUMBER } = PaginationTypeEnum;
  const { BODY, QUERY_PARAMETERS } = SendQueryInEnum;

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
      name: "someName", // remove this after dev
      requestMethod: RequestMethodEnum.GET, // remove this after dev
      authType: AuthorizationTypeEnum.BEARER_TOKEN, // remove this after dev
      apiEndpoint: "myEndpoint", // remove this after dev
      dataKey: "",
      schoolIdKey: "",

      paginationType: null,
      pageNumberKey: null,
      pageOffsetKey: null,
      pageSizeKey: null,
      pageStartsWith: null,
      apiAuthApiKey: null,
      apiAuthApiValue: null,
      basicAuthUsername: null,
      basicAuthPassword: null,
      bearerAuthBearerToken: null,
      size: null,
      queryParamters: null,
      requestBody: null,
    },
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
    resetField("pageNumberKey");
    resetField("pageOffsetKey");
    resetField("pageStartsWith");
    resetField("size");
    resetField("queryParamters");
    resetField("requestBody");
  }, [watchAuthType, resetField]);

  const {
    data: usersQuery,
    isLoading: isUsersLoading,
    // refetch: refetchUsers,
    isRefetching: isUsersRefetching,
  } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
  });

  const users = usersQuery?.data ?? [];

  // const stringToJSONSchema = z
  //   .string()
  //   .transform((str, ctx): z.infer<ReturnType<typeof json>> => {
  //     try {
  //       const json = JSON.parse(str);

  //       setValidJson(true);

  //       return json;
  //     } catch (e) {
  //       console.log("setting error");
  //       ctx.addIssue({ code: "custom", message: "Invalid JSON" });
  //       console.log("setting error2");

  //       setValidJson(false);
  //       return z.NEVER;
  //     }
  //   });

  const onSubmit: SubmitHandler<SchoolListFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      console.log("Form has errors, not submitting");
      return;
    }

    const user = users.find(user => user.id === data.userId);

    console.log(data.pageStartsWith);
    let paginationType = data.paginationType;

    if (data.paginationType === "none") paginationType = null;

    console.log(paginationType);
    console.log(
      `submitting user with email ${user?.mail} with user id ${data.userId}`,
    );

    console.log(data);

    // set other fields to none ok?
  };

  if (isUsersLoading) return <div>SKELETON</div>;

  return (
    <AuthenticatedRBACView roles={["Admin", "Super"]}>
      <Section className="container py-6">
        <header className="gap-2">
          <p className="my-0 py-1 text-2xl">Create a New Ingestion</p>
          <p className="my-0 py-1 text-2xl">
            Step 1: Configure school listing API
          </p>
        </header>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack orientation="horizontal">
            <section className="flex flex-col gap-4">
              <section className="flex flex-col gap-6">
                <header className="text-2xl">Name</header>

                <TextInput
                  id="name"
                  invalid={!!errors.name}
                  labelText=""
                  placeholder="How would you like to indentify your ingestion?"
                  {...register("name", { required: true })}
                />
              </section>

              <section className="flex flex-col gap-6">
                <header className="text-2xl">Ingestion Details</header>
                <Select
                  id="userId"
                  disabled={isUsersRefetching}
                  helperText="Who will be the designated point person responsible for this ingestion?"
                  invalid={!!errors.requestMethod}
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
              </section>

              <section className="flex flex-col gap-6">
                <header className="text-2xl">Ingestion Source</header>
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
                <div className="flex items-end">
                  <TextInput
                    id="apiEndpoint"
                    invalid={!!errors.apiEndpoint}
                    labelText="API Endpoint"
                    placeholder="https://example.com/api/ingest"
                    {...register("apiEndpoint", { required: true })}
                  />
                  <div className="bottom-px">
                    <Button size="md">hello world</Button>
                  </div>
                </div>

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

                {watchAuthType === API_KEY && (
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
                )}
                {watchAuthType === BASIC_AUTH && (
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
                )}
                {watchAuthType === BEARER_TOKEN && (
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
                )}
              </section>

              <section className="flex flex-col gap-6">
                <header className="text-2xl">Ingestion Parameters</header>
                <Select
                  id="paginationType"
                  invalid={!!errors.paginationType}
                  labelText="Pagination Method"
                  {...register("paginationType", { required: true })}
                >
                  <SelectItem value="none" text="None" />
                  {Object.keys(PaginationTypeEnum).map(paginationType => (
                    <SelectItem
                      key={paginationType}
                      text={paginationType.replace(/_/g, " ")}
                      value={paginationType}
                    />
                  ))}
                </Select>
                {watchPaginationType === LIMIT_OFFSET && (
                  <>
                    <TextInput
                      id="pageNumberKey"
                      invalid={!!errors.pageNumberKey}
                      labelText="Page number"
                      placeholder="Input Page number"
                      {...register("pageNumberKey", { required: true })}
                    />
                    <TextInput
                      id="pageOffsetKey"
                      invalid={!!errors.pageOffsetKey}
                      labelText="Page Offset"
                      placeholder="Input Page Offset"
                      {...register("pageOffsetKey", { required: true })}
                    />
                  </>
                )}
                {watchPaginationType === PAGE_NUMBER && (
                  <>
                    <TextInput
                      id="pageSizeKey"
                      invalid={!!errors.pageSizeKey}
                      labelText="Page size key"
                      placeholder="Input Page size key"
                      {...register("pageSizeKey", { required: true })}
                    />
                    <ControllerNumberInputSchoolList
                      control={control}
                      name="pageStartsWith"
                      numberInputProps={{
                        id: "pageStartsWith",
                        label: <span>Page Starts With</span>,
                      }}
                    />
                  </>
                )}
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
                {watchSendQueryIn === QUERY_PARAMETERS && (
                  <TextArea
                    id="queryParamters"
                    invalid={!!errors.queryParamters}
                    labelText="Query parameters"
                    placeholder="Input query parameters"
                    {...register("queryParamters", { required: true })}
                  />
                )}
                {watchSendQueryIn === BODY && (
                  <TextArea
                    id="requestBody"
                    invalid={!!errors.requestBody}
                    labelText="Request body"
                    placeholder="Input request body"
                    {...register("requestBody", { required: true })}
                  />
                )}

                <Button type="submit">Submit</Button>
              </section>
            </section>
            {/* <aside>{JSON.stringify(usersQuery?.data)}</aside> */}
            <aside>actual data</aside>
          </Stack>
        </form>
        <Outlet />
      </Section>
    </AuthenticatedRBACView>
  );
}
