import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Section, Tag } from "@carbon/react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import ConfirmAddIngestionModal from "@/components/ingest-api/ConfirmAddIngestionModal";
import SchoolConnectivityFormInputs from "@/components/ingest-api/SchoolConnectivityFormInputs";
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

function SchoolConnectivity() {
  const [responsePreview, setResponsePreview] = useState<string | string[]>("");
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidDatakey, setIsValidDatakey] = useState<boolean>(false);
  const [isResponseError, setIsResponseError] = useState<boolean>(false);

  const {
    decrementStepIndex,
    resetSchoolConnectivityFormValues,
    setSchoolConnectivityFormValues,
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
      authorization_type: AuthorizationTypeEnum.BEARER_TOKEN,
      basic_auth_password: null,
      basic_auth_username: null,
      bearer_auth_bearer_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImRhaWx5Y2hlY2thcHAiLCJpYXQiOjE1MTYyMzkwMjJ9.9lHxUZ0XmSc-5ddqEEKFt2Opx2CC-gSsRTGSCI-KcQU",

      data_key: "data",
      enabled: false,
      page_number_key: null,
      page_offset_key: null,
      page_size_key: null,
      page_starts_with: null,
      pagination_type: PaginationTypeEnum.NONE,
      query_parameters: JSON.stringify({
        page: 1,
        size: 3,
      }),
      request_body: "",
      request_method: RequestMethodEnum.GET,
      send_query_in: SendQueryInEnum.NONE,
      size: null,
      //delete these non-nullabes
      school_id_key: "SOMESCHOOLID",
      api_endpoint:
        "https://uni-connect-services-dev.azurewebsites.net/api/v1/schools/country/32",
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

  const errorStates = {
    setIsResponseError,
    setIsValidDatakey,
    setIsValidResponse,
    setResponsePreview,
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
            <SchoolConnectivityFormInputs
              errorStates={errorStates}
              gettedFormValues={gettedFormValues}
              hasError={hasError}
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