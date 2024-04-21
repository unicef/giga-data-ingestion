import { Suspense, useCallback, useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Loading, Section, Tag } from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@monaco-editor/react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { ZodError } from "zod";

import ConfirmAddIngestionModal from "@/components/ingest-api/ConfirmAddIngestionModal";
import SchoolConnectivityFormInputs from "@/components/ingest-api/SchoolConnectivityFormInputs";
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
import { useStore } from "@/context/store";
import {
  SchoolConnectivityFormSchema,
  TestApiSchema,
} from "@/forms/ingestApi.ts";
import { useTestApi } from "@/hooks/useTestApi.ts";

export const Route = createFileRoute("/ingest-api/add/school-connectivity")({
  component: SchoolConnectivity,
  loader: () => {
    const {
      apiIngestionSlice: {
        schoolList: { api_endpoint },
      },
      apiIngestionSliceActions: { setStepIndex },
    } = useStore.getState();

    if (api_endpoint === "") {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }

    setStepIndex(2);
  },
});

function SchoolConnectivity() {
  const [isResponseError, setIsResponseError] = useState<boolean>(false);
  const [isValidDataKey, setIsValidDataKey] = useState<boolean>(false);
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidResponseDateFormat, setIsValidResponseDateFormat] =
    useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [responsePreview, setResponsePreview] = useState<
    Record<string, unknown> | Record<string, unknown>[] | string
  >("");

  const {
    apiIngestionSlice: {
      // file,
      schoolConnectivity,
    },
    apiIngestionSliceActions: {
      decrementStepIndex,
      resetSchoolConnectivityFormValues,
      setSchoolConnectivityFormValues,
    },
  } = useStore();

  const { testApi, isLoading } = useTestApi();

  // const hasUploadedFile = file != null;

  const hookForm = useForm<SchoolConnectivityFormSchema>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(SchoolConnectivityFormSchema),
    defaultValues: schoolConnectivity,
    shouldFocusError: true,
  });
  const {
    formState: { errors },
    handleSubmit,
    getValues,
    control,
    clearErrors,
    setError,
  } = hookForm;

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
    clearErrors();

    const excludedFields: (keyof SchoolConnectivityFormSchema)[] = [
      "school_id_key",
      "school_id_send_query_in",
    ];
    const currentForm = Object.fromEntries(
      Object.entries(getValues()).filter(
        ([key]) =>
          !excludedFields.includes(key as keyof SchoolConnectivityFormSchema),
      ),
    );

    try {
      await TestApiSchema.parseAsync(currentForm);
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        for (const e of error.errors) {
          setError(e.path.join(".") as keyof SchoolConnectivityFormSchema, {
            message: e.message,
          });
        }
      }
      return;
    }

    await testApi({
      apiType: "schoolConnectivity",
      getValues,
      setIsValidResponse,
      setIsResponseError,
      setResponsePreview,
      setIsValidDataKey,
      setIsValidResponseDateFormat,
    });
  }, [clearErrors, getValues, testApi, setError]);

  const prettyResponse = useMemo(
    () => JSON.stringify(responsePreview, undefined, 2),
    [responsePreview],
  );

  const isSubmitDisabled =
    // !hasUploadedFile ||
    !isValidDataKey ||
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
              <div className="flex w-full flex-col gap-4">
                <SchoolConnectivityFormInputs />

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
              </div>
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
          <Editor
            height="100%"
            defaultLanguage="json"
            value={prettyResponse}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: {
                enabled: false,
              },
            }}
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
