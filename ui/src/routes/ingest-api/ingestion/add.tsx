import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  Button,
  Section,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

import { api } from "@/api";
import { Select } from "@/components/forms/Select";
// import { TextInput } from "@/components/forms/TextInput";
// import { z } from "zod";
import {
  AuthorizationTypeEnum,
  RequestMethodEnum,
  SchoolListFormValues,
} from "@/types/qos";

// import type { json } from "../../../types/json";

export const Route = createFileRoute("/ingest-api/ingestion/add")({
  component: AddIngestion,
});

function AddIngestion() {
  // const { schoolList, setSchoolList } = useQosStore();

  const { API_KEY, BASIC_AUTH, BEARER_TOKEN } = AuthorizationTypeEnum;

  const {
    handleSubmit,

    register,
    resetField,
    watch,
    // control,

    formState: { errors },
  } = useForm<SchoolListFormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "someName", // remove this after dev
      requestMethod: RequestMethodEnum.GET, // remove this after dev
      apiEndpoint: "myEndpoint", // remove this after dev
      apiAuthApiKey: null,
      apiAuthApiValue: null,
      basicAuthUsername: null,
      basicAuthPassword: null,
      bearerAuthBearerToken: null,
    },
  });

  const watchAuthType = watch("authType");

  useEffect(() => {
    resetField("apiAuthApiKey");
    resetField("apiAuthApiValue");
    resetField("basicAuthUsername");
    resetField("basicAuthPassword");
    resetField("bearerAuthBearerToken");
  }, [watchAuthType, resetField]);

  const {
    data: usersQuery,
    isLoading: isUsersLoading,
    // refetch: refetchUsers,
    isRefetching: isUsersRefetching,
  } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
  });

  const users = usersQuery?.data ?? [];

  // const stringToJSONSchema = z
  //   .string()
  //   .transform((str, ctx): z.infer<ReturnType<typeof json>> => {
  //     try {
  //       const json = JSON.parse(str);

  //       setValidJson(true);

  //       return json;
  //     } catch (e) {
  //       console.log("setting error");
  //       ctx.addIssue({ code: "custom", message: "Invalid JSON" });
  //       console.log("setting error2");

  //       setValidJson(false);
  //       return z.NEVER;
  //     }
  //   });

  const onSubmit: SubmitHandler<SchoolListFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      console.log("Form has errors, not submitting");
      return;
    }

    const user = users.find(user => user.id === data.userId);

    console.log(
      `submitting user with email ${user?.mail} with user id ${data.userId}`,
    );

    console.log(data);

    // set other fields to none ok?
  };

  if (isUsersLoading) return <div>SKELETON</div>;

  return (
    // <AuthenticatedRBACView roles={["Admin", "Super"]}>
    <Stack gap={4}>
      <Section className="container py-6">
        <header className="gap-2">
          <p className="my-0 py-1 text-2xl">Create a New Ingestion</p>
          <p className="my-0 py-1 text-2xl">
            Step 1: Configure school listing API
          </p>
        </header>
        <form onSubmit={handleSubmit(onSubmit)}>
          <section className="container flex">
            <section className="flex flex-col gap-4">
              <header className="text-lg">Name</header>
              <TextInput
                id="name"
                invalid={!!errors.name}
                labelText=""
                placeholder="How would you like to indentify your ingestion?"
                {...register("name", { required: true })}
              />
              <header className="text-xl">Ingestion Details</header>
              <Select
                id="userId"
                disabled={isUsersRefetching}
                helperText="Who will be the designated point person responsible for this ingestion?"
                invalid={!!errors.requestMethod}
                labelText="Owner"
                {...register("userId", { required: true })}
              >
                <SelectItem value="" text="" />
                {users.map(user => (
                  <SelectItem
                    key={user.id}
                    text={user.display_name ?? ""}
                    value={user.id}
                  />
                ))}
              </Select>
              <header className="text-xl">Ingestion Source</header>
              <Select
                id="requestMethod"
                invalid={!!errors.requestMethod}
                labelText="Request Method"
                {...register("requestMethod", { required: true })}
              >
                <SelectItem value="" text="" />
                {Object.keys(RequestMethodEnum).map(requestMethod => (
                  <SelectItem
                    key={requestMethod}
                    value={requestMethod}
                    text={requestMethod}
                  />
                ))}
              </Select>
              <div className="flex items-end">
                <TextInput
                  id="apiEndpoint"
                  invalid={!!errors.apiEndpoint}
                  labelText="API Endpoint"
                  placeholder="https://example.com/api/ingest"
                  {...register("apiEndpoint", { required: true })}
                />
                <div className="bottom-px">
                  <Button size="md">hello world</Button>
                </div>
              </div>
              <Select
                id="authType"
                invalid={!!errors.authType}
                labelText="Authentication Method"
                {...register("authType", { required: true })}
              >
                <SelectItem value="" text="" />
                {Object.keys(AuthorizationTypeEnum).map(authType => (
                  <SelectItem
                    key={authType}
                    text={authType.replace(/_/g, " ")}
                    value={authType}
                  />
                ))}
              </Select>
              {/* )}
            /> */}

              {watchAuthType === API_KEY && (
                <>
                  <TextInput
                    id="apiAuthApiKey"
                    invalid={!!errors.apiAuthApiKey}
                    labelText="api response key"
                    placeholder="Input Authentication Credentials"
                    {...register("apiAuthApiKey", { required: true })}
                  />
                  {/*
                  //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
                  <TextInput.PasswordInput
                    id="apiAuthApiValue"
                    invalid={!!errors.apiAuthApiValue}
                    labelText="Authentication Credentials"
                    placeholder="Input Authentication Credentials"
                    {...register("apiAuthApiValue", { required: true })}
                  />
                </>
              )}
              {watchAuthType === BASIC_AUTH && (
                <>
                  <TextInput
                    id="basicAuthUsername"
                    invalid={!!errors.basicAuthUsername}
                    labelText="api response key"
                    placeholder="Input Authentication Credentials"
                    {...register("basicAuthUsername", { required: true })}
                  />
                  {/*
                  //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
                  <TextInput.PasswordInput
                    id="basicAuthPassword"
                    invalid={!!errors.basicAuthPassword}
                    labelText="Authentication Credentials"
                    placeholder="Input Authentication Credentials"
                    {...register("basicAuthPassword", { required: true })}
                  />
                </>
              )}
              {watchAuthType === BEARER_TOKEN && (
                <>
                  {/*
                  //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}
                  <TextInput.PasswordInput
                    id="bearerAuthBearerToken"
                    invalid={!!errors.bearerAuthBearerToken}
                    labelText="Authentication Credentials"
                    placeholder="Input Authentication Credentials"
                    {...register("bearerAuthBearerToken", { required: true })}
                  />
                </>
              )}
              {/*

            
                  

      
          
            {/*
              TODO: JSON VALIDATION
            */}
              <TextArea
                id="requestBody"
                helperText="Click on the plus icon when adding a variable"
                labelText="Request body in JSON format"
                placeholder=""
                warnText="Invalid JSON"
              />
              <Button type="submit">Submit</Button>
            </section>
            <aside>JSON display here</aside>
          </section>
        </form>
        <Outlet />
      </Section>
    </Stack>
    // </AuthenticatedRBACView>
  );
}
