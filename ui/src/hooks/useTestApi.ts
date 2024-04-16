import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { FieldValues, UseFormWatch } from "react-hook-form";

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { isPlainObject } from "lodash-es";

import { useStore } from "@/context/store";
import { AuthorizationTypeEnum } from "@/types/qos";

interface TestApiOptions<T extends FieldValues> {
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDataKey: Dispatch<SetStateAction<boolean>>;
  watch: UseFormWatch<T>;
}

export function useTestApi<T extends FieldValues>() {
  const {
    apiIngestionSliceActions: { setDetectedColumns },
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  async function testApi(options: TestApiOptions<T>) {
    const {
      setIsValidResponse,
      setIsResponseError,
      setResponsePreview,
      setIsValidDataKey,
      watch,
    } = options;

    const dataKey = watch("data_key");
    const requestMethod = watch("request_method");
    const apiKeyName = watch("api_auth_api_key");
    const apiKeyValue = watch("api_auth_api_value");
    const authorizationType = watch("authorization_type");
    const basicAuthUserName = watch("basic_auth_username");
    const basicAuthPassword = watch("basic_auth_password");
    const bearerAuthBearerToken = watch("bearer_auth_bearer_token");
    const apiEndpoint = watch("api_endpoint");
    const queryParams = watch("query_parameters");
    const requestBody = watch("request_body");

    const handleValidationTry =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (responseData: any) => {
        setResponsePreview(responseData);

        if (dataKey === "" || dataKey == null) {
          if (Array.isArray(responseData)) {
            setIsValidDataKey(true);
            setIsValidResponse(true);
            setIsResponseError(false);
            setDetectedColumns(Object.keys(responseData[0]));
          } else {
            setIsValidDataKey(false);
          }
        } else {
          if (!Array.isArray(responseData)) {
            const keyExists = !!responseData[dataKey];

            const isValidDataKey =
              keyExists &&
              Array.isArray(responseData[dataKey]) &&
              Object.keys(responseData[dataKey][0]).length > 0 &&
              isPlainObject(responseData[dataKey][0]);

            setIsResponseError(false);
            setIsValidResponse(true);

            if (isValidDataKey) {
              setDetectedColumns(Object.keys(responseData[dataKey][0]));
              setIsValidDataKey(true);
              return;
            }

            if (!isValidDataKey) {
              setIsValidDataKey(false);
              return;
            }
          }
        }
      };

    const handleValidationCatch = (e: unknown) => {
      if (e instanceof AxiosError) {
        setResponsePreview(e.response?.data ?? e.message);
      } else {
        setResponsePreview(String(e));
      }

      setIsResponseError(true);
      setIsValidDataKey(false);
      setIsValidResponse(false);
    };

    const requestConfig: AxiosRequestConfig = {
      method: requestMethod,
      url: apiEndpoint,
      withCredentials: false,
      params:
        (typeof queryParams === "string"
          ? queryParams === ""
            ? undefined
            : JSON.parse(queryParams)
          : queryParams) ?? undefined,
      data:
        (typeof requestBody === "string"
          ? requestBody === ""
            ? undefined
            : JSON.parse(requestBody)
          : requestBody) ?? undefined,
    };

    switch (authorizationType) {
      case AuthorizationTypeEnum.API_KEY: {
        requestConfig.headers = {
          ...requestConfig.headers,
          [apiKeyName!]: apiKeyValue,
        };
        break;
      }
      case AuthorizationTypeEnum.BASIC_AUTH: {
        requestConfig.auth = {
          username: basicAuthUserName!,
          password: basicAuthPassword!,
        };
        break;
      }
      case AuthorizationTypeEnum.BEARER_TOKEN: {
        requestConfig.headers = {
          ...requestConfig.headers,
          Authorization: `Bearer ${bearerAuthBearerToken}`,
        };
        break;
      }
    }

    try {
      setIsLoading(true);
      const res = await axios(requestConfig);
      handleValidationTry(res.data);
    } catch (e) {
      handleValidationCatch(e);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    testApi: useCallback(testApi, [setDetectedColumns]),
    isLoading,
  };
}
