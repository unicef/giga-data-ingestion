import { Suspense, useCallback, useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Loading, Section, Tag } from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { ZodError } from "zod";

import { api } from "@/api";
import { listUsersQueryOptions } from "@/api/queryOptions.ts";
import { MemoizedApiPreview } from "@/components/ingest-api/ApiPreview.tsx";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import SchoolListFormInputs from "@/components/ingest-api/SchoolListFormInputs";
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
import { useStore } from "@/context/store";
import { SchoolListFormSchema, TestApiSchema } from "@/forms/ingestApi.ts";
import { useTestApi } from "@/hooks/useTestApi.ts";

const schemaQueryOptions = queryOptions({
  queryFn: () => api.schema.get("school_geolocation"),
  queryKey: ["schema", "school_geolocation"],
});

export const Route = createFileRoute("/ingest-api/add/")({
  component: AddIngestion,
  loader: ({ context: { queryClient } }) => {
    return Promise.all([
      queryClient.ensureQueryData(schemaQueryOptions),
      queryClient.ensureQueryData(listUsersQueryOptions),
    ]);
  },
  pendingComponent: IngestFormSkeleton,
});

function AddIngestion() {
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
  } = useSuspenseQuery(schemaQueryOptions);

  const hookForm = useForm<SchoolListFormSchema>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(SchoolListFormSchema, { async: true }),
    defaultValues: schoolList,
    shouldFocusError: true,
  });

  const {
    handleSubmit,
    control,
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
      "school_id_send_query_in",
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
        <p className="my-0 py-1 text-2xl">
          Step 1: Configure school listing API
        </p>
      </header>

      <div className="grid grid-cols-2 gap-10">
        <div>
          <p>
            Enter the details for a school listing API. The API must be tested
            and should return a success response with valid parameters before
            you can proceed.
          </p>
          <FormProvider {...hookForm}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex w-full flex-col gap-4">
                <SchoolListFormInputs users={users} />

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
                      !isValidResponse || !isValidDataKey || isResponseError
                    }
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
          {!isValidDataKey && <Tag type="red">Invalid Data Key</Tag>}
          <MemoizedApiPreview
            preview={responsePreview === "" ? "" : prettyResponse}
          />
        </aside>
      </div>
      <Outlet />
      <Suspense>
        <ReactHookFormDevTools
          // @ts-expect-error incorrect type inference
          control={control}
        />
      </Suspense>
    </Section>
  );
}
