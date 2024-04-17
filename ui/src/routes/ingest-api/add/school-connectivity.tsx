import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Loading, Section, Tag } from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, createFileRoute } from "@tanstack/react-router";

import ConfirmAddIngestionModal from "@/components/ingest-api/ConfirmAddIngestionModal";
import SchoolConnectivityFormInputs from "@/components/ingest-api/SchoolConnectivityFormInputs";
import { useStore } from "@/context/store";
import { SchoolConnectivityFormSchema } from "@/forms/ingestApi.ts";
import { useTestApi } from "@/hooks/useTestApi.ts";

export const Route = createFileRoute("/ingest-api/add/school-connectivity")({
  component: SchoolConnectivity,
  loader: () => {
    // const {
    //   schoolList: { api_endpoint },
    // } = useStore.getState().apiIngestionSlice;
    //
    // if (api_endpoint === "") throw redirect({ to: ".." });
  },
});

function SchoolConnectivity() {
  const [isResponseError, setIsResponseError] = useState<boolean>(false);
  const [isValidDatakey, setIsValidDataKey] = useState<boolean>(false);
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidResponseDateFormat, setIsValidResponseDateFormat] =
    useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [responsePreview, setResponsePreview] = useState<
    Record<string, unknown> | Record<string, unknown>[] | string
  >("");

  const {
    apiIngestionSlice: { file, schoolConnectivity },
    apiIngestionSliceActions: {
      decrementStepIndex,
      resetSchoolConnectivityFormValues,
      setSchoolConnectivityFormValues,
    },
  } = useStore();

  const { testApi, isLoading } = useTestApi();

  const hasUploadedFile = file != null;

  const hookForm = useForm<SchoolConnectivityFormSchema>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(SchoolConnectivityFormSchema, { async: true }),
    defaultValues: schoolConnectivity,
    shouldFocusError: true,
    shouldUnregister: true,
  });
  const {
    formState: { errors, isValid },
    handleSubmit,
    resetField,
    trigger,
    watch,
  } = hookForm;

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

  const onSubmit: SubmitHandler<SchoolConnectivityFormSchema> = async data => {
    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }
    resetSchoolConnectivityFormValues();
    setSchoolConnectivityFormValues(data);
    setOpen(true);
  };

  const prettyResponse = JSON.stringify(responsePreview, undefined, 4);

  return (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 3: Configure school connectivity API
        </p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-10">
          <div className="flex w-full flex-col gap-4">
            <SchoolConnectivityFormInputs hookForm={hookForm} />

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
                  !hasUploadedFile ||
                  !isValid ||
                  !isValidDatakey ||
                  !isValidResponse ||
                  !isValidResponseDateFormat ||
                  isResponseError
                }
                isExpressive
                renderIcon={ArrowRight}
                type="submit"
              >
                Proceed
              </Button>
            </ButtonSet>
          </div>
          <aside className="sticky top-0 h-[90vh] w-full">
            <div className="flex items-center justify-between">
              <p>Preview</p>
              <Button
                size="md"
                onClick={async () => {
                  if (!(await trigger())) return;

                  await testApi({
                    apiType: "schoolConnectivity",
                    setIsValidResponse,
                    setIsResponseError,
                    setResponsePreview,
                    watch,
                    setIsValidDataKey,
                    setIsValidResponseDateFormat,
                  });
                }}
                renderIcon={props =>
                  isLoading ? (
                    <Loading small={true} withOverlay={false} {...props} />
                  ) : null
                }
                disabled={isLoading}
                isExpressive
              >
                Test
              </Button>
            </div>
            {isResponseError && (
              <Tag type="red">Invalid Output from API request</Tag>
            )}
            {responsePreview === "invalid" && (
              <Tag type="red">Invalid Data Key</Tag>
            )}
            {!isValidResponseDateFormat && (
              <Tag type="red">Response date format mismatch</Tag>
            )}
            <SyntaxHighlighter
              customStyle={{ height: "100%" }}
              showLineNumbers
              language="json"
              style={docco}
            >
              {responsePreview === "" ? "" : prettyResponse}
            </SyntaxHighlighter>
          </aside>
        </div>
      </form>
      <ConfirmAddIngestionModal open={open} setOpen={setOpen} />
    </Section>
  );
}
