import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Section, Tag } from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { api } from "@/api";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import SchoolListFormInputs from "@/components/ingest-api/SchoolListFormInputs";
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

  const {
    control,
    formState,
    getValues,
    handleSubmit,
    register,
    resetField,
    trigger,
    watch,
  } = useForm<SchoolListFormValues>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      // TODO: Delete non-nullables
      api_auth_api_key: null,
      api_auth_api_value: null,
      api_endpoint:
        "https://uni-connect-services-dev.azurewebsites.net/api/v1/schools/country/32",
      authorization_type: AuthorizationTypeEnum.BEARER_TOKEN,
      basic_auth_password: null,
      basic_auth_username: null,
      bearer_auth_bearer_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImRhaWx5Y2hlY2thcHAiLCJpYXQiOjE1MTYyMzkwMjJ9.9lHxUZ0XmSc-5ddqEEKFt2Opx2CC-gSsRTGSCI-KcQU",
      data_key: "data",
      name: "someName",
      page_number_key: null,
      page_offset_key: null,
      page_size_key: "",
      page_starts_with: null,
      pagination_type: PaginationTypeEnum.NONE,
      query_parameters: JSON.stringify({
        page: 1,
        size: 3,
      }),
      request_body: null,
      request_method: RequestMethodEnum.GET,
      school_id_key: "SOMERANDOMSCHOOLID", //delete this (not nullable)
      send_query_in: SendQueryInEnum.QUERY_PARAMETERS,
      size: null,
    },
  });

  const { errors } = formState;
  const watchAuthType = watch("authorization_type");
  const watchPaginationType = watch("pagination_type");
  const watchRequestMethod = watch("request_method");

  const hasError = Object.keys(errors).length > 0;
  const apiEndpoint = getValues("api_endpoint");
  const apiKeyName = getValues("api_auth_api_key");
  const apiKeyValue = getValues("api_auth_api_value");
  const authorizationType = getValues("authorization_type");
  const basicAuthPassword = getValues("basic_auth_password");
  const basicAuthUserName = getValues("basic_auth_username");
  const bearerAuthBearerToken = getValues("bearer_auth_bearer_token");
  const dataKey = getValues("data_key");
  const queryParams = getValues("query_parameters");
  const requestBody = getValues("request_body");
  const requestMethod = getValues("request_method");

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

  const {
    data: usersQuery,
    isRefetching: isUsersRefetching,
    isFetching: isUsersFetching,
    isLoading: isUsersLoading,
  } = useQuery({
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

  const prettyResponse = JSON.stringify(responsePreview, undefined, 4);

  const errorStates = {
    setIsResponseError,
    setIsValidDatakey,
    setIsValidResponse,
    setResponsePreview,
  };

  const fetchingStates = {
    isUsersFetching,
    isUsersRefetching,
  };

  const gettedFormValues = {
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
  };

  const useFormHookReturnValues = {
    control,
    errors,
    register,
    trigger,
  };

  if (isUsersLoading) return <IngestFormSkeleton />;

  return (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 1: Configure school listing API
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex w-full space-x-10 ">
          <section className="flex w-full flex-col gap-4">
            <SchoolListFormInputs
              errorStates={errorStates}
              fetchingStates={fetchingStates}
              gettedFormValues={gettedFormValues}
              hasError={hasError}
              users={users}
              watchAuthType={watchAuthType}
              watchPaginationType={watchPaginationType}
              watchRequestMethod={watchRequestMethod}
              useFormHookReturnValues={useFormHookReturnValues}
            />
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
          <aside className="flex  w-full flex-col">
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
      <Outlet />
    </Section>
  );
}
