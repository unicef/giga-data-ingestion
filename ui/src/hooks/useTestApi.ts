import { type Dispatch, type SetStateAction, useCallback, useState } from "react";
import type { UseFormGetValues } from "react-hook-form";

import { AxiosError, type AxiosRequestConfig } from "axios";
import { isMatch, parseISO } from "date-fns";
import { isPlainObject } from "lodash-es";

import { api, axi } from "@/api";
import { useStore } from "@/context/store";
import type {
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";
import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  SendQueryInEnum,
} from "@/types/qos";
import { getTestSchoolId } from "@/utils/string";

type TestApiOptions = {
  setResponsePreview: Dispatch<
    SetStateAction<Record<string, unknown> | Record<string, unknown>[] | string>
  >;
  setIsValidResponse: Dispatch<SetStateAction<boolean>>;
  setIsResponseError: Dispatch<SetStateAction<boolean>>;
  setIsValidDataKey: Dispatch<SetStateAction<boolean>>;
} & (
  | {
      apiType: "schoolList";
      getValues: UseFormGetValues<SchoolListFormSchema>;
    }
  | {
      apiType: "schoolConnectivity";
      getValues: UseFormGetValues<SchoolConnectivityFormSchema>;
      setIsValidResponseDateFormat: Dispatch<SetStateAction<boolean>>;
      setIsValidSchoolIdGigaGovtKey: Dispatch<SetStateAction<boolean>>;
    }
);

export function useTestApi() {
  const {
    apiIngestionSliceActions: { setDetectedColumns, setTestSchoolId },
    apiIngestionSlice: { testSchoolId },
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const testApi = useCallback(
    async (options: TestApiOptions) => {
      const {
        setIsValidResponse,
        setIsResponseError,
        setResponsePreview,
        setIsValidDataKey,
        apiType,
        getValues,
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
        school_id_key,
        size,
      } = getValues();

      let date_key: string | null = null;
      let date_format: string | null = null;
      let send_date_in: SendQueryInEnum = SendQueryInEnum.NONE;
      let test_date_value: string | null = null;
      let response_date_format: string | undefined;
      let response_date_key: string | undefined;
      let school_id_giga_govt_key: string;
      let school_id_send_query_in: SendQueryInEnum = SendQueryInEnum.NONE;
      let setIsValidResponseDateFormat: Extract<
        TestApiOptions,
        { apiType: "schoolConnectivity" }
      >["setIsValidResponseDateFormat"];
      let setIsValidGigaGovtSchoolIdKey: Extract<
        TestApiOptions,
        { apiType: "schoolConnectivity" }
      >["setIsValidSchoolIdGigaGovtKey"];

      if (apiType === "schoolConnectivity") {
        date_format = getValues("date_format");
        date_key = getValues("date_key");
        send_date_in = getValues("send_date_in");
        test_date_value = getValues("test_date_value");
        response_date_key = getValues("response_date_key");
        response_date_format = getValues("response_date_format");
        school_id_giga_govt_key = getValues("school_id_giga_govt_key");
        school_id_send_query_in = getValues("school_id_send_query_in");
        setIsValidResponseDateFormat = options.setIsValidResponseDateFormat;
        setIsValidGigaGovtSchoolIdKey = options.setIsValidSchoolIdGigaGovtKey;
      }

      const handleValidationTry =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (responseData: any) => {
          let formattedResponseData = responseData;

          setResponsePreview(responseData);

          if (data_key === "" || data_key == null) {
            setIsValidDataKey(true);
            setIsValidResponse(true);
            setIsResponseError(false);

            if (Object.prototype.hasOwnProperty.call(responseData, "")) {
              formattedResponseData = [responseData[""]];
              setResponsePreview(formattedResponseData);
            }

            if (Array.isArray(formattedResponseData)) {
              if (apiType === "schoolList") {
                if (school_id_key) {
                  const testSchoolIdKey = getTestSchoolId(
                    formattedResponseData,
                    data_key,
                    school_id_key,
                  );

                  setTestSchoolId(testSchoolIdKey);
                }
                setDetectedColumns(Object.keys(formattedResponseData[0]));
              }

              if (apiType === "schoolConnectivity") {
                setIsValidGigaGovtSchoolIdKey(
                  Object.keys(formattedResponseData[0]).includes(
                    school_id_giga_govt_key,
                  ),
                );
              }
            } else {
              if (apiType === "schoolConnectivity") {
                setIsValidGigaGovtSchoolIdKey(
                  Object.keys(formattedResponseData).includes(school_id_giga_govt_key),
                );
              }
            }

            if (apiType === "schoolConnectivity") {
              let responseDateKeyValue: string;

              if (Array.isArray(formattedResponseData)) {
                responseDateKeyValue = formattedResponseData[0][
                  response_date_key ?? ""
                ] as string;
              } else {
                responseDateKeyValue = formattedResponseData[
                  response_date_key ?? ""
                ] as string;
              }
              if (response_date_key) {
                const castResponseDateKeyValue = String(responseDateKeyValue);

                if (response_date_format === "timestamp") {
                  setIsValidResponseDateFormat(isMatch(castResponseDateKeyValue, "t"));
                } else if (response_date_format === "ISO8601") {
                  setIsValidResponseDateFormat(!!parseISO(castResponseDateKeyValue));
                } else {
                  const { data: isValid } =
                    await api.utils.isValidDateTimeFormatCodeRequest({
                      datetime_str: castResponseDateKeyValue,
                      format_code: response_date_format ?? "",
                    });

                  setIsValidResponseDateFormat(isValid);
                }
              } else {
                setIsValidResponseDateFormat(false);
              }
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
                if (apiType === "schoolList") {
                  setDetectedColumns(Object.keys(responseData[data_key][0]));

                  if (school_id_key) {
                    const testSchoolIdKey = getTestSchoolId(
                      formattedResponseData,
                      data_key,
                      school_id_key,
                    );

                    setTestSchoolId(testSchoolIdKey);
                  }
                }
                setIsValidDataKey(true);
              } else {
                setIsValidDataKey(false);
              }

              if (apiType === "schoolConnectivity") {
                const responseDateKeyValue = responseData[data_key][0][
                  response_date_key ?? ""
                ] as string;

                if (response_date_format === "timestamp") {
                  setIsValidResponseDateFormat(isMatch(responseDateKeyValue, "t"));
                } else if (response_date_format === "ISO8601") {
                  setIsValidResponseDateFormat(!!parseISO(responseDateKeyValue));
                } else {
                  const { data: isValid } =
                    await api.utils.isValidDateTimeFormatCodeRequest({
                      datetime_str: responseDateKeyValue,
                      format_code: response_date_format ?? "",
                    });

                  setIsValidResponseDateFormat(isValid);
                }

                setIsValidGigaGovtSchoolIdKey(
                  Object.keys(responseData[data_key][0]).includes(
                    school_id_giga_govt_key,
                  ),
                );
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

      if (testSchoolId) {
        if (school_id_send_query_in === SendQueryInEnum.QUERY_PARAMETERS) {
          if (requestConfig.params == null)
            requestConfig.params = { [school_id_key as string]: testSchoolId };
          else Object.assign(requestConfig.params, paginationParams);
        } else if (school_id_send_query_in === SendQueryInEnum.BODY) {
          if (requestConfig.data == null)
            requestConfig.data = { [school_id_key as string]: testSchoolId };
          else Object.assign(requestConfig.data, paginationParams);
        }
      }

      if (date_format) {
        let dateValue: string;

        if (test_date_value) {
          dateValue = test_date_value;
        } else {
          const { data: dateString } = await api.utils.format_date({
            format_code: date_format,
          });
          dateValue = dateString;
        }

        if (send_date_in === SendQueryInEnum.QUERY_PARAMETERS) {
          if (requestConfig.params == null)
            requestConfig.params = { [date_key as string]: dateValue };
          else Object.assign(requestConfig.params, paginationParams);
        } else if (send_date_in === SendQueryInEnum.BODY) {
          if (requestConfig.data == null)
            requestConfig.params = { [date_key as string]: dateValue };
          else Object.assign(requestConfig.data, paginationParams);
        }
      }

      try {
        setIsLoading(true);

        const res = await axi.post("/utils/forward_request", {
          auth: requestConfig.auth || null,
          method: requestConfig.method,
          url: requestConfig.url,
          params: requestConfig.params || null,
          data: requestConfig.data || null,
          headers: requestConfig.headers || null,
        });

        await handleValidationTry(res.data);
      } catch (e) {
        console.error(e);
        handleValidationCatch(e);
      } finally {
        setIsLoading(false);
      }
    },
    [setDetectedColumns, testSchoolId, setTestSchoolId],
  );

  return { testApi, isLoading };
}
