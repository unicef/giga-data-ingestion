import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { UseFormWatch } from "react-hook-form";

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { isPlainObject } from "lodash-es";

import { useStore } from "@/context/store";
import {
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  SendQueryInEnum,
} from "@/types/qos";

interface TestApiOptions {
  setResponsePreview: Dispatch<SetStateAction<string | string[]>>;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDataKey: Dispatch<SetStateAction<boolean>>;
  watch:
    | UseFormWatch<SchoolListFormSchema>
    | UseFormWatch<SchoolConnectivityFormSchema>;
}

export function useTestApi() {
  const {
    apiIngestionSliceActions: { setDetectedColumns },
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  async function testApi(options: TestApiOptions) {
    const {
      setIsValidResponse,
      setIsResponseError,
      setResponsePreview,
      setIsValidDataKey,
      watch,
    } = options;

    const {
      data_key,
      request_method,
      authorization_type,
      api_endpoint,
      api_auth_api_key,
      api_auth_api_value,
      basic_auth_username,
      basic_auth_password,
      bearer_auth_bearer_token,
      request_body,
      query_parameters,
      pagination_type,
      page_starts_with,
      page_offset_key,
      page_size_key,
      page_number_key,
      page_send_query_in,
      size,
    } = watch();

    const handleValidationTry =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (responseData: any) => {
        setResponsePreview(responseData);

        if (data_key === "" || data_key == null) {
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
            const keyExists = !!responseData[data_key];

            const isValidDataKey =
              keyExists &&
              Array.isArray(responseData[data_key]) &&
              Object.keys(responseData[data_key][0]).length > 0 &&
              isPlainObject(responseData[data_key][0]);

            setIsResponseError(false);
            setIsValidResponse(true);

            if (isValidDataKey) {
              setDetectedColumns(Object.keys(responseData[data_key][0]));
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
      if (e instanceof AxiosError && e.response) {
        if (e.response) {
          setResponsePreview(
            `${e.response.status} ${e.response.statusText}\n${e.response.data}`,
          );
        } else {
          setResponsePreview(e.message);
        }
      } else {
        setResponsePreview(String(e));
      }

      setIsResponseError(true);
      setIsValidDataKey(false);
      setIsValidResponse(false);
    };

    const requestConfig: AxiosRequestConfig = {
      method: request_method,
      url: api_endpoint,
      withCredentials: false,
      params:
        (typeof query_parameters === "string"
          ? query_parameters === ""
            ? undefined
            : JSON.parse(query_parameters)
          : query_parameters) ?? undefined,
      data:
        (typeof request_body === "string"
          ? request_body === ""
            ? undefined
            : JSON.parse(request_body)
          : request_body) ?? undefined,
    };

    switch (authorization_type) {
      case AuthorizationTypeEnum.API_KEY: {
        requestConfig.headers = {
          ...requestConfig.headers,
          [api_auth_api_key!]: api_auth_api_value,
        };
        break;
      }
      case AuthorizationTypeEnum.BASIC_AUTH: {
        requestConfig.auth = {
          username: basic_auth_username!,
          password: basic_auth_password!,
        };
        break;
      }
      case AuthorizationTypeEnum.BEARER_TOKEN: {
        requestConfig.headers = {
          ...requestConfig.headers,
          Authorization: `Bearer ${bearer_auth_bearer_token}`,
        };
        break;
      }
    }

    let paginationParams: Record<string, unknown> | undefined = undefined;

    switch (pagination_type) {
      case PaginationTypeEnum.PAGE_NUMBER: {
        paginationParams = {
          [page_number_key!]: page_starts_with,
          [page_size_key!]: size,
        };

        break;
      }
      case PaginationTypeEnum.LIMIT_OFFSET: {
        paginationParams = {
          [page_size_key!]: size,
          [page_offset_key!]: page_starts_with! * size!,
        };
        break;
      }
    }

    if (page_send_query_in === SendQueryInEnum.QUERY_PARAMETERS) {
      if (requestConfig.params == null) requestConfig.params = paginationParams;
      else Object.assign(requestConfig.params, paginationParams);
    } else if (
      page_send_query_in === SendQueryInEnum.BODY &&
      request_method === "GET"
    ) {
      if (requestConfig.data == null) requestConfig.params = paginationParams;
      else Object.assign(requestConfig.data, paginationParams);
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
