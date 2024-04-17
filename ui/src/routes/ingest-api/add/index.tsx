import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

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

import { api } from "@/api";
import { listUsersQueryOptions } from "@/api/queryOptions.ts";
import IngestFormSkeleton from "@/components/ingest-api/IngestFormSkeleton";
import SchoolListFormInputs from "@/components/ingest-api/SchoolListFormInputs";
import { useStore } from "@/context/store";
import { SchoolListFormSchema } from "@/forms/ingestApi.ts";
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
  const [responsePreview, setResponsePreview] = useState<string | string[]>("");
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
  });
  const {
    formState: { errors },
    handleSubmit,
    watch,
    trigger,
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

  const prettyResponse = JSON.stringify(responsePreview, undefined, 2);

  return isUsersLoading ? (
    <IngestFormSkeleton />
  ) : (
    <Section className="container py-6">
      <header className="gap-2">
        <p className="my-0 py-1 text-2xl">
          Step 1: Configure school listing API
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-10">
          <div className="flex w-full flex-col gap-4">
            <p>
              Enter the details for a school listing API. The API must be tested
              and should return a success response with valid parameters before
              you can proceed.
            </p>

            <SchoolListFormInputs hookForm={hookForm} users={users} />

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
          <aside className="sticky top-0 h-[90vh] w-full">
            <div className="flex items-center justify-between">
              <p>Preview</p>
              <Button
                size="md"
                onClick={async () => {
                  if (!(await trigger())) return;

                  await testApi({
                    setIsValidResponse,
                    setIsResponseError,
                    setResponsePreview,
                    watch,
                    setIsValidDataKey,
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
            {!isValidDataKey && <Tag type="red">Invalid Data Key</Tag>}
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
      <Outlet />
    </Section>
  );
}
