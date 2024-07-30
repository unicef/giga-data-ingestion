import { useCallback, useMemo, useState } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Loading, Section, Tag } from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@monaco-editor/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ZodError } from "zod";

import {
  listCountriesQueryOptions,
  listUsersQueryOptions,
  qosGeolocationSchemaQueryOptions,
} from "@/api/queryOptions.ts";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton.tsx";
import SchoolListFormInputs from "@/components/ingest-api/SchoolListFormInputs.tsx";
import { useStore } from "@/context/store.ts";
import { SchoolListFormSchema, TestApiSchema } from "@/forms/ingestApi.ts";
import { useTestApi } from "@/hooks/useTestApi.ts";
import { Route } from "@/routes/ingest-api/add";

type SchoolListingProps =
  | {
      isEditing?: boolean;
      defaultData: never;
    }
  | {
      isEditing: true;
      defaultData: SchoolListFormSchema;
    };

function SchoolListing({ isEditing = false, defaultData }: SchoolListingProps) {
  const [responsePreview, setResponsePreview] = useState<
    Record<string, unknown> | Record<string, unknown>[] | string
  >("");
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidDataKey, setIsValidDataKey] = useState<boolean>(false);
  const [isResponseError, setIsResponseError] = useState<boolean>(false);

  const {
    apiIngestionSlice: { schoolList, detectedColumns },
    apiIngestionSliceActions: {
      setSchoolListFormValues,
      setColumnMapping,
      incrementStepIndex,
      resetApiIngestionState,
    },
  } = useStore();

  const { testApi, isLoading } = useTestApi();

  const navigate = useNavigate({ from: Route.fullPath });

  const {
    data: { data: users },
    isLoading: isUsersLoading,
  } = useSuspenseQuery(listUsersQueryOptions);

  const {
    data: { data: schema },
  } = useSuspenseQuery(qosGeolocationSchemaQueryOptions);

  const {
    data: { data: countries },
  } = useSuspenseQuery(listCountriesQueryOptions);

  const hookForm = useForm<SchoolListFormSchema>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(SchoolListFormSchema, { async: true }),
    defaultValues: isEditing ? defaultData : schoolList,
    shouldFocusError: true,
  });

  const {
    handleSubmit,
    formState: { errors },
    setError,
    getValues,
    clearErrors,
  } = hookForm;

  const onSubmit: SubmitHandler<SchoolListFormSchema> = async data => {
    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }

    const user = users.find(user => user.id === data.user_id);
    const dataWithUserEmail = { ...data, user_email: user?.mail ?? "" };

    const autoColumnMapping: Record<string, string> = {};
    schema.forEach(column => {
      if (detectedColumns.includes(column.name)) {
        autoColumnMapping[column.name] = column.name;
      }
    });

    setSchoolListFormValues(dataWithUserEmail);
    setColumnMapping(autoColumnMapping);
    incrementStepIndex();
    void navigate({ to: "./column-mapping" });
  };

  const handleClickTest = useCallback(async () => {
    clearErrors();

    const excludedFields: (keyof SchoolListFormSchema)[] = [
      "name",
      "user_id",
      "school_id_key",
    ];
    const currentForm = Object.fromEntries(
      Object.entries(getValues()).filter(
        ([key]) => !excludedFields.includes(key as keyof SchoolListFormSchema),
      ),
    );

    try {
      await TestApiSchema.parseAsync(currentForm);
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        for (const e of error.errors) {
          setError(e.path.join(".") as keyof SchoolListFormSchema, {
            message: e.message,
          });
        }
      }
      return;
    }

    await testApi({
      apiType: "schoolList",
      getValues,
      setIsValidResponse,
      setIsResponseError,
      setResponsePreview,
      setIsValidDataKey,
    });
  }, [clearErrors, getValues, setError, testApi]);

  const prettyResponse = useMemo(
    () => JSON.stringify(responsePreview, undefined, 2),
    [responsePreview],
  );

  return isUsersLoading ? (
    <IngestFormSkeleton />
  ) : (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">Step 1: Configure school listing API</p>
      </header>

      <div className="grid grid-cols-2 gap-10">
        <div>
          <p>
            Enter the details for a school listing API. The API must be tested and
            should return a success response with valid parameters before you can
            proceed.
          </p>
          <FormProvider {...hookForm}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex w-full flex-col gap-4">
                <SchoolListFormInputs users={users} countries={countries} />

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
                    disabled={!isValidResponse || !isValidDataKey || isResponseError}
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
          {isResponseError && <Tag type="red">Invalid Output from API request</Tag>}
          {!isValidDataKey && <Tag type="red">Invalid Data Key</Tag>}
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

      <Outlet />
      {/* 
      <Suspense>
        <ReactHookFormDevTools
          // @ts-expect-error incorrect type inference
          control={control}
        />
      </Suspense> */}
    </Section>
  );
}

export default SchoolListing;
