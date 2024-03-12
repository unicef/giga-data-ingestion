import { Dispatch, SetStateAction } from "react";



import { Button } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import "@tanstack/react-query";
import { isPlainObject } from "lodash";



import { api } from "@/api";
import { useStore } from "@/context/store";
import { AuthorizationTypeEnum, RequestMethodEnum } from "@/types/qos";


interface TestApiButtonProps {
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
  hasError: boolean;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDatakey: Dispatch<SetStateAction<boolean>>;
  authorizationType: AuthorizationTypeEnum;
  dataKey: string;
  apiKeyName: string | null;
  apiKeyValue: string | null;
  basicAuthUserName: string | null;
  basicAuthPassword: string | null;
  apiEndpoint: string;
  bearerAuthBearerToken: string | null;
  queryParams: string | null;
  requestBody: string | null;
  requestMethod: RequestMethodEnum;
  handleTriggerValidation: () => void;
}

const TestApiButton = ({
  hasError,
  setIsValidResponse,
  setIsResponseError,
  setResponsePreview,
  setIsValidDatakey,
  authorizationType,
  dataKey,
  apiKeyName,
  apiKeyValue,
  basicAuthUserName,
  basicAuthPassword,
  apiEndpoint,
  bearerAuthBearerToken,
  handleTriggerValidation,
  queryParams,
  requestBody,
  requestMethod,
}: TestApiButtonProps) => {
  const {
    apiIngestionSliceActions: { setDetectedColumns },
  } = useStore();
  const { API_KEY, BASIC_AUTH, BEARER_TOKEN, NONE } = AuthorizationTypeEnum;
  const { GET, POST } = RequestMethodEnum;

  const { mutateAsync: apiKeyRequest } = useMutation({
    mutationKey: ["api_key_request"],
    mutationFn: api.externalRequests.apiKeyAuthRequest,
  });

  const { mutateAsync: bearerRequest } = useMutation({
    mutationKey: ["bearer_request"],
    mutationFn: api.externalRequests.bearerRequest,
  });

  const { mutateAsync: basicAuthRequest } = useMutation({
    mutationKey: ["basic_request"],
    mutationFn: api.externalRequests.basicAuthRequest,
  });

  const { mutateAsync: noAuthRequest } = useMutation({
    mutationKey: ["no_auth_request"],
    mutationFn: api.externalRequests.noAuthRequest,
  });

  // eslint-disable-next-line
  const handleValidationTry = (responseData: any) => {
    if (dataKey === "") {
      if (!Array.isArray(responseData)) {
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
          setResponsePreview("invalid");
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
    handleTriggerValidation();

    if (hasError) {
      return;
    }

    if (requestMethod === GET && queryParams) {
      const jsonQueryParams = JSON.parse(queryParams);

      if (authorizationType === API_KEY) {
        try {
          const { data: requestData } = await apiKeyRequest({
            apiKeyName: apiKeyName ?? "",
            apiKeyValue: apiKeyValue ?? "",
            method: "GET",
            queryParams: jsonQueryParams,
            url: apiEndpoint,
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === BASIC_AUTH) {
        try {
          const { data: requestData } = await basicAuthRequest({
            method: "GET",
            username: basicAuthUserName ?? "",
            password: basicAuthPassword ?? "",
            queryParams: jsonQueryParams,
            url: apiEndpoint,
          });

          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === BEARER_TOKEN) {
        try {
          const { data } = await bearerRequest({
            method: "GET",
            bearerToken: bearerAuthBearerToken ?? "",
            queryParams: jsonQueryParams,
            url: apiEndpoint,
          });
          handleValidationTry(data);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === NONE) {
        try {
          const { data: requestData } = await noAuthRequest({
            method: "GET",
            queryParams: jsonQueryParams,
            url: apiEndpoint,
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

      if (authorizationType === API_KEY) {
        try {
          const { data: requestData } = await apiKeyRequest({
            apiKeyName: apiKeyName ?? "",
            apiKeyValue: apiKeyValue ?? "",
            method: "POST",
            queryParams: jsonQueryParams,
            requestBody: jsonRequestBody,
            url: apiEndpoint,
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === BASIC_AUTH) {
        try {
          const { data: requestData } = await basicAuthRequest({
            method: "POST",
            username: basicAuthUserName ?? "",
            password: basicAuthPassword ?? "",
            queryParams: jsonQueryParams,
            requestBody: jsonRequestBody,
            url: apiEndpoint,
          });

          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === BEARER_TOKEN) {
        try {
          const { data: requestData } = await bearerRequest({
            method: "GET",
            bearerToken: bearerAuthBearerToken ?? "",
            queryParams: jsonQueryParams,
            requestBody: jsonRequestBody,
            url: apiEndpoint,
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
      }

      if (authorizationType === NONE) {
        try {
          const { data: requestData } = await noAuthRequest({
            method:"POST",
            queryParams: jsonQueryParams,
            requestBody: jsonRequestBody,
            url: apiEndpoint,
          });
          handleValidationTry(requestData);
        } catch {
          handleValidationCatch();
        }
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

export default TestApiButton;