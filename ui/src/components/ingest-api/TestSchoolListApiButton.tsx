import { Dispatch, SetStateAction } from "react";
import {
  UseFormGetValues,
  UseFormStateReturn,
  UseFormTrigger,
} from "react-hook-form";

import { Button } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { isPlainObject } from "lodash";

import { api } from "@/api";
import { useQosStore } from "@/context/qosStore";
import {
  AuthorizationTypeEnum,
  RequestMethodEnum, // RequestMethodEnum,
  SchoolListFormValues, // SendQueryInEnum,
} from "@/types/qos";

interface TestSchoolListApiButtonProps {
  formState: UseFormStateReturn<SchoolListFormValues>;
  getValues: UseFormGetValues<SchoolListFormValues>;
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
  trigger: UseFormTrigger<SchoolListFormValues>;

  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDatakey: Dispatch<SetStateAction<boolean>>;
}

const TestSchoolListApiButton = ({
  formState: { errors },
  getValues,
  trigger,
  setIsValidResponse,
  setIsResponseError,
  setResponsePreview,
  setIsValidDatakey,
}: TestSchoolListApiButtonProps) => {
  const { setDetectedColumns } = useQosStore();

  const { mutateAsync: bearerGetRequest } = useMutation({
    mutationKey: ["bearer_get_request"],
    mutationFn: api.externalRequests.bearerGetRequest,
  });

  const { mutateAsync: basicAuthGetRequest } = useMutation({
    mutationKey: ["basic_get_request"],
    mutationFn: api.externalRequests.basicAuthGetRequest,
  });

  const handleValidationTry = (data: AxiosResponse) => {
    const requestData = data.data;
    const dataKey = getValues("data_key");

    if (dataKey === "") {
      if (!Array.isArray(requestData)) {
        setResponsePreview(requestData);
        setDetectedColumns(Object.keys(requestData));
      }

      if (Array.isArray(requestData)) {
        setResponsePreview(requestData);
        setDetectedColumns(Object.keys(requestData[0]));
      }

      setIsValidDatakey(true);
    }

    if (dataKey !== "") {
      const keyExists = !!requestData[dataKey];

      const isValidDatakey =
        keyExists &&
        Array.isArray(requestData[dataKey]) &&
        isPlainObject(requestData[dataKey][0]) &&
        Object.keys(requestData[dataKey][0]).length > 1;

      setIsResponseError(false);
      setIsValidResponse(true);
      if (isValidDatakey) {
        setDetectedColumns(Object.keys(requestData[dataKey][0]));
        setResponsePreview(requestData);
        setIsValidDatakey(true);
        return;
      }

      setIsValidDatakey(false);
      setResponsePreview("");
      return;
    }
  };
  const handleValidationCatch = () => {
    setIsResponseError(true);
    setIsValidDatakey(false);
    setIsValidResponse(false);
  };

  const handleTest = async () => {
    trigger();
    if (Object.keys(errors).length > 0) {
      // do nothing since the parent component will show what fields to fill up
      return;
    }

    const { API_KEY, BASIC_AUTH, BEARER_TOKEN, NONE } = AuthorizationTypeEnum;
    const { GET, POST } = RequestMethodEnum;
    const authorizationType = getValues("authorization_type");
    const queryParams = getValues("query_parameters");
    const requestMethod = getValues("request_method");

    if (requestMethod === GET && queryParams) {
      const jsonQueryParams = JSON.parse(queryParams);

      if (authorizationType === API_KEY) {
        //pass
      }

      if (authorizationType === BASIC_AUTH) {
        try {
          const { data: requestData } = await basicAuthGetRequest({
            username: getValues("basic_auth_username") ?? "",
            password: getValues("basic_auth_password") ?? "",
            queryParams: jsonQueryParams,
            url: getValues("api_endpoint"),
          });

          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === BEARER_TOKEN) {
        try {
          const { data: requestData } = await bearerGetRequest({
            bearerToken: getValues("bearer_auth_bearer_token") ?? "",
            queryParams: jsonQueryParams,
            url: getValues("api_endpoint"),
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === NONE) {
        //pass
      }
    }

    if (requestMethod === POST && requestMethod) {
      // again dir
    }
  };

  return (
    <>
      <Button size="md" onClick={handleTest}>
        Test
      </Button>
    </>
  );
};

export default TestSchoolListApiButton;
