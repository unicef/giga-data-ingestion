import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Section, Tag } from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
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
import { SchoolListFormSchema } from "@/forms/ingestApi.ts";

const listUsersQueryOptions = queryOptions({
  queryKey: ["users"],
  queryFn: api.users.list,
});

export const Route = createFileRoute("/ingest-api/add/")({
  component: AddIngestion,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(listUsersQueryOptions),
});

function AddIngestion() {
  const [responsePreview, setResponsePreview] = useState<string | string[]>("");
  const [isValidResponse, setIsValidResponse] = useState<boolean>(false);
  const [isValidDataKey, setIsValidDataKey] = useState<boolean>(true);
  const [isResponseError, setIsResponseError] = useState<boolean>(false);

  const {
    apiIngestionSlice: { schoolList },
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
  } = useSuspenseQuery(listUsersQueryOptions);

  const users = usersQuery?.data ?? [];

  const hookForm = useForm<SchoolListFormSchema>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(SchoolListFormSchema),
    defaultValues: schoolList,
  });
  const {
    formState: { errors },
    handleSubmit,
  } = hookForm;

  const hasError = Object.keys(errors).length > 0;

  const onSubmit: SubmitHandler<SchoolListFormSchema> = async data => {
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

  const prettyResponse = JSON.stringify(responsePreview, undefined, 2);

  const errorStates = {
    setIsResponseError,
    setIsValidDataKey,
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
        <div className="flex gap-10">
          <div className="flex w-full flex-col gap-4">
            <p>
              Enter the details for a school listing API. The API must be tested
              and should return a success response with valid parameters before
              you can proceed.
            </p>

            <SchoolListFormInputs
              hookForm={hookForm}
              errorStates={errorStates}
              fetchingStates={fetchingStates}
              hasError={hasError}
              users={users}
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
          <div className="h-[95vh] w-full">
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
          </div>
        </div>
      </form>
      <Outlet />
    </Section>
  );
}
