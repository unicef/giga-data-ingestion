import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Loading, Section, Tag } from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, createFileRoute } from "@tanstack/react-router";

import { MemoizedApiPreview } from "@/components/ingest-api/ApiPreview.tsx";
import ConfirmAddIngestionModal from "@/components/ingest-api/ConfirmAddIngestionModal";
import SchoolConnectivityFormInputs from "@/components/ingest-api/SchoolConnectivityFormInputs";
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
import { useStore } from "@/context/store";
import { SchoolConnectivityFormSchema } from "@/forms/ingestApi.ts";
import { useTestApi } from "@/hooks/useTestApi.ts";

export const Route = createFileRoute("/ingest-api/add/school-connectivity")({
  component: SchoolConnectivity,
  loader: () => {
    // TODO: put this back
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
    reValidateMode: "onChange",
    resolver: zodResolver(SchoolConnectivityFormSchema, { async: true }),
    defaultValues: schoolConnectivity,
    shouldFocusError: true,
  });
  const {
    formState: { errors, isValid },
    handleSubmit,
    resetField,
    trigger,
    watch,
    getValues,
    control,
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

  const handleClickTest = useCallback(async () => {
    if (!(await trigger())) return;

    await testApi({
      apiType: "schoolConnectivity",
      setIsValidResponse,
      setIsResponseError,
      setResponsePreview,
      getValues,
      setIsValidDataKey,
      setIsValidResponseDateFormat,
    });
  }, [getValues, testApi, trigger]);

  const prettyResponse = useMemo(
    () => JSON.stringify(responsePreview, undefined, 2),
    [responsePreview],
  );

  const isSubmitDisabled =
    !hasUploadedFile ||
    !isValid ||
    !isValidDatakey ||
    !isValidResponse ||
    !isValidResponseDateFormat ||
    isResponseError;

  return (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 3: Configure school connectivity API
        </p>
      </header>

      <div className="grid grid-cols-2 gap-10">
        <div className="flex w-full flex-col gap-4">
          <FormProvider {...hookForm}>
            <form onSubmit={handleSubmit(onSubmit)}>
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
                  disabled={isSubmitDisabled}
                  isExpressive
                  renderIcon={ArrowRight}
                  type="submit"
                >
                  Proceed
                </Button>
              </ButtonSet>
            </form>
          </FormProvider>
        </div>
        <aside className="h-[90vh] w-full">
          <div className="flex items-center justify-between">
            <p>Preview</p>
            <Button
              size="md"
              onClick={handleClickTest}
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
          <MemoizedApiPreview
            preview={responsePreview === "" ? "" : prettyResponse}
          />
        </aside>
      </div>
      <ConfirmAddIngestionModal open={open} setOpen={setOpen} />
      <Suspense>
        <ReactHookFormDevTools
          // @ts-expect-error incorrect type inference
          control={control}
        />
      </Suspense>
    </Section>
  );
}
