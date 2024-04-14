import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Tag } from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { api, queryClient } from "@/api";
import ConfirmEditIngestionModal from "@/components/ingest-api/ConfirmEditIngestionModal";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import SchoolConnectivityFormInputs from "@/components/ingest-api/SchoolConnectivityFormInputs";
import { useStore } from "@/context/store";
import { SchoolConnectivityFormValues } from "@/types/qos";

export const Route = createFileRoute(
  "/ingest-api/edit/$ingestionId/school-connectivity",
)({
  component: SchoolConnectivity,
  loader: async ({ params: { ingestionId } }) => {
    const options = queryOptions({
      queryKey: ["school_connectivity", ingestionId],
      queryFn: () => api.qos.get_school_connectivity(ingestionId),
    });

    return await queryClient.ensureQueryData(options);
  },
  errorComponent: IngestFormSkeleton,
  pendingComponent: IngestFormSkeleton,
});

function SchoolConnectivity() {
  ``;
  const [isResponseError, setIsResponseError] = useState<boolean>(false);
  const [isValidDatakey, setIsValidDataKey] = useState<boolean>(false);
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidResponseDateFormat, setIsValidResponseDateFormat] =
    useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [responsePreview, setResponsePreview] = useState<string | string[]>("");

  const {
    apiIngestionSliceActions: {
      decrementStepIndex,
      setSchoolConnectivityFormValues,
      resetSchoolConnectivityFormValues,
    },
  } = useStore();

  const { ingestionId } = Route.useParams();

  const {
    data: { data: schoolConnectivityQuery },
  } = useSuspenseQuery({
    queryKey: ["school_connectivity", ingestionId],
    queryFn: () => api.qos.get_school_connectivity(ingestionId),
  });

  const {
    id: _id,
    date_created: _date_created,
    date_modified: _date_modified,
    schema_url: _schema_url,
    school_list: _school_list,
    school_list_id: _school_list_id,
    user_email: _user_email,
    user_id: _user_id,
    ...schoolConnectivityFormDefaultValues
  } = schoolConnectivityQuery;

  const {
    clearErrors,
    control,
    formState,
    handleSubmit,
    register,
    resetField,
    setError,
    setValue,
    trigger,
    watch,
  } = useForm<SchoolConnectivityFormValues>({
    defaultValues: {
      ...schoolConnectivityFormDefaultValues,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { errors, isValid } = formState;
  const watchAuthType = watch("authorization_type");
  const watchPaginationType = watch("pagination_type");

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
  }, [resetField]);

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
    setIsValidDataKey,
    setIsValidResponse,
    setResponsePreview,
    setIsValidResponseDateFormat,
  };
  return (
    <section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 3: Configure school connectivity API
        </p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex w-full space-x-10 ">
          <section className="flex w-full flex-col gap-4">
            <div
              onClick={() => {
                setOpen(true);
              }}
            >
              ENABLE SUBMIT
            </div>
            <SchoolConnectivityFormInputs
              clearErrors={clearErrors}
              control={control}
              errors={errors}
              errorStates={errorStates}
              hasFileUpload={false}
              register={register}
              setError={setError}
              setValue={setValue}
              trigger={trigger}
              watch={watch}
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
                  !isValidResponseDateFormat ||
                  !isValid
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
      <ConfirmEditIngestionModal
        open={open}
        setOpen={setOpen}
        schoolListId={ingestionId}
      />
    </section>
  );
}
