import { Dispatch, SetStateAction } from "react";
import {
  UseFormGetValues,
  UseFormStateReturn,
  UseFormTrigger,
} from "react-hook-form";

import { Button } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import "@tanstack/react-query";
import { isPlainObject } from "lodash";

import { api } from "@/api";
import { useQosStore } from "@/context/qosStore";
import {
  AuthorizationTypeEnum,
  RequestMethodEnum,
  SchoolConnectivityFormValues,
} from "@/types/qos";

interface TestSchoolListApiButtonProps {
  formState: UseFormStateReturn<SchoolConnectivityFormValues>;
  getValues: UseFormGetValues<SchoolConnectivityFormValues>;
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
  trigger: UseFormTrigger<SchoolConnectivityFormValues>;

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
  const { API_KEY, BASIC_AUTH, BEARER_TOKEN, NONE } = AuthorizationTypeEnum;
  const { GET, POST } = RequestMethodEnum;
  const authorizationType = getValues("authorization_type");
  const queryParams = getValues("query_parameters");
  const requestBody = getValues("request_body");
  const requestMethod = getValues("request_method");

  const { mutateAsync: apiKeyGetRequest } = useMutation({
    mutationKey: ["api_key_get_request"],
    mutationFn: api.externalRequests.apiKeyAuthGetRequest,
  });

  const { mutateAsync: bearerGetRequest } = useMutation({
    mutationKey: ["bearer_get_request"],
    mutationFn: api.externalRequests.bearerGetRequest,
  });

  const { mutateAsync: basicAuthGetRequest } = useMutation({
    mutationKey: ["basic_get_request"],
    mutationFn: api.externalRequests.basicAuthGetRequest,
  });

  const { mutateAsync: noAuthGetRequest } = useMutation({
    mutationKey: ["none_get_request"],
    mutationFn: api.externalRequests.noneAuthGetRequest,
  });

  const { mutateAsync: beaerPostRequest } = useMutation({
    mutationKey: ["bearer_post_request"],
    mutationFn: api.externalRequests.bearerPostRequest,
    onMutate: () => {},
  });
  // eslint-disable-next-line
  const handleValidationTry = (responseData: any) => {
    const dataKey = getValues("data_key");

    if (dataKey === "") {
      if (!Array.isArray(responseData)) {
        // if the to level is not an array, MUST have datakey
        setResponsePreview("invalid");
        setIsValidDatakey(false);
      }

      if (Array.isArray(responseData)) {
        setIsValidDatakey(true);
        setResponsePreview(responseData);
        setDetectedColumns(Object.keys(responseData[0]));
      }
    }

    if (dataKey !== "") {
      if (!Array.isArray(responseData)) {
        // if the to level is not an array, MUST have datakey

        const keyExists = !!responseData[dataKey];

        const isValidDatakey =
          keyExists &&
          Array.isArray(responseData[dataKey]) &&
          Object.keys(responseData[dataKey][0]).length > 0 &&
          isPlainObject(responseData[dataKey][0]);

        setIsResponseError(false);
        setIsValidResponse(true);

        if (isValidDatakey) {
          setDetectedColumns(Object.keys(responseData[dataKey][0]));
          setResponsePreview(responseData);
          setIsValidDatakey(true);
          return;
        }

        if (!isValidDatakey) {
          setIsValidDatakey(false);
          setResponsePreview("");
          return;
        }
      }
    }
  };

  const handleValidationCatch = () => {
    setResponsePreview("invalid");
    setIsResponseError(true);
    setIsValidDatakey(false);
    setIsValidResponse(false);
  };

  const handleOnClick = async () => {
    trigger();

    if (Object.keys(errors).length > 0) {
      // do nothing since the parent component will show what fields to fill up
      return;
    }

    if (requestMethod === GET && queryParams) {
      const jsonQueryParams = JSON.parse(queryParams);

      if (authorizationType === API_KEY) {
        try {
          const { data: requestData } = await apiKeyGetRequest({
            apiKeyName: getValues("api_auth_api_key") ?? "",
            apiKeyValue: getValues("api_auth_api_value") ?? "",

            queryParams: jsonQueryParams,
            url: getValues("api_endpoint"),
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
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
          const { data } = await bearerGetRequest({
            bearerToken: getValues("bearer_auth_bearer_token") ?? "",
            queryParams: jsonQueryParams,
            url: getValues("api_endpoint"),
          });
          handleValidationTry(data);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === NONE) {
        try {
          const { data: requestData } = await noAuthGetRequest({
            queryParams: jsonQueryParams,
            url: getValues("api_endpoint"),
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }
    }

    if (requestMethod === POST && queryParams && requestBody) {
      const jsonQueryParams = JSON.parse(queryParams);
      const jsonRequestBody = JSON.parse(requestBody);

      if (authorizationType === BEARER_TOKEN) {
        try {
          const { data: requestData } = await beaerPostRequest({
            bearerToken: getValues("bearer_auth_bearer_token") ?? "",

            queryParams: jsonQueryParams,
            requestBody: jsonRequestBody,
            url: getValues("api_endpoint"),
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === NONE) {
        // pass
      }
    }
  };

  return (
    <>
      <Button size="md" onClick={handleOnClick}>
        Test
      </Button>
    </>
  );
};

export default TestSchoolListApiButton;
