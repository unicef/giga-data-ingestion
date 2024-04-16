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
import { useStore } from "@/context/store";
import { SchoolListFormValues } from "@/types/qos";

export const Route = createFileRoute("/ingest-api/add/")({
  component: AddIngestion,
});

function AddIngestion() {
  const [responsePreview, setResponsePreview] = useState<string | string[]>("");
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidDatakey, setIsValidDatakey] = useState<boolean>(false);
  const [isResponseError, setIsResponseError] = useState<boolean>(false);

  const {
    apiIngestionSliceActions: {
      setSchoolListFormValues,
      incrementStepIndex,
      resetApiIngestionState,
    },
  } = useStore();

  const navigate = useNavigate({ from: Route.fullPath });

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

  const {
    control,
    formState,
    handleSubmit,
    register,
    resetField,
    trigger,
    watch,
  } = useForm<SchoolListFormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      api_auth_api_key: null,
      api_auth_api_value: null,
      basic_auth_password: null,
      basic_auth_username: null,
      bearer_auth_bearer_token: null,
      data_key: "",
      name: "",
      page_number_key: null,
      page_offset_key: null,
      page_size_key: "",
      page_starts_with: null,
      query_parameters: null,
      request_body: null,
      size: null,
    },
  });

  const { errors } = formState;
  const watchAuthType = watch("authorization_type");
  const watchPaginationType = watch("pagination_type");
  const watchRequestMethod = watch("request_method");

  const hasError = Object.keys(errors).length > 0;

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
              control={control}
              errors={errors}
              errorStates={errorStates}
              fetchingStates={fetchingStates}
              hasError={hasError}
              register={register}
              trigger={trigger}
              users={users}
              watch={watch}
            />

            <ButtonSet className="w-full">
              <Button
                as={Link}
                className="w-full"
                isExpressive
                kind="secondary"
                renderIcon={ArrowLeft}
                to="/ingest-api"
                onClick={resetApiIngestionState}
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
